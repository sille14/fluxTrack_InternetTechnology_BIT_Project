// =============================================================
// fluxTrack - dashboard.js
// Landing page showing inventory health at a glance.
//   - Partner user: stats scoped to their own products
//     (the business rule in ProductService does this server-side)
//   - Admin: stats across all partners
//   - Out-of-stock list with click-through to /products
// =============================================================

requireAuth();

const profile = getCachedProfile();
const isAdmin = profile && profile.role === 'ADMIN';
const partnerLookup = {};
let allPartners = [];
let allProducts = [];

// -------------------------------------------------------------
// Data loading
// -------------------------------------------------------------
async function loadAll() {
    try {
        const [partnerRes, productRes] = await Promise.all([
            authFetch('/partner/'),
            authFetch('/product/'),
        ]);

        if (partnerRes && partnerRes.ok) {
            allPartners = await partnerRes.json();
            allPartners.forEach(p => { partnerLookup[p.partnerID] = p.partnerName; });
        }
        if (productRes && productRes.ok) {
            allProducts = await productRes.json();
        }

        renderGreeting();
        renderStats();
        renderOutOfStock();
    } catch (err) {
        console.error('Dashboard load failed', err);
    }
}

// -------------------------------------------------------------
// Greeting
// -------------------------------------------------------------
function renderGreeting() {
    const el = document.getElementById('greeting');
    if (!el) return;
    if (isAdmin) {
        el.textContent = 'Welcome back, Admin. Here\'s your overview across all partners.';
    } else {
        // Find which partner the logged-in user belongs to.
        // The business rule means GET /product/ already returned only this
        // partner's products, so we can grab the partnerID from any of them.
        const partnerName = allProducts.length > 0
            ? partnerLookup[allProducts[0].productPartnerID]
            : getUser();
        el.textContent = `Welcome back, ${partnerName}.`;
    }
}

// -------------------------------------------------------------
// Stat cards
// -------------------------------------------------------------
function renderStats() {
    const grid = document.getElementById('stats-grid');
    const total = allProducts.length;
    const outOfStock = allProducts.filter(p => (p.productQuantity ?? 0) <= 0).length;
    const stockValue = allProducts.reduce((sum, p) => {
        return sum + ((p.productPrice ?? 0) * (p.productQuantity ?? 0));
    }, 0);

    const cards = [];

    // Card: total products
    cards.push(statCard({
        label: isAdmin ? 'Total Products' : 'My Products',
        value: total,
        sub: total === 1 ? 'product in inventory' : 'products in inventory',
        icon: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>`,
        accent: 'gold',
    }));

    // Card: out of stock (alerty when > 0)
    cards.push(statCard({
        label: 'Out of Stock',
        value: outOfStock,
        sub: outOfStock === 0 ? 'all products in stock' : (outOfStock === 1 ? 'product needs restocking' : 'products need restocking'),
        icon: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
        accent: outOfStock > 0 ? 'danger' : 'gold',
    }));

    // Card: stock value
    cards.push(statCard({
        label: 'Stock Value',
        value: 'CHF ' + stockValue.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        sub: 'price × quantity',
        icon: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,
        accent: 'gold',
        wide: true,
    }));

    // Admin-only fourth card: partner count
    if (isAdmin) {
        cards.push(statCard({
            label: 'Total Partners',
            value: allPartners.length,
            sub: allPartners.length === 1 ? 'partner onboarded' : 'partners onboarded',
            icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
            accent: 'gold',
        }));
    }

    grid.innerHTML = cards.join('');
}

function statCard({ label, value, sub, icon, accent, wide }) {
    return `
        <div class="stat-card stat-card-${accent}${wide ? ' stat-card-wide' : ''}">
            <div class="stat-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${icon}
                </svg>
            </div>
            <div class="stat-card-label">${label}</div>
            <div class="stat-card-value">${value}</div>
            <div class="stat-card-sub">${sub}</div>
        </div>
    `;
}

// -------------------------------------------------------------
// Out of Stock list
// -------------------------------------------------------------
function renderOutOfStock() {
    const container = document.getElementById('out-of-stock-section');
    const oos = allProducts.filter(p => (p.productQuantity ?? 0) <= 0);

    if (oos.length === 0) {
        container.innerHTML = `<p class="dashboard-empty dashboard-empty-success">Everything is in stock. Nothing to worry about.</p>`;
        return;
    }

    const showPartner = isAdmin;
    container.innerHTML = `
        <table class="data-table dashboard-table">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    ${showPartner ? '<th>Partner</th>' : ''}
                    <th>Price in CHF</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${oos.map(p => `
                    <tr class="row-clickable" data-sku="${escapeHtml(p.productSKU || '')}">
                        <td>${escapeHtml(p.productSKU || '')}</td>
                        <td>${escapeHtml(p.productName || '')}</td>
                        ${showPartner ? `<td>${escapeHtml(partnerLookup[p.productPartnerID] || '—')}</td>` : ''}
                        <td>${(p.productPrice ?? 0).toFixed(2)}</td>
                        <td><span class="link-cta">Manage →</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Click row → jump to /products with this SKU pre-filtered
    container.querySelectorAll('.row-clickable').forEach(row => {
        row.addEventListener('click', () => {
            const sku = row.dataset.sku;
            window.location.href = `/products?search=${encodeURIComponent(sku)}`;
        });
    });
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

// -------------------------------------------------------------
// Go
// -------------------------------------------------------------
loadAll();
