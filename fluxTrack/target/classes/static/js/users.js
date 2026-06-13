// =============================================================
// fluxTrack - users.js
// Drives the User Management page (admin-only):
//   - lists all application users with search
//   - "+ New User" modal (POST /user/add)
//   - edit existing user by clicking row (PUT /user/{id})
//   - avatar upload (POST /user/{id}/avatar)
//   - delete user with confirmation (DELETE /user/{id})
// =============================================================

requireAuth();

const profile = getCachedProfile();
const isAdmin = profile && profile.role === 'ADMIN';
let allUsers = [];
let allPartners = [];
let pendingDeleteId = null;

// -------------------------------------------------------------
// Admin guard
// -------------------------------------------------------------
if (!isAdmin) {
    document.getElementById('access-denied').classList.remove('hidden');
    setTimeout(() => { window.location.href = '/products'; }, 1500);
    throw new Error('Admin access required');
}

// -------------------------------------------------------------
// Data loading
// -------------------------------------------------------------
async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    try {
        const res = await authFetch('/user/');
        if (!res) return;
        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Failed to load users (HTTP ${res.status})</td></tr>`;
            return;
        }
        allUsers = await res.json();
        applyUserSearch();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Failed to load users</td></tr>`;
    }
}

async function loadPartners() {
    try {
        const res = await authFetch('/partner/');
        if (res && res.ok) {
            allPartners = await res.json();
            populatePartnerSelect();
        }
    } catch (err) {
        console.warn('Could not load partners for dropdown:', err);
    }
}

function populatePartnerSelect() {
    const sel = document.getElementById('userPartner');
    sel.innerHTML = '<option value="">— select partner —</option>';
    allPartners.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.partnerID;
        opt.textContent = p.partnerName;
        sel.appendChild(opt);
    });
}

// -------------------------------------------------------------
// Rendering
// -------------------------------------------------------------
function renderUsers(users) {
    const tbody = document.getElementById('users-tbody');
    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No users found</td></tr>`;
        return;
    }
    tbody.innerHTML = users.map(u => {
        const roleBadge = u.role === 'ADMIN'
            ? '<span class="badge badge-admin">Admin</span>'
            : '<span class="badge badge-partner">Partner</span>';
        return `
            <tr class="row-clickable" data-id="${u.id}">
                <td>${u.id}</td>
                <td>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(u.displayName || '—')}</td>
                <td>${roleBadge}</td>
                <td>${escapeHtml(u.partnerName || '—')}</td>
                <td>
                    <button class="row-action edit-btn" data-id="${u.id}" title="Edit">✎</button>
                    <button class="row-action delete-btn" data-id="${u.id}" title="Delete">🗑</button>
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
function applyUserSearch() {
    const term = document.getElementById('user-search-input').value.trim().toLowerCase();
    const filtered = allUsers.filter(u => {
        if (!term) return true;
        return (u.username && u.username.toLowerCase().includes(term))
            || (u.displayName && u.displayName.toLowerCase().includes(term));
    });
    renderUsers(filtered);
}

document.getElementById('user-search-btn').addEventListener('click', applyUserSearch);
document.getElementById('user-search-input').addEventListener('input', applyUserSearch);
document.getElementById('user-search-input').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') applyUserSearch();
});

// -------------------------------------------------------------
// Row actions
// -------------------------------------------------------------
document.getElementById('users-tbody').addEventListener('click', (e) => {
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
// Role ↔ partner-select visibility
// -------------------------------------------------------------
const roleSelect         = document.getElementById('userRole');
const partnerSelectGroup = document.getElementById('partner-select-group');

roleSelect.addEventListener('change', () => {
    partnerSelectGroup.style.display = roleSelect.value === 'ADMIN' ? 'none' : '';
});

// -------------------------------------------------------------
// User modal (add + edit share the same form)
// -------------------------------------------------------------
const modal         = document.getElementById('user-modal');
const modalTitle    = document.getElementById('user-modal-title');
const confirmBtn    = document.getElementById('confirm-user-btn');
const userForm      = document.getElementById('user-form');
const errorDiv      = document.getElementById('user-form-error');
const usernameIn    = document.getElementById('userUsername');
const passwordIn    = document.getElementById('userPassword');
const pwdRequired   = document.getElementById('password-required');
const avatarGroup   = document.getElementById('avatar-upload-group');
const avatarPreview = document.getElementById('avatar-preview');
const avatarFileIn  = document.getElementById('avatarFile');
const avatarStatus  = document.getElementById('avatar-status');
const removeAvatarBtn = document.getElementById('remove-avatar-btn');

document.getElementById('open-new-user').addEventListener('click', openAddModal);
document.getElementById('cancel-user-modal').addEventListener('click', closeUserModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeUserModal();
});

// --- CHANGE A: show avatar group in add mode too ---
function openAddModal() {
    userForm.reset();
    document.getElementById('userId').value = '';
    usernameIn.readOnly = false;
    passwordIn.placeholder = 'Min. 4 characters';
    pwdRequired.style.display = '';
    modalTitle.textContent = 'Add new user';
    confirmBtn.textContent = 'Confirm';
    errorDiv.textContent = '';
    roleSelect.value = 'PARTNER';
    partnerSelectGroup.style.display = '';
    // Show avatar upload, but no preview or remove since the user doesn't exist yet
    avatarGroup.style.display = '';
    avatarPreview.style.display = 'none';
    removeAvatarBtn.style.display = 'none';
    avatarStatus.textContent = '';
    avatarFileIn.value = '';
    document.getElementById('logo-path-group').style.display = '';
    modal.classList.remove('hidden');
}

function openEditModal(id) {
    const user = allUsers.find(u => String(u.id) === String(id));
    if (!user) return;
    userForm.reset();
    document.getElementById('userId').value          = user.id;
    usernameIn.value                                 = user.username;
    usernameIn.readOnly                              = true;
    document.getElementById('userDisplayName').value  = user.displayName || '';
    roleSelect.value                                 = user.role;
    document.getElementById('userPartner').value      = user.partnerID || '';
    document.getElementById('userLogoPath').value     = user.logoPath || '';

    passwordIn.placeholder = 'Leave blank to keep current';
    pwdRequired.style.display = 'none';
    partnerSelectGroup.style.display = user.role === 'ADMIN' ? 'none' : '';
    modalTitle.textContent = 'Edit user';
    confirmBtn.textContent = 'Save changes';
    errorDiv.textContent = '';

    avatarGroup.style.display = '';
    avatarStatus.textContent = '';
    avatarFileIn.value = '';
    // Hide logo path when an uploaded avatar already exists (avatar takes priority)
    document.getElementById('logo-path-group').style.display = user.avatarUrl ? 'none' : '';
    if (user.avatarUrl) {
        avatarPreview.src = user.avatarUrl;
        avatarPreview.style.display = 'block';
        removeAvatarBtn.style.display = '';
    } else {
        avatarPreview.style.display = 'none';
        removeAvatarBtn.style.display = 'none';
    }

    modal.classList.remove('hidden');
}

function closeUserModal() {
    modal.classList.add('hidden');
    userForm.reset();
    errorDiv.textContent = '';
}

// --- CHANGE B: branch avatar handler for add vs edit mode ---
avatarFileIn.addEventListener('change', async () => {
    const file = avatarFileIn.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        avatarStatus.textContent = 'Only image files are allowed.';
        avatarFileIn.value = '';
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        avatarStatus.textContent = 'File must be under 2 MB.';
        avatarFileIn.value = '';
        return;
    }

    const userId = document.getElementById('userId').value;

    if (!userId) {
        // ADD mode — show a local preview, actual upload happens on form submit
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview.src = e.target.result;
            avatarPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        avatarStatus.textContent = 'Will be uploaded on save.';
        document.getElementById('logo-path-group').style.display = 'none';
        return;
    }

    // EDIT mode — upload immediately (existing behavior)
    avatarStatus.textContent = 'Uploading...';
    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = getToken();
        const res = await fetch(`/user/${userId}/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        if (res.ok) {
            const updated = await res.json();
            avatarPreview.src = updated.avatarUrl + '?t=' + Date.now();
            avatarPreview.style.display = 'block';
            removeAvatarBtn.style.display = '';
            avatarStatus.textContent = 'Avatar uploaded.';
            document.getElementById('logo-path-group').style.display = 'none';
            const idx = allUsers.findIndex(u => String(u.id) === String(userId));
            if (idx >= 0) allUsers[idx] = updated;
        } else {
            let msg = 'Upload failed.';
            try { const err = await res.json(); if (err.error) msg = err.error; } catch (_) {}
            avatarStatus.textContent = msg;
        }
    } catch (err) {
        avatarStatus.textContent = 'Upload failed: ' + err.message;
    }
});

removeAvatarBtn.addEventListener('click', async () => {
    const userId = document.getElementById('userId').value;
    if (!userId) return;

    const res = await authFetch(`/user/${userId}/avatar`, { method: 'DELETE' });
    if (res && res.ok) {
        avatarPreview.style.display = 'none';
        removeAvatarBtn.style.display = 'none';
        avatarStatus.textContent = 'Avatar removed.';
        document.getElementById('logo-path-group').style.display = '';
        const updated = await res.json();
        const idx = allUsers.findIndex(u => String(u.id) === String(userId));
        if (idx >= 0) allUsers[idx] = updated;
    }
});

// --- CHANGE C: after creating a new user, upload buffered avatar ---
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';

    const id          = document.getElementById('userId').value;
    const username    = usernameIn.value.trim();
    const password    = passwordIn.value;
    const displayName = document.getElementById('userDisplayName').value.trim();
    const role        = roleSelect.value;
    const partnerID   = document.getElementById('userPartner').value;
    const logoPath    = document.getElementById('userLogoPath').value.trim();

    if (!username) {
        errorDiv.textContent = 'Username is required.';
        return;
    }
    if (!id && (!password || password.length < 4)) {
        errorDiv.textContent = 'Password is required (min. 4 characters) for new users.';
        return;
    }
    if (id && password && password.length < 4) {
        errorDiv.textContent = 'Password must be at least 4 characters.';
        return;
    }
    if (role === 'PARTNER' && !partnerID) {
        errorDiv.textContent = 'Please select a partner for this user.';
        return;
    }

    const body = {
        username,
        displayName: displayName || username,
        role,
        partnerID: role === 'ADMIN' ? null : parseInt(partnerID, 10),
        logoPath: logoPath || null,
    };
    if (password) body.password = password;

    const url    = id ? `/user/${id}` : '/user/add';
    const method = id ? 'PUT' : 'POST';

    const res = await authFetch(url, { method, body: JSON.stringify(body) });
    if (res && res.ok) {
        const savedUser = await res.json();

        // If a file was selected in ADD mode, upload it now that we have the new user's ID
        const pendingFile = avatarFileIn.files[0];
        if (!id && pendingFile && pendingFile.type.startsWith('image/') && pendingFile.size <= 2 * 1024 * 1024) {
            const formData = new FormData();
            formData.append('file', pendingFile);
            try {
                const token = getToken();
                await fetch(`/user/${savedUser.id}/avatar`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
            } catch (err) {
                console.warn('Avatar upload after create failed:', err);
            }
        }

        closeUserModal();
        await loadUsers();
    } else {
        let msg = `Could not save user${res ? ` (HTTP ${res.status})` : ''}.`;
        try { const err = await res.json(); if (err.error) msg = err.error; } catch (_) {}
        errorDiv.textContent = msg;
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
    const user = allUsers.find(u => String(u.id) === String(id));
    if (!user) return;

    if (user.username === getUser()) {
        deleteError.textContent = '';
        deleteMessage.textContent = 'You cannot delete your own account.';
        pendingDeleteId = null;
        document.getElementById('confirm-delete-btn').style.display = 'none';
        deleteModal.classList.remove('hidden');
        return;
    }

    pendingDeleteId = id;
    deleteMessage.textContent = `Are you sure you want to delete user "${user.username}"? This cannot be undone.`;
    deleteError.textContent = '';
    document.getElementById('confirm-delete-btn').style.display = '';
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    pendingDeleteId = null;
    deleteModal.classList.add('hidden');
    deleteError.textContent = '';
    document.getElementById('confirm-delete-btn').style.display = '';
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const res = await authFetch(`/user/${pendingDeleteId}`, { method: 'DELETE' });
    if (res && res.ok) {
        closeDeleteModal();
        await loadUsers();
    } else {
        let msg = `Could not delete user${res ? ` (HTTP ${res.status})` : ''}.`;
        try { const err = await res.json(); if (err.error) msg = err.error; } catch (_) {}
        deleteError.textContent = msg;
    }
});

// -------------------------------------------------------------
// Initial load
// -------------------------------------------------------------
loadPartners();
loadUsers();