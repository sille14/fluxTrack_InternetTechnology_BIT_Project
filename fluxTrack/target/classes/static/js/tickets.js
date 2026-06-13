// =============================================================
// fluxTrack - tickets.js
// Support Tickets view (UC 107):
//   - Partner: see own tickets, raise new, reply when ANSWERED, mark resolved
//   - Admin: see all tickets, reply to OPEN, reopen / complete RESOLVED
//   - Conversation thread shown in detail pane with state-aware actions
//   - localStorage timestamp tracks unseen events for the bell icon
// =============================================================

requireAuth();

const profile = getCachedProfile();
const isAdmin = profile && profile.role === 'ADMIN';
const username = getUser();
const VIEWED_KEY = 'fluxtrack_lastTicketsViewedAt_' + (username || 'anon');

const partnerLookup = {};
let allTickets = [];
let selectedTicketId = null;

// Mark "I just looked at tickets" so the bell stops alerting.
localStorage.setItem(VIEWED_KEY, new Date().toISOString());

// -------------------------------------------------------------
// Initial load
// -------------------------------------------------------------
async function loadAll() {
    try {
        const [partnerRes, ticketRes] = await Promise.all([
            authFetch('/partner/'),
            authFetch('/ticket/'),
        ]);

        if (partnerRes && partnerRes.ok) {
            const partners = await partnerRes.json();
            partners.forEach(p => { partnerLookup[p.partnerID] = p.partnerName; });

            if (isAdmin) {
                const select = document.getElementById('ticket-partner-filter');
                partners.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.partnerID;
                    opt.textContent = p.partnerName;
                    select.appendChild(opt);
                });
                document.getElementById('ticket-partner-filter-group').classList.remove('hidden');
            }
        }

        if (ticketRes && ticketRes.ok) {
            allTickets = await ticketRes.json();
            // Sort newest-updated first
            allTickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        // Only partner users can raise tickets
        if (!isAdmin) {
            document.getElementById('open-new-ticket').classList.remove('hidden');
        }

        applyTicketFilters();
    } catch (err) {
        console.error('Ticket load failed', err);
        document.getElementById('ticket-list').innerHTML =
            '<li class="ticket-list-empty">Failed to load tickets.</li>';
    }
}

// -------------------------------------------------------------
// Filtering
// -------------------------------------------------------------
function applyTicketFilters() {
    const term = document.getElementById('ticket-search-input').value.trim().toLowerCase();
    const stateFilter = document.getElementById('ticket-state-filter').value;
    const partnerFilter = isAdmin
        ? document.getElementById('ticket-partner-filter').value
        : '';

    const filtered = allTickets.filter(t => {
        if (stateFilter && t.state !== stateFilter) return false;
        if (partnerFilter && String(t.partnerID) !== String(partnerFilter)) return false;
        if (term) {
            const inSubject = (t.subject || '').toLowerCase().includes(term);
            const inMessages = (t.messages || []).some(m =>
                (m.content || '').toLowerCase().includes(term)
            );
            if (!inSubject && !inMessages) return false;
        }
        return true;
    });

    renderTicketList(filtered);
}

document.getElementById('ticket-search-input').addEventListener('input', applyTicketFilters);
document.getElementById('ticket-state-filter').addEventListener('change', applyTicketFilters);
document.getElementById('ticket-partner-filter').addEventListener('change', applyTicketFilters);
document.getElementById('clear-ticket-filters').addEventListener('click', () => {
    document.getElementById('ticket-search-input').value = '';
    document.getElementById('ticket-state-filter').value = '';
    if (isAdmin) document.getElementById('ticket-partner-filter').value = '';
    applyTicketFilters();
});

// -------------------------------------------------------------
// Rendering: list pane
// -------------------------------------------------------------
function renderTicketList(tickets) {
    const list = document.getElementById('ticket-list');
    if (tickets.length === 0) {
        list.innerHTML = '<li class="ticket-list-empty">No tickets found.</li>';
        return;
    }
    list.innerHTML = tickets.map(t => {
        const isSelected = String(t.ticketID) === String(selectedTicketId);
        const partnerName = partnerLookup[t.partnerID] || '—';
        const lastMsg = (t.messages && t.messages.length > 0)
            ? t.messages[t.messages.length - 1]
            : null;
        const preview = lastMsg ? truncate(lastMsg.content, 70) : '';
        return `
            <li class="ticket-list-item ${isSelected ? 'selected' : ''}" data-id="${t.ticketID}">
                <div class="ticket-list-item-header">
                    <span class="state-pill state-${t.state}">${stateLabel(t.state)}</span>
                    <span class="urgency-badge urgency-${t.urgency}">${urgencyLabel(t.urgency)}</span>
                </div>
                <div class="ticket-list-item-subject">${escapeHtml(t.subject)}</div>
                <div class="ticket-list-item-meta">
                    ${isAdmin ? `<span>${escapeHtml(partnerName)} &middot; </span>` : ''}
                    <span>#${t.ticketID}</span>
                    <span class="ticket-list-item-time">${formatDateShort(t.updatedAt)}</span>
                </div>
                <div class="ticket-list-item-preview">${escapeHtml(preview)}</div>
            </li>`;
    }).join('');

    list.querySelectorAll('.ticket-list-item').forEach(el => {
        el.addEventListener('click', () => selectTicket(el.dataset.id));
    });
}

// -------------------------------------------------------------
// Rendering: detail pane (conversation + actions)
// -------------------------------------------------------------
function selectTicket(id) {
    selectedTicketId = String(id);
    const ticket = allTickets.find(t => String(t.ticketID) === selectedTicketId);
    if (!ticket) return;
    applyTicketFilters();  // re-render list to show selection
    renderTicketDetail(ticket);
}

function renderTicketDetail(t) {
    const pane = document.getElementById('ticket-detail');
    const partnerName = partnerLookup[t.partnerID] || '—';
    const messagesHtml = (t.messages || []).map(m => `
        <div class="conv-message conv-message-${m.author === 'admin' ? 'admin' : 'partner'}">
            <div class="conv-message-meta">
                <strong>${escapeHtml(m.author === 'admin' ? 'fluxed (admin)' : (partnerLookup[t.partnerID] || m.author))}</strong>
                <span class="conv-message-time">${formatDateLong(m.createdAt)}</span>
            </div>
            <div class="conv-message-content">${escapeHtml(m.content)}</div>
        </div>
    `).join('');

    pane.innerHTML = `
        <div class="ticket-detail-header">
            <div>
                <div class="ticket-detail-title">${escapeHtml(t.subject)}</div>
                <div class="ticket-detail-subtitle">
                    Ticket #${t.ticketID} &middot; ${escapeHtml(partnerName)} &middot;
                    opened ${formatDateLong(t.createdAt)}
                </div>
            </div>
            <div class="ticket-detail-badges">
                <span class="state-pill state-${t.state}">${stateLabel(t.state)}</span>
                <span class="urgency-badge urgency-${t.urgency}">${urgencyLabel(t.urgency)}</span>
            </div>
        </div>

        <div class="conv-thread">
            ${messagesHtml || '<div class="dashboard-empty">No messages yet.</div>'}
        </div>

        <div class="ticket-actions" id="ticket-actions"></div>
    `;

    renderActions(t);
}

// -------------------------------------------------------------
// State-aware action buttons
// -------------------------------------------------------------
function renderActions(t) {
    const container = document.getElementById('ticket-actions');
    const state = t.state;

    // Determine what the current user can do given the ticket's state
    const actions = [];

    if (isAdmin) {
        if (state === 'OPEN') {
            actions.push({ kind: 'reply', label: 'Reply to partner', endpoint: 'admin-reply', requiresMessage: true });
        }
        if (state === 'RESOLVED') {
            actions.push({ kind: 'reopen', label: 'Reopen ticket', endpoint: 'reopen', requiresMessage: true });
            actions.push({ kind: 'complete', label: 'Close as completed', endpoint: 'complete', requiresMessage: false });
        }
    } else {
        // Partner user — actions only on their own tickets (server enforces ownership too)
        if (state === 'ANSWERED') {
            actions.push({ kind: 'reply', label: 'Reply (not satisfied)', endpoint: 'partner-reply', requiresMessage: true });
            actions.push({ kind: 'resolve', label: 'Mark as resolved', endpoint: 'resolve', requiresMessage: false });
        }
    }

    if (actions.length === 0) {
        container.innerHTML = `<div class="ticket-actions-empty">${stateExplanation(state, isAdmin)}</div>`;
        return;
    }

    const messageAction = actions.find(a => a.requiresMessage);
    const noMessageActions = actions.filter(a => !a.requiresMessage);

    container.innerHTML = `
        ${messageAction ? `
            <textarea class="ticket-reply-input" id="ticket-reply-input" rows="3"
                placeholder="Write your reply..."></textarea>
        ` : ''}
        <div class="ticket-action-buttons">
            ${actions.map(a => `
                <button class="btn ${a.kind === 'complete' ? 'btn-gold' : (a.kind === 'resolve' ? 'btn-gold' : 'btn-gold-light')}"
                    data-action="${a.endpoint}"
                    data-requires-message="${a.requiresMessage}">${a.label}</button>
            `).join('')}
        </div>
        <div class="form-error ticket-action-error" id="ticket-action-error"></div>
    `;

    container.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', () => handleAction(t, btn.dataset.action, btn.dataset.requiresMessage === 'true'));
    });
}

async function handleAction(ticket, endpoint, requiresMessage) {
    const errorEl = document.getElementById('ticket-action-error');
    errorEl.textContent = '';

    let body = null;
    if (requiresMessage) {
        const input = document.getElementById('ticket-reply-input');
        const message = (input && input.value.trim()) || '';
        if (!message) {
            errorEl.textContent = 'Please write a message before sending.';
            return;
        }
        body = JSON.stringify({ message });
    }

    const res = await authFetch(`/ticket/${ticket.ticketID}/${endpoint}`, {
        method: 'POST',
        body,
    });

    if (res && res.ok) {
        // Refresh the ticket from the response and re-render
        const updated = await res.json();
        const idx = allTickets.findIndex(t => t.ticketID === updated.ticketID);
        if (idx !== -1) allTickets[idx] = updated;
        allTickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        // bump the viewed timestamp so my own actions don't trigger the bell
        localStorage.setItem(VIEWED_KEY, new Date().toISOString());
        applyTicketFilters();
        renderTicketDetail(updated);
    } else {
        errorEl.textContent = `Action failed${res ? ` (HTTP ${res.status})` : ''}.`;
    }
}

function stateExplanation(state, isAdminUser) {
    if (state === 'OPEN' && !isAdminUser) return 'Waiting for fluxed to respond.';
    if (state === 'ANSWERED' && isAdminUser) return 'Waiting for the partner to confirm or reply.';
    if (state === 'RESOLVED' && !isAdminUser) return 'Waiting for fluxed to close the ticket.';
    if (state === 'COMPLETED') return 'This ticket has been closed.';
    return '';
}

// -------------------------------------------------------------
// "Raise Ticket" modal (partner only)
// -------------------------------------------------------------
const modal = document.getElementById('ticket-modal');
const modalForm = document.getElementById('ticket-form');
const modalError = document.getElementById('ticket-form-error');

document.getElementById('open-new-ticket').addEventListener('click', () => {
    modalForm.reset();
    modalError.textContent = '';
    modal.classList.remove('hidden');
});
document.getElementById('cancel-ticket-modal').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function closeModal() {
    modal.classList.add('hidden');
    modalForm.reset();
    modalError.textContent = '';
}

modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalError.textContent = '';
    const subject     = document.getElementById('ticketSubject').value.trim();
    const urgency     = document.getElementById('ticketUrgency').value;
    const description = document.getElementById('ticketDescription').value.trim();
    if (!subject || !description) {
        modalError.textContent = 'Subject and description are required.';
        return;
    }
    const res = await authFetch('/ticket/', {
        method: 'POST',
        body: JSON.stringify({ subject, urgency, description }),
    });
    if (res && res.ok) {
        const created = await res.json();
        allTickets.unshift(created);
        localStorage.setItem(VIEWED_KEY, new Date().toISOString());
        closeModal();
        selectedTicketId = created.ticketID;
        applyTicketFilters();
        renderTicketDetail(created);
    } else {
        modalError.textContent = `Failed to create ticket${res ? ` (HTTP ${res.status})` : ''}.`;
    }
});

// -------------------------------------------------------------
// Formatting helpers
// -------------------------------------------------------------
function formatDateShort(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
}
function formatDateLong(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}
function stateLabel(s) {
    return { OPEN: 'Open', ANSWERED: 'Answered', RESOLVED: 'Resolved', COMPLETED: 'Completed' }[s] || s;
}
function urgencyLabel(u) {
    return { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }[u] || u;
}
function truncate(s, max) {
    if (!s) return '';
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

loadAll();
