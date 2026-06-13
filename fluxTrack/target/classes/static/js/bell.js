// =============================================================
// fluxTrack - bell.js
// Runs on every authenticated page (loaded by topbar fragment).
// Fetches /ticket/ and decides if there are events newer than the
// user's "last visited /tickets" timestamp. Shows a dot on the bell
// if yes, and lists recent events in a dropdown when clicked.
//
// Note: bell.js is included by the topbar fragment near the top of
// <body>, but auth.js is included by individual pages near the END
// of <body>. So we wait for DOMContentLoaded to ensure that the
// global helpers from auth.js (getToken, getUser, authFetch) are
// defined before we try to use them.
// =============================================================

(function () {
    function initBell() {
        if (typeof getToken !== 'function' || !getToken()) return;
        const bellBtn = document.getElementById('bell-btn');
        if (!bellBtn) return;

        const username = (typeof getUser === 'function') ? getUser() : null;
        if (!username) return;

        const profile = (typeof getCachedProfile === 'function') ? getCachedProfile() : null;
        const isAdmin = profile && profile.role === 'ADMIN';
        const VIEWED_KEY = 'fluxtrack_lastTicketsViewedAt_' + username;
        const lastViewed = localStorage.getItem(VIEWED_KEY);
        const lastViewedTime = lastViewed ? new Date(lastViewed).getTime() : 0;

        let dropdownOpen = false;

        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });
        document.addEventListener('click', (e) => {
            const wrap = document.getElementById('bell-wrap');
            if (dropdownOpen && wrap && !wrap.contains(e.target)) {
                closeDropdown();
            }
        });

        fetchAndRender();

        async function fetchAndRender() {
            try {
                const res = await authFetch('/ticket/');
                if (!res || !res.ok) return;
                const tickets = await res.json();
                const events = computeEvents(tickets);
                renderDropdown(events);
                const unseen = events.filter(ev => ev.time > lastViewedTime).length;
                if (unseen > 0) {
                    document.getElementById('bell-dot').classList.remove('hidden');
                }
            } catch (err) {
                console.warn('Bell fetch failed', err);
            }
        }

        function computeEvents(tickets) {
            const events = [];
            tickets.forEach(t => {
                const msgs = t.messages || [];
                if (msgs.length === 0) return;
                const lastMsg = msgs[msgs.length - 1];

                if (isAdmin) {
                    // For admin: alert on partner-authored last messages in OPEN state
                    if (lastMsg.author !== 'admin' && t.state === 'OPEN') {
                        events.push({
                            ticketID: t.ticketID,
                            text: msgs.length === 1
                                ? `New ticket from ${lastMsg.author}: ${truncate(t.subject, 60)}`
                                : `${lastMsg.author} replied: ${truncate(lastMsg.content, 60)}`,
                            time: new Date(lastMsg.createdAt).getTime(),
                        });
                    }
                } else {
                    // For partner: alert on admin replies
                    if (lastMsg.author === 'admin') {
                        events.push({
                            ticketID: t.ticketID,
                            text: `fluxed replied on ${truncate(t.subject, 60)}`,
                            time: new Date(lastMsg.createdAt).getTime(),
                        });
                    }
                }
            });
            events.sort((a, b) => b.time - a.time);
            return events.slice(0, 8);
        }

        function renderDropdown(events) {
            const list = document.getElementById('bell-list');
            if (!list) return;
            if (events.length === 0) {
                list.innerHTML = '<li class="bell-empty">Nothing new.</li>';
                return;
            }
            list.innerHTML = events.map(ev => {
                const isUnseen = ev.time > lastViewedTime;
                return `
                    <li class="bell-item ${isUnseen ? 'unseen' : ''}" data-ticket-id="${ev.ticketID}">
                        <div class="bell-item-text">${escapeHtml(ev.text)}</div>
                        <div class="bell-item-time">${formatRelative(ev.time)}</div>
                    </li>
                `;
            }).join('');
            list.querySelectorAll('.bell-item').forEach(el => {
                el.addEventListener('click', () => {
                    window.location.href = '/tickets';
                });
            });
        }

        function toggleDropdown() {
            const dropdown = document.getElementById('bell-dropdown');
            if (!dropdown) return;
            if (dropdownOpen) {
                closeDropdown();
            } else {
                dropdown.classList.remove('hidden');
                dropdownOpen = true;
            }
        }
        function closeDropdown() {
            const dropdown = document.getElementById('bell-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
            dropdownOpen = false;
        }

        function truncate(s, max) {
            if (!s) return '';
            return s.length > max ? s.slice(0, max - 1) + '…' : s;
        }
        function formatRelative(ts) {
            const diffMs = Date.now() - ts;
            const mins = Math.round(diffMs / 60000);
            if (mins < 1) return 'just now';
            if (mins < 60) return `${mins} min ago`;
            const hours = Math.round(mins / 60);
            if (hours < 24) return `${hours} h ago`;
            const days = Math.round(hours / 24);
            return `${days} d ago`;
        }
        function escapeHtml(str) {
            return String(str ?? '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBell);
    } else {
        initBell();
    }
})();