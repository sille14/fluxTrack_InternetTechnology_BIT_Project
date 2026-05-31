// =============================================================
// fluxTrack - products.js
// Drives the Product Overview page (server-side paginated).
//   - Fetches one page from /product/page with search/filter params
//   - Search input is debounced (300ms); filter change resets to page 0
//   - +/- quantity adjustment (PUT /product/{id} or POST /order/sale)
//   - "Add new product" modal (POST /product/add)
//   - Edit modal reuses the same form; submit goes to PUT /product/{id}
//   - Admin-only partner picker in the modal
//   - Per-partner placeholder text in the modal (wine vs. board games)
//   - Row checkboxes with select-all (page-scoped) + bulk delete
//   - Selected IDs persist across page changes via a Set
//   - Delete with confirmation (single + bulk); refetches current page
// =============================================================

requireAuth();

// ----- Pagination state -----
const PAGE_SIZE = 10;
let currentPage = 0;
let totalPages  = 0;

// Active filter values — set before calling loadProductsPage()
let currentSearch = '';
let currentFilter = '';
let currentPartner = '';

// Products visible on the current page
let currentPageProducts = [];

// ----- Supporting state -----
const partnerLookup = {};   // { partnerID: partnerName } — fetched once
const profile = getCachedProfile();
 const isAdmin = profile && profile.role === 'ADMIN';

// Selection persists across page changes. Bulk delete operates on every
// productID in this Set, regardless of which page the row was checked on.
const selectedProductIds = new Set();

// Drives the confirm-delete modal: 1-element for single, multi for bulk.
let pendingProductDeleteIds = [];

// When set, the new/edit modal is in edit mode and submit will PUT instead of POST.
let editingProduct = null;

// Debounce timer for the search input — avoids hammering the server on every keystroke.
let searchDebounce = null;
const SEARCH_DEBOUNCE_MS = 300;

// -------------------------------------------------------------
// Per-partner placeholder text for the "Add new product" modal.
// Wylaade sells wine; Drachehöhli sells board games. Showing
// partner-appropriate examples makes the form feel native.
// Admin sees generic placeholders until they pick a partner.
// -------------------------------------------------------------
const USERNAME_TO_PARTNER_ID = {
    'wylaade': 1,
    'drachehoehli': 2,
};

const PARTNER_PLACEHOLDERS = {
    1: { // Wylaade — wine
        name:     'E.g. Baselbieter Kerner 2022',
        sku:      'E.g. 00083',
        price:    'E.g. 26.80',
        quantity: 'E.g. 34',
    },
    2: { // Drachehöhli — board games
        name:     'E.g. Catan – Seafarers Expansion',
        sku:      'E.g. 00187',
        price:    'E.g. 49.90',
        quantity: 'E.g. 12',
    },
};

const GENERIC_PLACEHOLDERS = {
    name:     'E.g. Product name',
    sku:      'E.g. 00100',
    price:    'E.g. 19.90',
    quantity: 'E.g. 20',
};

function applyPlaceholders(partnerId) {
    const set = PARTNER_PLACEHOLDERS[partnerId] || GENERIC_PLACEHOLDERS;
    document.getElementById('productName').placeholder     = set.name;
    document.getElementById('productSKU').placeholder      = set.sku;
    document.getElementById('productPrice').placeholder    = set.price;
    document.getElementById('productQuantity').placeholder = set.quantity;
}

// -------------------------------------------------------------
// Data loading
// -------------------------------------------------------------
async function loadPartners() {
    try {
        const res = await authFetch('/partner/');
        if (!res || !res.ok) return;
        const partners = await res.json();
        partners.forEach(p => { partnerLookup[p.partnerID] = p.partnerName; });

        if (isAdmin) {
            const select = document.getElementById('productPartnerID');
            const group = document.getElementById('partner-picker-group');
            partners.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.partnerID;
                opt.textContent = p.partnerName;
                select.appendChild(opt);
            });
            group.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Failed to load partners', err);
    }
}

// Fetch one page from the server. Always reads currentPage / currentSearch /
// currentFilter — callers set those first if they want a different slice.
async function loadProductsPage() {
    const tbody = document.getElementById('products-tbody');
    const params = new URLSearchParams({
        page: String(currentPage),
        size: String(PAGE_SIZE),
    });
    if (currentSearch) params.set('search', currentSearch);
    if (currentFilter) params.set('filter', currentFilter);

    try {
        const res = await authFetch('/product/page?' + params.toString());
        if (!res) return;
        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Failed to load products (HTTP ${res.status})</td></tr>`;
            return;
        }
        const data = await res.json();
        currentPageProducts = data.content || [];
        totalPages = data.totalPages || 0;

        // If a delete emptied the last page and we're not already at 0, step back.
        if (currentPageProducts.length === 0 && currentPage > 0 && totalPages > 0) {
            currentPage = Math.max(0, totalPages - 1);
            await loadProductsPage();
            return;
        }

        // renderProducts() restores checkbox state from selectedProductIds on every
        // render, so cross-page selections survive page changes automatically.
        renderProducts(currentPageProducts);
        renderPagination();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Failed to load products</td></tr>`;
    }
}

// -------------------------------------------------------------
// Rendering
// -------------------------------------------------------------
function renderProducts(products) {
    const tbody = document.getElementById('products-tbody');
    if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No products found</td></tr>`;
        updateBulkActionBar();
        return;
    }
    tbody.innerHTML = products.map(p => {
        const qty = p.productQuantity ?? 0;
        const inStock = qty > 0;
        const partnerName = partnerLookup[p.productPartnerID] ?? '—';
        const price = (p.productPrice ?? 0).toFixed(2);
        const isChecked = selectedProductIds.has(String(p.productID));
        return `
            <tr>
                <td><input type="checkbox" data-id="${p.productID}" ${isChecked ? 'checked' : ''}></td>
                <td>${escapeHtml(p.productSKU || '')}</td>
                <td>${escapeHtml(p.productName || '')}</td>
                <td>${escapeHtml(partnerName)}</td>
                <td>${price}</td>
                <td>${qty}</td>
                <td>
                    <button class="qty-btn" data-id="${p.productID}" data-delta="1" aria-label="Increase quantity">+</button>
                    <button class="qty-btn" data-id="${p.productID}" data-delta="-1" aria-label="Decrease quantity" ${qty <= 0 ? 'disabled' : ''}>-</button>
                </td>
                <td>
                    <span class="status-pill ${inStock ? 'in-stock' : 'out-of-stock'}">
                        ${inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                </td>
                <td>
                    <button class="row-action product-edit-btn" data-id="${p.productID}" title="Edit">✏️</button>
                    <button class="row-action product-delete-btn" data-id="${p.productID}" title="Delete">🗑</button>
                </td>
            </tr>`;
    }).join('');
    updateBulkActionBar();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    const prev      = document.getElementById('page-prev');
    const next      = document.getElementById('page-next');
    const indicator = document.getElementById('page-indicator');

    if (totalPages <= 1) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');
    prev.disabled = currentPage <= 0;
    next.disabled = currentPage >= totalPages - 1;
    indicator.textContent = `Page ${currentPage + 1} of ${totalPages}`;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

// -------------------------------------------------------------
// Search & filter — any change resets to page 0 and refetches
// -------------------------------------------------------------
function onFilterChange() {
    currentSearch = document.getElementById('search-input').value.trim();
    currentFilter = document.getElementById('filter-select').value;
    currentPage = 0;
    loadProductsPage();
}

function onSearchInput() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(onFilterChange, SEARCH_DEBOUNCE_MS);
}

document.getElementById('search-btn').addEventListener('click', () => {
    clearTimeout(searchDebounce);
    onFilterChange();
});
document.getElementById('search-input').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(searchDebounce);
        onFilterChange();
    }
});
document.getElementById('search-input').addEventListener('input', onSearchInput);
document.getElementById('filter-select').addEventListener('change', onFilterChange);

// -------------------------------------------------------------
// Pagination button handlers
// -------------------------------------------------------------
document.getElementById('page-prev').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        loadProductsPage();
    }
});
document.getElementById('page-next').addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
        currentPage++;
        loadProductsPage();
    }
});

// -------------------------------------------------------------
// Row actions: edit + delete + qty buttons (event delegation)
// -------------------------------------------------------------
document.getElementById('products-tbody').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.product-edit-btn');
    if (editBtn) {
        const product = currentPageProducts.find(p => String(p.productID) === editBtn.dataset.id);
        if (product) openEditModal(product);
        return;
    }

    const deleteBtn = e.target.closest('.product-delete-btn');
    if (deleteBtn) {
        openProductDeleteModal(deleteBtn.dataset.id);
        return;
    }

    const btn = e.target.closest('.qty-btn');
    if (!btn || btn.disabled) return;

    const id    = btn.dataset.id;
    const delta = parseInt(btn.dataset.delta, 10);
    const product = currentPageProducts.find(p => String(p.productID) === id);
    if (!product) return;

    btn.disabled = true;

    if (delta < 0) {
        // Decrement = record a sale (creates an Order, decrements stock atomically)
        const res = await authFetch('/order/sale', {
            method: 'POST',
            body: JSON.stringify({ productID: product.productID, quantity: 1 }),
        });
        if (res && res.ok) {
            await loadProductsPage();
        } else {
            console.error('Failed to record sale', res && res.status);
            btn.disabled = false;
        }
        return;
    }

    // Increment = restock (no order recorded, pure inventory PUT)
    const updated = {
        productID: product.productID,
        productName: product.productName,
        productSKU: product.productSKU,
        productPrice: product.productPrice,
        productQuantity: (product.productQuantity ?? 0) + delta,
        productPartnerID: product.productPartnerID,
    };
    const res = await authFetch(`/product/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
    });
    if (res && res.ok) {
        await loadProductsPage();
    } else {
        console.error('Failed to update quantity', res && res.status);
        btn.disabled = false;
    }
});

// -------------------------------------------------------------
// Checkbox handling: select-all (page-scoped) + per-row
// -------------------------------------------------------------
document.getElementById('select-all').addEventListener('change', (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('#products-tbody input[type="checkbox"]').forEach(cb => {
        cb.checked = checked;
        if (checked) {
            selectedProductIds.add(cb.dataset.id);
        } else {
            selectedProductIds.delete(cb.dataset.id);
        }
    });
    updateBulkActionBar();
});

document.getElementById('products-tbody').addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    if (cb.checked) {
        selectedProductIds.add(cb.dataset.id);
    } else {
        selectedProductIds.delete(cb.dataset.id);
    }
    updateBulkActionBar();
});

// The count label shows the GLOBAL selection (across all pages) so the user
// knows they still have selections on other pages. Tri-state reflects the
// current page only (what's visible).
function updateBulkActionBar() {
    const visibleCheckboxes = document.querySelectorAll('#products-tbody input[type="checkbox"]');
    const checkedCount  = Array.from(visibleCheckboxes).filter(cb => cb.checked).length;
    const totalVisible  = visibleCheckboxes.length;
    const totalSelected = selectedProductIds.size;

    const bar = document.getElementById('bulk-action-bar');
    const countLabel = document.getElementById('bulk-action-count');
    if (totalSelected > 0) {
        bar.classList.remove('hidden');
        countLabel.textContent = `${totalSelected} selected`;
    } else {
        bar.classList.add('hidden');
    }

    const selectAll = document.getElementById('select-all');
    if (totalVisible === 0 || checkedCount === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    } else if (checkedCount === totalVisible) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = true;
    }
}

document.getElementById('bulk-delete-btn').addEventListener('click', () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    openBulkDeleteModal(ids);
});

// -------------------------------------------------------------
// New/Edit Product modal
// -------------------------------------------------------------
const modal = document.getElementById('product-modal');
const openBtn = document.getElementById('open-new-product');
const cancelBtn = document.getElementById('cancel-modal');
const productForm = document.getElementById('product-form');
const modalTitleEl = document.getElementById('product-modal-title');

openBtn.addEventListener('click', () => {
    editingProduct = null;
    modalTitleEl.textContent = 'Add new product';
    modal.classList.remove('hidden');
    if (isAdmin) {
        applyPlaceholders(null);
    } else {
        applyPlaceholders(USERNAME_TO_PARTNER_ID[getUser()]);
    }
});

function openEditModal(product) {
    editingProduct = product;
    modalTitleEl.textContent = 'Edit product';
    document.getElementById('productName').value     = product.productName ?? '';
    document.getElementById('productSKU').value      = product.productSKU ?? '';
    document.getElementById('productPrice').value    = product.productPrice ?? '';
    document.getElementById('productQuantity').value = product.productQuantity ?? 0;
    if (isAdmin) {
        document.getElementById('productPartnerID').value = product.productPartnerID ?? '';
        applyPlaceholders(product.productPartnerID);
    } else {
        applyPlaceholders(USERNAME_TO_PARTNER_ID[getUser()]);
    }
    document.getElementById('form-error').textContent = '';
    modal.classList.remove('hidden');
}

cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.getElementById('productPartnerID').addEventListener('change', (e) => {
    const raw = e.target.value;
    applyPlaceholders(raw ? parseInt(raw, 10) : null);
});

function closeModal() {
    modal.classList.add('hidden');
    productForm.reset();
    document.getElementById('form-error').textContent = '';
    editingProduct = null;
    modalTitleEl.textContent = 'Add new product';
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('form-error');
    errorDiv.textContent = '';

    const newProduct = {
        productName: document.getElementById('productName').value.trim(),
        productSKU:  document.getElementById('productSKU').value.trim(),
        productPrice: parseFloat(document.getElementById('productPrice').value),
        productQuantity: parseInt(document.getElementById('productQuantity').value, 10),
    };

    if (isAdmin) {
        const partnerIdRaw = document.getElementById('productPartnerID').value;
        if (!partnerIdRaw) { errorDiv.textContent = 'Please select a partner.'; return; }
        newProduct.productPartnerID = parseInt(partnerIdRaw, 10);
    } else if (editingProduct) {
        newProduct.productPartnerID = editingProduct.productPartnerID;
    }

    if (!newProduct.productName || !newProduct.productSKU) {
        errorDiv.textContent = 'Product Name and SKU are required.'; return;
    }
    if (isNaN(newProduct.productPrice) || isNaN(newProduct.productQuantity)) {
        errorDiv.textContent = 'Price and Quantity must be numbers.'; return;
    }
    if (newProduct.productPrice < 0) {
        errorDiv.textContent = 'Price cannot be negative.'; return;
    }

    let res;
    if (editingProduct) {
        newProduct.productID = editingProduct.productID;
        res = await authFetch(`/product/${editingProduct.productID}`, {
            method: 'PUT',
            body: JSON.stringify(newProduct),
        });
    } else {
        res = await authFetch('/product/add', {
            method: 'POST',
            body: JSON.stringify(newProduct),
        });
    }

    if (res && res.ok) {
        closeModal();
        await loadProductsPage();
    } else {
        const action = editingProduct ? 'update' : 'create';
        errorDiv.textContent = `Could not ${action} product${res ? ` (HTTP ${res.status})` : ''}. Check that all fields are valid.`;
    }
});

// -------------------------------------------------------------
// Delete Product modal (single + bulk)
// -------------------------------------------------------------
const deleteModal     = document.getElementById('product-delete-modal');
const deleteTitleEl   = document.getElementById('product-delete-title');
const deleteMessageEl = document.getElementById('product-delete-message');
const deleteErrorEl   = document.getElementById('product-delete-error');

document.getElementById('cancel-product-delete-btn').addEventListener('click', closeProductDeleteModal);
deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeProductDeleteModal(); });

function openProductDeleteModal(id) {
    const product = currentPageProducts.find(p => String(p.productID) === String(id));
    if (!product) return;
    pendingProductDeleteIds = [String(id)];
    deleteTitleEl.textContent = 'Delete product?';
    deleteMessageEl.textContent = `Are you sure you want to delete "${product.productName}" (SKU ${product.productSKU})? This cannot be undone.`;
    deleteErrorEl.textContent = '';
    deleteModal.classList.remove('hidden');
}

function openBulkDeleteModal(ids) {
    pendingProductDeleteIds = ids.slice();
    const n = ids.length;
    deleteTitleEl.textContent = n === 1 ? 'Delete product?' : 'Delete products?';
    deleteMessageEl.textContent =
        `Are you sure you want to delete ${n} product${n === 1 ? '' : 's'}? This cannot be undone.`;
    deleteErrorEl.textContent = '';
    deleteModal.classList.remove('hidden');
}

function closeProductDeleteModal() {
    pendingProductDeleteIds = [];
    deleteModal.classList.add('hidden');
    deleteErrorEl.textContent = '';
}

document.getElementById('confirm-product-delete-btn').addEventListener('click', async () => {
    if (pendingProductDeleteIds.length === 0) return;

    const results = await Promise.all(
        pendingProductDeleteIds.map(id => authFetch(`/product/${id}`, { method: 'DELETE' }))
    );
    const failed = results.filter(r => !r || !r.ok);
    if (failed.length === 0) {
        pendingProductDeleteIds.forEach(id => selectedProductIds.delete(id));
        closeProductDeleteModal();
        await loadProductsPage();
    } else {
        deleteErrorEl.textContent =
            `${failed.length} of ${pendingProductDeleteIds.length} product(s) could not be deleted.`;
    }
});

// -------------------------------------------------------------
// Initial load
// -------------------------------------------------------------
(async () => {
    await loadPartners();

    // Pre-fill search from URL param (used when arriving from Dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
        document.getElementById('search-input').value = searchParam;
        currentSearch = searchParam;
    }

    await loadProductsPage();
})();