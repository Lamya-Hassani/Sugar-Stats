/* dashboard-charts.js */
const API_BASE_URL = "http://localhost:3000";

const V_THEME = {
    rose: '#FF3366',    // Raspberry
    gold: '#FFC107',    // Bright Gold
    purple: '#AA00FF',  // Lavender
    blue: '#00B0FF',    // Cyan
    pop: '#FF6D00',     // Orange
    chocolate: '#3E2723',
    white: '#FFFFFF'
};

Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.color = '#795548';
Chart.defaults.borderColor = 'rgba(121, 85, 72, 0.1)';

let charts = {};

async function initDashboard() {
    const token = localStorage.getItem("authToken");
    if (!token) {
        console.warn("No authToken found. Are you logged in?");
        // Optionally redirect or show a warning UI
    }

    try {
        const [ordersRes, clientsRes, productsRes, categoriesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/orders`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/clients`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/products`),
            fetch(`${API_BASE_URL}/api/categories`)
        ]);

        const orders = await ordersRes.json();
        const clients = await clientsRes.json();
        const products = await productsRes.json();
        const categories = await categoriesRes.json();

        // Ensure we have arrays before proceeding
        if (Array.isArray(orders) && Array.isArray(clients)) {
            updateDashboardStats(orders, clients);
            initDashboardCharts(orders, products, categories);
            renderRecentOrders(orders, clients);
        } else {
            console.error("Received invalid data format from API", { orders, clients });
        }
    } catch (err) {


        console.error("Error initializing dashboard data:", err);
    }
}

function updateDashboardStats(orders, clients) {
    // Total Orders
    document.querySelector('#card-orders .value').innerText = orders.length;

    // Monthly Revenue (Current Month)
    const now = new Date();
    const currentMonthOrders = orders.filter(o => {
        const d = new Date(o.orderDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const revenue = currentMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    document.querySelector('#card-revenue .value').innerText = `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    // Active Clients (Role: client)
    const activeClients = clients.filter(c => c.role === 'client').length;
    document.querySelector('#card-clients .value').innerText = activeClients;
}

function initDashboardCharts(orders, products, categories) {
    // 1. REVENUE CHART (Line) - Last 6 months
    const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
    const revenueByMonth = processRevenueByMonth(orders);

    let gradientRev = ctxRevenue.createLinearGradient(0, 0, 0, 400);
    gradientRev.addColorStop(0, 'rgba(216, 27, 96, 0.3)');
    gradientRev.addColorStop(1, 'rgba(216, 27, 96, 0.0)');

    charts.revenue = new Chart(ctxRevenue, {
        type: 'line',
        data: {
            labels: revenueByMonth.labels,
            datasets: [{
                label: 'Revenu ($)',
                data: revenueByMonth.data,
                borderColor: V_THEME.rose,
                backgroundColor: gradientRev,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: V_THEME.gold,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 2. CATEGORY CHART (Doughnut)
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    const categoryData = processCategoryDistribution(orders, products, categories);

    charts.category = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.data,
                backgroundColor: [V_THEME.rose, V_THEME.gold, V_THEME.purple, V_THEME.blue, '#8D6E63'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            cutout: '65%',
            plugins: { legend: { position: 'right' } }
        }
    });

    // 3. TREND CHART (Bar) - Orders by Day of Week
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    const trendData = processOrdersByDay(orders);

    charts.trend = new Chart(ctxTrend, {
        type: 'bar',
        data: {
            labels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            datasets: [{
                label: 'Commandes',
                data: trendData.data,
                backgroundColor: V_THEME.gold,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 4. SCATTER (Performance) - Order Size vs Status (Mapped to index)
    const ctxScatter = document.getElementById('scatterChart').getContext('2d');
    const scatterData = orders.map(o => ({
        x: o.totalAmount,
        y: o.items.reduce((sum, item) => sum + item.quantity, 0)
    }));

    charts.scatter = new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Valeur vs Quantité',
                data: scatterData,
                backgroundColor: V_THEME.purple,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Montant Total ($)' } },
                y: { title: { display: true, text: 'Articles' } }
            }
        }
    });

    // 5. RADAR (Process Metrics) - Simulating metrics
    const ctxDel = document.getElementById('deliveryChart').getContext('2d');
    charts.radar = new Chart(ctxDel, {
        type: 'radar',
        data: {
            labels: ['Qualité', 'Rapidité', 'Service', 'Originalité', 'Prix'],
            datasets: [{
                label: 'Performance Globale',
                data: [90, 75, 85, 95, 80],
                fill: true,
                backgroundColor: 'rgba(0, 176, 255, 0.2)',
                borderColor: V_THEME.blue,
                pointBackgroundColor: V_THEME.rose
            }]
        },
        options: {
            responsive: true,
            scales: { r: { angleLines: { display: true }, suggestMin: 0, suggestMax: 100 } }
        }
    });
}

// Helper Functions for Data Processing

function processRevenueByMonth(orders) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = { labels: [], data: [] };

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = months[d.getMonth()];
        const monthlyTotal = orders.filter(o => {
            const od = new Date(o.orderDate);
            return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        }).reduce((sum, o) => sum + o.totalAmount, 0);

        result.labels.push(label);
        result.data.push(monthlyTotal);
    }
    return result;
}

function processCategoryDistribution(orders, products, categories) {
    const catCounts = {};
    orders.forEach(o => {
        o.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                catCounts[product.id_categorie] = (catCounts[product.id_categorie] || 0) + item.quantity;
            }
        });
    });

    const labels = [];
    const data = [];
    Object.keys(catCounts).forEach(catId => {
        const category = categories.find(c => c.id_categorie == catId);
        labels.push(category ? category.libelle : `Cat #${catId}`);
        data.push(catCounts[catId]);
    });

    return { labels, data };
}

function processOrdersByDay(orders) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);

    orders.forEach(o => {
        const d = new Date(o.orderDate).getDay();
        counts[d]++;
    });

    return { labels: days, data: counts };
}

function renderRecentOrders(orders, clients) {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    // Sort by date desc and take top 5
    const recent = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5);

    tbody.innerHTML = recent.map(o => {
        const client = clients.find(c => c.id === o.clientId);
        const clientName = client ? (client.name || client.username) : `Client #${o.clientId}`;
        const statusClass = (o.status || 'pending').toLowerCase();

        return `
            <tr>
                <td><strong>#${o.id.toString().slice(-6)}</strong></td>
                <td>${clientName}</td>
                <td>${new Date(o.orderDate).toLocaleDateString()}</td>
                <td>$${o.totalAmount.toFixed(2)}</td>
                <td>${window.getStatusPill(o.status)}</td>
            </tr>
        `;
    }).join('');
}

function applyDashboardFilters() {

    // This could re-fetch data with query params or just filter the local array
    // For now, let's just re-init to simulate refresh
    initDashboard();
}

// Global exposure
window.initDashboard = initDashboard;
window.applyDashboardFilters = applyDashboardFilters;
window.initDashboardCharts = initDashboardCharts;