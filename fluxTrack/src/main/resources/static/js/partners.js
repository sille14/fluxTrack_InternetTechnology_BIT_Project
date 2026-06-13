// =============================================================
// fluxTrack - partners.js
// Drives the Partner Overview page (admin-only):
//   - lists all partners with search
//   - "+ New Partner" modal (POST /partner/add)         [UC 101]
//   - edit existing partner by clicking row (PUT /partner/{id}) [UC 102]
//   - delete partner with confirmation (DELETE /partner/{id})   [UC 103]
//
// Non-admin users are redirected back to /products since UC 101
// and UC 103 are defined as admin-only operations in the RE doc.
// =============================================================

requireAuth();

const profile = getCachedProfile();
const isAdmin = profile && profile.role === 'ADMIN';
let allPartners = [];
let pendingDeleteId = null;

// -------------------------------------------------------------
// Admin guard — partner management is admin-only (UC 101 / UC 103)
// -------------------------------------------------------------
if (!isAdmin) {
    document.getElementById('access-denied').classList.remove('hidden');
    setTimeout(() => { window.location.href = '/products'; }, 1500);
    // Stop the rest of the script from running for non-admins
    throw new Error('Admin access required');
}

// -------------------------------------------------------------
// Data loading
// -------------------------------------------------------------
async function loadPartners() {
    const tbody = document.getElementById('partners-tbody');
    try {
        const res = await authFetch('/partner/');
        if (!res) return;
        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Failed to load partners (HTTP ${res.status})</td></tr>`;
            return;
        }
        allPartners = await res.json();
        applyPartnerSearch();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Failed to load partners</td></tr>`;
    }
}

// -------------------------------------------------------------
// Rendering
// -------------------------------------------------------------
function renderPartners(partners) {
    const tbody = document.getElementById('partners-tbody');
    if (!partners.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No partners found</td></tr>`;
        return;
    }
    tbody.innerHTML = partners.map(p => {
        const firstAddress = (p.partnerAddress && p.partnerAddress.length > 0) ? p.partnerAddress[0] : {};
        const city    = firstAddress.city    || '—';
        const country = firstAddress.country || '—';
        return `
            <tr class="row-clickable" data-id="${p.partnerID}">
                <td>${p.partnerID ?? ''}</td>
                <td>${escapeHtml(p.partnerName || '')}</td>
                <td>${escapeHtml(p.partnerEmail || '')}</td>
                <td>${escapeHtml(p.partnerPhone || '—')}</td>
                <td>${escapeHtml(city)}</td>
                <td>${escapeHtml(country)}</td>
                <td>
                    <button class="row-action edit-btn" data-id="${p.partnerID}" title="Edit">✎</button>
                    <button class="row-action delete-btn" data-id="${p.partnerID}" title="Delete">🗑</button>
                </td>
            </tr>`;
    }).join('');
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

// -------------------------------------------------------------
// Search
// -------------------------------------------------------------
function applyPartnerSearch() {
    const term = document.getElementById('partner-search-input').value.trim().toLowerCase();
    const filtered = allPartners.filter(p => {
        if (!term) return true;
        return (p.partnerName && p.partnerName.toLowerCase().includes(term))
            || (p.partnerEmail && p.partnerEmail.toLowerCase().includes(term));
    });
    renderPartners(filtered);
}

document.getElementById('partner-search-btn').addEventListener('click', applyPartnerSearch);
document.getElementById('partner-search-input').addEventListener('input', applyPartnerSearch);
document.getElementById('partner-search-input').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') applyPartnerSearch();
});

// -------------------------------------------------------------
// Row actions: edit (click row or pencil) / delete (trash)
// -------------------------------------------------------------
document.getElementById('partners-tbody').addEventListener('click', (e) => {
    const editBtn   = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    const row       = e.target.closest('.row-clickable');

    if (deleteBtn) {
        e.stopPropagation();
        openDeleteModal(deleteBtn.dataset.id);
        return;
    }
    if (editBtn) {
        e.stopPropagation();
        openEditModal(editBtn.dataset.id);
        return;
    }
    if (row) {
        openEditModal(row.dataset.id);
    }
});

// -------------------------------------------------------------
// Partner modal (add + edit share the same form)
// -------------------------------------------------------------
const modal           = document.getElementById('partner-modal');
const modalTitle      = document.getElementById('partner-modal-title');
const confirmBtn      = document.getElementById('confirm-partner-btn');
const partnerForm     = document.getElementById('partner-form');
const errorDiv        = document.getElementById('partner-form-error');

document.getElementById('open-new-partner').addEventListener('click', openAddModal);
document.getElementById('cancel-partner-modal').addEventListener('click', closePartnerModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closePartnerModal();
});

function openAddModal() {
    partnerForm.reset();
    document.getElementById('partnerID').value = '';
    modalTitle.textContent = 'Add new partner';
    confirmBtn.textContent = 'Confirm';
    errorDiv.textContent = '';
    modal.classList.remove('hidden');
}

function openEditModal(id) {
    const partner = allPartners.find(p => String(p.partnerID) === String(id));
    if (!partner) return;
    partnerForm.reset();
    document.getElementById('partnerID').value    = partner.partnerID;
    document.getElementById('partnerName').value  = partner.partnerName  || '';
    document.getElementById('partnerEmail').value = partner.partnerEmail || '';
    document.getElementById('partnerPhone').value = partner.partnerPhone || '';

    const addr = (partner.partnerAddress && partner.partnerAddress[0]) || {};
    document.getElementById('addressStreet').value  = addr.street  || '';
    document.getElementById('addressNumber').value  = addr.number  || '';
    document.getElementById('addressZip').value     = addr.zip     || '';
    document.getElementById('addressCity').value    = addr.city    || '';
    document.getElementById('addressCountry').value = addr.country || '';

    modalTitle.textContent = 'Edit partner';
    confirmBtn.textContent = 'Save changes';
    errorDiv.textContent = '';
    modal.classList.remove('hidden');
}

function closePartnerModal() {
    modal.classList.add('hidden');
    partnerForm.reset();
    errorDiv.textContent = '';
}

partnerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';

    const id    = document.getElementById('partnerID').value;
    const name  = document.getElementById('partnerName').value.trim();
    const email = document.getElementById('partnerEmail').value.trim();
    const phone = document.getElementById('partnerPhone').value.trim();

    if (!name || !email) {
        errorDiv.textContent = 'Partner Name and Email are required.';
        return;
    }

    // Address is optional: only include it if at least one field is filled
    const address = {
        name:    name,
        street:  document.getElementById('addressStreet').value.trim(),
        number:  document.getElementById('addressNumber').value.trim(),
        zip:     parseInt(document.getElementById('addressZip').value, 10) || null,
        city:    document.getElementById('addressCity').value.trim(),
        country: document.getElementById('addressCountry').value.trim(),
    };
    const hasAddress = address.street || address.city || address.country || address.zip;

    const body = {
        partnerName:  name,
        partnerEmail: email,
        partnerPhone: phone,
        partnerAddress: hasAddress ? [address] : [],
    };
    if (id) body.partnerID = parseInt(id, 10);

    const url = id ? `/partner/${id}` : '/partner/add';
    const method = id ? 'PUT' : 'POST';

    const res = await authFetch(url, { method, body: JSON.stringify(body) });
    if (res && res.ok) {
        closePartnerModal();
        await loadPartners();
    } else {
        errorDiv.textContent = `Could not save partner${res ? ` (HTTP ${res.status})` : ''}.`;
    }
});

// -------------------------------------------------------------
// Delete modal
// -------------------------------------------------------------
const deleteModal   = document.getElementById('delete-modal');
const deleteMessage = document.getElementById('delete-modal-message');
const deleteError   = document.getElementById('delete-error');

document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

function openDeleteModal(id) {
    const partner = allPartners.find(p => String(p.partnerID) === String(id));
    if (!partner) return;
    pendingDeleteId = id;
    deleteMessage.textContent = `Are you sure you want to delete "${partner.partnerName}"? This cannot be undone.`;
    deleteError.textContent = '';
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    pendingDeleteId = null;
    deleteModal.classList.add('hidden');
    deleteError.textContent = '';
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const res = await authFetch(`/partner/${pendingDeleteId}`, { method: 'DELETE' });
    if (res && res.ok) {
        closeDeleteModal();
        await loadPartners();
    } else {
        deleteError.textContent = `Could not delete partner${res ? ` (HTTP ${res.status})` : ''}. Partners with linked products or an active user may need to be unlinked first.`;
    }
});

// -------------------------------------------------------------
// Initial load
// -------------------------------------------------------------
loadPartners();
