// =============================================================
// fluxTrack - auth.js
// Handles login, token storage in localStorage, and provides
// authFetch() — a fetch wrapper that attaches the JWT and redirects
// to /login if the token is missing or rejected.
// =============================================================

const TOKEN_KEY   = 'fluxtrack_token';
const USER_KEY    = 'fluxtrack_user';
const PROFILE_KEY = 'fluxtrack_profile';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
    return localStorage.getItem(USER_KEY);
}

function getCachedProfile() {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
}

function setAuth(token, username) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
}

function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PROFILE_KEY);
}

function logout() {
    clearAuth();
    window.location.href = '/login';
}

// Page guard: call at the top of any protected page
function requireAuth() {
    if (!getToken()) {
        window.location.href = '/login';
    }
}

// Wrapped fetch that adds the JWT and handles auth errors centrally.
async function authFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        window.location.href = '/login';
        return null;
    }
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`,
    };
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        clearAuth();
        window.location.href = '/login';
        return null;
    }
    return response;
}

/** Fetch the user profile from the API and cache it in localStorage. */
async function fetchAndCacheProfile() {
    try {
        const resp = await authFetch('/user/profile');
        if (resp && resp.ok) {
            const profile = await resp.json();
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            return profile;
        }
    } catch (e) {
        console.warn('Could not fetch user profile:', e);
    }
    return null;
}

// =============================================================
// Login form (only present on /login)
// =============================================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    if (getToken()) {
        window.location.href = '/dashboard';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = '';

        if (!username || !password) {
            errorDiv.textContent = 'Please enter both username and password.';
            return;
        }

        try {
            // UTF-8 safe base64 for usernames/passwords with non-ASCII characters
            const basicAuth = btoa(unescape(encodeURIComponent(`${username}:${password}`)));
            const response = await fetch('/token', {
                method: 'POST',
                headers: { 'Authorization': `Basic ${basicAuth}` },
            });

            if (!response.ok) {
                throw new Error(response.status === 401
                    ? 'Invalid username or password'
                    : `Login failed (HTTP ${response.status})`);
            }

            const token = (await response.text()).trim();
            if (!token) throw new Error('Empty token returned by server');

            setAuth(token, username);

            // Fetch & cache the user profile before navigating away.
            // This populates displayName + logo for the topbar on the next page.
            await fetchAndCacheProfile();

            window.location.href = '/dashboard';
        } catch (err) {
            errorDiv.textContent = err.message;
        }
    });
}

// =============================================================
// Topbar: logo + display name + logout (present on app pages)
// =============================================================

// Profile is fetched from /user/profile at login and cached in localStorage.
// This replaces the old hardcoded USER_PROFILES map — new users created by
// admin will show correct names/logos without touching this file.
const currentUsername = getUser();
const currentProfile = getCachedProfile();

const companyNameEl = document.getElementById('company-name');
if (companyNameEl && currentUsername) {
    companyNameEl.textContent = currentProfile ? currentProfile.displayName : currentUsername;
}

const companyLogoEl = document.getElementById('company-logo');
if (companyLogoEl && currentProfile && currentProfile.avatarUrl) {
    companyLogoEl.src = currentProfile.avatarUrl;
    companyLogoEl.alt = (currentProfile.displayName || currentUsername) + ' logo';
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// Hide admin-only sidebar items for non-admin users.
if (currentUsername && (!currentProfile || currentProfile.role !== 'ADMIN')) {
    const partnersLink = document.getElementById('sidebar-partners');
    if (partnersLink) {
        partnersLink.classList.add('hidden');
    }
    const usersLink = document.getElementById('sidebar-users');
    if (usersLink) {
        usersLink.classList.add('hidden');
    }
}

// =============================================================
// Sidebar collapse toggle
// =============================================================
const SIDEBAR_COLLAPSED_KEY = 'fluxtrack_sidebarCollapsed';

function applySidebarState() {
    if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') {
        document.body.classList.add('sidebar-collapsed');
    } else {
        document.body.classList.remove('sidebar-collapsed');
    }
}

function toggleSidebar() {
    const collapsed = document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}

applySidebarState();

document.querySelectorAll('.sidebar-toggle, .topbar-toggle').forEach(btn => {
    btn.addEventListener('click', toggleSidebar);
});