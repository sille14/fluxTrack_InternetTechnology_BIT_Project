// =============================================================
// fluxTrack - orders.js
// Order History view (UC 304), server-side paginated:
//   - Partner: own orders only (server enforces via business rule)
//   - Admin: all orders, with partner filter dropdown
//   - Search by product name, filter by date range
//   - Summary card (count, units, revenue) always reflects the full
//     filtered set, not just the current page — comes from /order/summary
//   - Sorted newest first (server handles the sort)
// =============================================================

requireAuth();

const profile = getCachedProfile();
const isAdmin = profile && profile.role === 'ADMIN';
const partnerLookup = {};

// ----- Pagination state -----
const PAGE_SIZE = 10;
let currentPage  = 0;
let totalPages   = 0;

// Active filter values — read by loadOrdersPage() and loadOrdersSummary()
let currentSearch  = '';
let currentDateFrom = '';
let currentDateTo   = '';
let currentPartner  = '';

// Debounce timer for search input
let searchDebounce = null;
const SEARCH_DEBOUNCE_MS = 300;

// -------------------------------------------------------------
// Build URLSearchParams from the current filter state.
// Shared so /page and /summary always use identical params.
// -------------------------------------------------------------
function buildFilterParams(includePage = false) {
    const params = new URLSearchParams();
    if (currentSearch)   params.set('search',   currentSearch);
    if (currentDateFrom) params.set('dateFrom',  currentDateFrom);
    if (currentDateTo)   params.set('dateTo',    currentDateTo);
    if (isAdmin && currentPartner) params.set('partner', currentPartner);
    if (includePage) {
        params.set('page', String(currentPage));
        params.set('size', String(PAGE_SIZE));
    }
    return params;
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
            const select = document.getElementById('order-partner-filter');
            partners.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.partnerID;
                opt.textContent = p.partnerName;
                select.appendChild(opt);
            });
            document.getElementById('partner-filter-group').classList.remove('hidden');
            document.querySelectorAll('.th-partner').forEach(el => el.classList.remove('hidden'));
        }
    } catch (err) {
        console.error('Failed to load partners', err);
    }
}

// Fetch one page of orders from the server.
async function loadOrdersPage() {
    const tbody = document.getElementById('orders-tbody');
    const params = buildFilterParams(true);

    try {
        const res = await authFetch('/order/page?' + params.toString());
        if (!res) return;
        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Failed to load orders (HTTP ${res.status})</td></tr>`;
            return;
        }
        const data = await res.json();
        const orders = data.content || [];
        totalPages = data.totalPages || 0;

        // Step back if the current page became empty after a filter change
        if (orders.length === 0 && currentPage > 0 && totalPages > 0) {
            currentPage = Math.max(0, totalPages - 1);
            await loadOrdersPage();
            return;
        }

        renderOrders(orders);
        renderPagination();
    } catch (err) {
        console.error('Order page load failed', err);
        const tbody2 = document.getElementById('orders-tbody');
        tbody2.innerHTML = `<tr><td colspan="5" class="table-empty">Failed to load orders</td></tr>`;
    }
}

// Fetch summary aggregations (count, units, revenue) for the same filtered set.
// This is separate from the paged fetch so the summary reflects ALL matching
// orders, not just the current page.
async function loadOrdersSummary() {
    const params = buildFilterParams(false);
    try {
        const res = await authFetch('/order/summary?' + params.toString());
        if (!res || !res.ok) return;
        const summary = await res.json();
        renderSummary(summary);
    } catch (err) {
        console.error('Order summary load failed', err);
    }
}

// Load both in parallel — they hit different endpoints but share the same filters.
async function refresh() {
    await Promise.all([loadOrdersPage(), loadOrdersSummary()]);
}

// -------------------------------------------------------------
// Rendering
// -------------------------------------------------------------
function renderOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    const colspan = isAdmin ? 5 : 4;
    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="table-empty">No orders found</td></tr>`;
        return;
    }
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td>${formatDate(o.orderDate)}</td>
            <td>${escapeHtml(o.productName || '—')}</td>
            ${isAdmin ? `<td>${escapeHtml(partnerLookup[o.partnerID] || '—')}</td>` : ''}
            <td>${o.quantity}</td>
            <td>${(o.totalAmount ?? 0).toFixed(2)}</td>
        </tr>
    `).join('');
}

function renderSummary(summary) {
    const el = document.getElementById('order-summary');
    if (!summary || summary.count === 0) {
        el.innerHTML = '';
        return;
    }
    const revenue = Number(summary.totalRevenue).toLocaleString('de-CH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    el.innerHTML =
        `<strong>${summary.count}</strong> order${summary.count === 1 ? '' : 's'} &middot; ` +
        `<strong>${summary.totalUnits}</strong> units &middot; ` +
        `<strong>CHF ${revenue}</strong>`;
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

function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const date = d.toLocaleDateString('de-CH',  { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('de-CH',  { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

// -------------------------------------------------------------
// Filter listeners — any change resets to page 0
// -------------------------------------------------------------
function onFilterChange() {
    currentSearch   = document.getElementById('order-search-input').value.trim();
    currentDateFrom = document.getElementById('order-date-from').value;
    currentDateTo   = document.getElementById('order-date-to').value;
    currentPartner  = isAdmin ? document.getElementById('order-partner-filter').value : '';
    currentPage = 0;
    refresh();
}

function onSearchInput() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(onFilterChange, SEARCH_DEBOUNCE_MS);
}

document.getElementById('order-search-input').addEventListener('input', onSearchInput);
document.getElementById('order-date-from').addEventListener('change', onFilterChange);
document.getElementById('order-date-to').addEventListener('change', onFilterChange);
document.getElementById('order-partner-filter').addEventListener('change', onFilterChange);

document.getElementById('clear-order-filters').addEventListener('click', () => {
    document.getElementById('order-search-input').value = '';
    document.getElementById('order-date-from').value    = '';
    document.getElementById('order-date-to').value      = '';
    document.getElementById('order-partner-filter').value = '';
    currentSearch = currentDateFrom = currentDateTo = currentPartner = '';
    currentPage = 0;
    refresh();
});

// -------------------------------------------------------------
// Pagination button handlers
// -------------------------------------------------------------
document.getElementById('page-prev').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        // Summary doesn't change on pagination — only the visible rows change
        loadOrdersPage();
    }
});
document.getElementById('page-next').addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
        currentPage++;
        loadOrdersPage();
    }
});

// -------------------------------------------------------------
// Initial load
// -------------------------------------------------------------
(async () => {
    await loadPartners();
    await refresh();
})();
