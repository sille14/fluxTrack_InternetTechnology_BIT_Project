// =============================================================
// fluxTrack - reports.js
// Sales reports view:
//   - Partner: own data only (server-enforced via business rule)
//   - Admin: everything, plus per-shop breakdown
//   - SVG bar chart of daily revenue across the selected date range
//   - CSV export of the visible tables
// =============================================================

requireAuth();

const profile = getCachedProfile();
const isAdmin = profile && profile.role === 'ADMIN';
const partnerLookup = {};
let allOrders = [];
let allPartners = [];

// -------------------------------------------------------------
// Initial load
// -------------------------------------------------------------
async function loadAll() {
    try {
        const [partnerRes, orderRes] = await Promise.all([
            authFetch('/partner/'),
            authFetch('/order/'),
        ]);

        if (partnerRes && partnerRes.ok) {
            allPartners = await partnerRes.json();
            allPartners.forEach(p => { partnerLookup[p.partnerID] = p.partnerName; });

            if (isAdmin) {
                document.getElementById('report-partner-filter-group').classList.remove('hidden');
                document.getElementById('partner-breakdown-section').classList.remove('hidden');
                document.querySelectorAll('.th-partner').forEach(el => el.classList.remove('hidden'));

                const select = document.getElementById('report-partner-filter');
                allPartners.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.partnerID;
                    opt.textContent = p.partnerName;
                    select.appendChild(opt);
                });
            }
        }

        if (orderRes && orderRes.ok) {
            allOrders = await orderRes.json();
        }

        // Default date range: 30 days ending today
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setDate(today.getDate() - 29);
        document.getElementById('report-date-from').value = isoDate(monthAgo);
        document.getElementById('report-date-to').value = isoDate(today);

        applyFilters();
    } catch (err) {
        console.error('Report load failed', err);
    }
}

// -------------------------------------------------------------
// Filter wiring
// -------------------------------------------------------------
document.getElementById('report-date-from').addEventListener('change', applyFilters);
document.getElementById('report-date-to').addEventListener('change', applyFilters);
document.getElementById('report-partner-filter').addEventListener('change', applyFilters);
document.getElementById('clear-report-filters').addEventListener('click', () => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 29);
    document.getElementById('report-date-from').value = isoDate(monthAgo);
    document.getElementById('report-date-to').value = isoDate(today);
    if (isAdmin) document.getElementById('report-partner-filter').value = '';
    applyFilters();
});

function applyFilters() {
    const fromStr = document.getElementById('report-date-from').value;
    const toStr = document.getElementById('report-date-to').value;
    if (!fromStr || !toStr) return;

    const fromDate = new Date(fromStr + 'T00:00:00');
    const toDate = new Date(toStr + 'T23:59:59');
    const partnerFilter = isAdmin
        ? document.getElementById('report-partner-filter').value
        : '';

    const filtered = allOrders.filter(o => {
        const ts = new Date(o.orderDate);
        if (ts < fromDate || ts > toDate) return false;
        if (partnerFilter && String(o.partnerID) !== String(partnerFilter)) return false;
        return true;
    });

    renderStats(filtered);
    renderChart(filtered, fromDate, toDate);
    if (isAdmin) renderPartnerBreakdown(filtered);
    renderTopProducts(filtered);

    // Update subtitle
    const sub = document.getElementById('report-subtitle');
    const partnerLabel = partnerFilter ? ` for ${partnerLookup[partnerFilter]}` : '';
    sub.textContent = `Sales analysis from ${formatDate(fromStr)} to ${formatDate(toStr)}${partnerLabel}`;
}

// -------------------------------------------------------------
// Stat cards
// -------------------------------------------------------------
function renderStats(orders) {
    const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
    const totalUnits = orders.reduce((s, o) => s + (o.quantity ?? 0), 0);
    const orderCount = orders.length;
    const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

    const cards = [
        statCard({ label: 'Revenue', value: formatCHF(totalRevenue), sub: 'in selected period',
            icon: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,
            wide: true }),
        statCard({ label: 'Orders', value: orderCount, sub: orderCount === 1 ? 'order placed' : 'orders placed',
            icon: `<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` }),
        statCard({ label: 'Units Sold', value: totalUnits, sub: 'items shipped',
            icon: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>` }),
        statCard({ label: 'Avg Order Value', value: formatCHF(avgOrder), sub: 'per order',
            icon: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
            wide: true }),
    ];

    document.getElementById('report-stats-grid').innerHTML = cards.join('');
}

function statCard({ label, value, sub, icon, wide }) {
    return `
        <div class="stat-card stat-card-gold${wide ? ' stat-card-wide' : ''}">
            <div class="stat-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>
            </div>
            <div class="stat-card-label">${label}</div>
            <div class="stat-card-value">${value}</div>
            <div class="stat-card-sub">${sub}</div>
        </div>`;
}

// -------------------------------------------------------------
// SVG bar chart: daily revenue over selected range
// -------------------------------------------------------------
function renderChart(orders, fromDate, toDate) {
    const container = document.getElementById('sales-chart');

    // Build a map of day -> revenue for every day in the range
    const daily = new Map();
    const cursor = new Date(fromDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
        daily.set(isoDate(cursor), 0);
        cursor.setDate(cursor.getDate() + 1);
    }
    orders.forEach(o => {
        const d = isoDate(new Date(o.orderDate));
        if (daily.has(d)) {
            daily.set(d, daily.get(d) + (o.totalAmount ?? 0));
        }
    });

    const entries = Array.from(daily.entries());
    const maxVal = Math.max(...entries.map(e => e[1]), 0);

    if (maxVal === 0) {
        container.innerHTML = '<p class="dashboard-empty">No sales in this period.</p>';
        return;
    }

    // SVG dimensions and padding
    const w = 800, h = 280;
    const padLeft = 60, padRight = 16, padTop = 16, padBottom = 44;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const yMax = roundUpNice(maxVal);
    const barWidth = chartW / entries.length * 0.78;
    const barStep = chartW / entries.length;

    // Y-axis grid lines: 4 horizontal lines
    const ySteps = 4;
    const yLines = [];
    for (let i = 0; i <= ySteps; i++) {
        const v = (yMax / ySteps) * i;
        const y = padTop + chartH - (v / yMax) * chartH;
        yLines.push(`
            <line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}"
                  stroke="#e5e7eb" stroke-width="1"/>
            <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end"
                  font-size="11" fill="#6b7280">${formatCHFCompact(v)}</text>
        `);
    }

    // X-axis labels: show ~6 evenly spaced dates
    const labelEvery = Math.max(1, Math.floor(entries.length / 6));
    const xLabels = entries.map(([dateStr, _], i) => {
        if (i % labelEvery !== 0 && i !== entries.length - 1) return '';
        const x = padLeft + i * barStep + barStep / 2;
        const d = new Date(dateStr + 'T00:00:00');
        const label = d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
        return `<text x="${x}" y="${h - 16}" text-anchor="middle" font-size="11" fill="#6b7280">${label}</text>`;
    }).join('');

    // Bars with hover tooltips via <title>
    const bars = entries.map(([dateStr, value], i) => {
        const barH = value === 0 ? 0 : Math.max(2, (value / yMax) * chartH);
        const x = padLeft + i * barStep + (barStep - barWidth) / 2;
        const y = padTop + chartH - barH;
        const fullDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `
            <rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barH}"
                  rx="2" ry="2">
                <title>${fullDate}: ${formatCHF(value)}</title>
            </rect>
        `;
    }).join('');

    container.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="sales-chart-svg">
            ${yLines.join('')}
            ${bars}
            <line x1="${padLeft}" y1="${padTop + chartH}" x2="${w - padRight}" y2="${padTop + chartH}"
                  stroke="#374151" stroke-width="1"/>
            ${xLabels}
        </svg>
    `;
}

// -------------------------------------------------------------
// Per-partner breakdown (admin only)
// -------------------------------------------------------------
function renderPartnerBreakdown(orders) {
    const byPartner = new Map();
    orders.forEach(o => {
        if (!byPartner.has(o.partnerID)) {
            byPartner.set(o.partnerID, { orders: 0, units: 0, revenue: 0 });
        }
        const agg = byPartner.get(o.partnerID);
        agg.orders++;
        agg.units += (o.quantity ?? 0);
        agg.revenue += (o.totalAmount ?? 0);
    });

    // Include every known partner (even those with zero orders in the period)
    allPartners.forEach(p => {
        if (!byPartner.has(p.partnerID)) {
            byPartner.set(p.partnerID, { orders: 0, units: 0, revenue: 0 });
        }
    });

    const rows = Array.from(byPartner.entries())
        .map(([partnerId, agg]) => ({
            partnerName: partnerLookup[partnerId] || `Partner #${partnerId}`,
            ...agg,
            avg: agg.orders > 0 ? agg.revenue / agg.orders : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

    const tbody = document.getElementById('partner-breakdown-tbody');
    if (rows.every(r => r.orders === 0)) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No sales in this period.</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${escapeHtml(r.partnerName)}</td>
            <td>${r.orders}</td>
            <td>${r.units}</td>
            <td>${r.revenue.toFixed(2)}</td>
            <td>${r.avg.toFixed(2)}</td>
        </tr>
    `).join('');

    // Wire up CSV export
    document.getElementById('export-partner-csv').onclick = () => {
        exportCSV(
            ['Partner', 'Orders', 'Units Sold', 'Revenue (CHF)', 'Avg Order Value (CHF)'],
            rows.map(r => [r.partnerName, r.orders, r.units, r.revenue.toFixed(2), r.avg.toFixed(2)]),
            `fluxtrack-partner-breakdown-${todayIso()}.csv`
        );
    };
}

// -------------------------------------------------------------
// Top products
// -------------------------------------------------------------
function renderTopProducts(orders) {
    const byProduct = new Map();
    orders.forEach(o => {
        const key = String(o.productID);
        if (!byProduct.has(key)) {
            byProduct.set(key, {
                productID: o.productID,
                productName: o.productName,
                partnerID: o.partnerID,
                orders: 0, units: 0, revenue: 0,
            });
        }
        const agg = byProduct.get(key);
        agg.orders++;
        agg.units += (o.quantity ?? 0);
        agg.revenue += (o.totalAmount ?? 0);
    });

    const rows = Array.from(byProduct.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    const tbody = document.getElementById('top-products-tbody');
    const colspan = isAdmin ? 5 : 4;
    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="table-empty">No sales in this period.</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${escapeHtml(r.productName)}</td>
            ${isAdmin ? `<td>${escapeHtml(partnerLookup[r.partnerID] || '—')}</td>` : ''}
            <td>${r.orders}</td>
            <td>${r.units}</td>
            <td>${r.revenue.toFixed(2)}</td>
        </tr>
    `).join('');

    document.getElementById('export-products-csv').onclick = () => {
        const headers = isAdmin
            ? ['Product', 'Partner', 'Orders', 'Units Sold', 'Revenue (CHF)']
            : ['Product', 'Orders', 'Units Sold', 'Revenue (CHF)'];
        const csvRows = rows.map(r => isAdmin
            ? [r.productName, partnerLookup[r.partnerID] || '—', r.orders, r.units, r.revenue.toFixed(2)]
            : [r.productName, r.orders, r.units, r.revenue.toFixed(2)]
        );
        exportCSV(headers, csvRows, `fluxtrack-top-products-${todayIso()}.csv`);
    };
}

// -------------------------------------------------------------
// CSV export helper
// -------------------------------------------------------------
function exportCSV(headers, rows, filename) {
    const csv = [
        headers.map(escapeCSV).join(','),
        ...rows.map(r => r.map(escapeCSV).join(',')),
    ].join('\n');

    // BOM for Excel UTF-8 compatibility
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeCSV(val) {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replaceAll('"', '""') + '"';
    }
    return s;
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function todayIso() {
    return isoDate(new Date());
}
function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatCHF(n) {
    return 'CHF ' + (n ?? 0).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatCHFCompact(n) {
    if (n >= 1000) return Math.round(n / 100) / 10 + 'k';
    return Math.round(n);
}
function roundUpNice(n) {
    if (n <= 0) return 10;
    const pow = Math.pow(10, Math.floor(Math.log10(n)));
    const norm = n / pow;
    let nice;
    if (norm <= 1) nice = 1;
    else if (norm <= 2) nice = 2;
    else if (norm <= 5) nice = 5;
    else nice = 10;
    return nice * pow;
}
function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

loadAll();
