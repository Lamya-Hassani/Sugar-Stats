const API_BASE_URL = "http://localhost:3000";
let allReviews = [];
let allProducts = [];
let allClients = [];

let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'date';
let sortDesc = true;
let searchQuery = '';

async function fetchProducts() {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    allProducts = await res.json();
}

async function fetchClients() {
    const res = await fetch(`${API_BASE_URL}/api/clients`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
    });
    allClients = await res.json();
}

async function fetchReviews() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/reviews`);
        allReviews = await res.json();
        return allReviews;
    } catch (err) {
        console.error("Error fetching reviews:", err);
    }
}

async function deleteReview(id) {
    const confirmed = await window.showConfirmModal({
        title: 'Censure Analytique',
        text: 'Voulez-vous vraiment occulter ce feedback du laboratoire ?',
        confirmText: 'Occulter',
        icon: 'fa-eye-slash'
    });

    if (!confirmed) return;

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            window.showToast("Feedback occulté.", "success");
            renderReviewsTable();
        } else {
            window.showToast("Erreur censure feedback.", "error");
        }
    } catch (err) {
        console.error("Error deleting review:", err);
    }
}

function getProductName(id) {
    const p = allProducts.find(prod => prod.id == id);
    return p ? p.name : "Inconnu";
}

function getClientName(id) {
    const c = allClients.find(client => client.id == id);
    return c ? (c.name || c.username) : "Inconnu";
}

async function renderReviewsTable() {
    if (allReviews.length === 0) await fetchReviews();

    let filtered = allReviews.filter(r => {
        const text = (r.comment || r.content || "").toLowerCase();
        const idStr = (r.id || "").toString();
        const query = searchQuery.toLowerCase();
        return text.includes(query) || idStr.includes(query);
    });

    filtered = window.sortData(filtered, sortKey, sortDesc);
    const { items, pages } = window.paginateData(filtered, currentPage, itemsPerPage);

    const tbody = document.getElementById('reviewsTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(r => `
    <tr style="cursor:default;">
        <td><strong>#REV-${r.id}</strong></td>
        <td><div class="rating-stars">${'★'.repeat(r.rating || 1)}${'☆'.repeat(5 - (r.rating || 1))}</div></td>
        <td><p class="review-content-preview" title="${r.comment || r.content}">${(r.comment || r.content || '').substring(0, 60)}${(r.comment || r.content || '').length > 60 ? '...' : ''}</p></td>
        <td>${new Date(r.date || Date.now()).toLocaleDateString('fr-FR')}</td>
        <td>
            <div class="actions-cell">
                <button onclick="deleteReview(${r.id})" class="icon-btn btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>
  `).join('');

    window.renderPagination(pages);
}

window.handleSearch = function () {
    searchQuery = document.getElementById('searchInput').value;
    currentPage = 1;
    renderReviewsTable();
};

window.handleSort = function (key) {
    if (sortKey === key) sortDesc = !sortDesc;
    else { sortKey = key; sortDesc = false; }
    renderReviewsTable();
};

window.goToPage = function (page) {
    currentPage = page;
    renderReviewsTable();
};

window.renderReviewsTable = renderReviewsTable;
window.deleteReview = deleteReview;
window.showDetails = showDetails;
window.exportToPDF = exportToPDF;

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<div class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`;
    }
    container.innerHTML = html;
}

window.handleSearch = function () {
    searchQuery = document.getElementById('searchInput').value;
    currentPage = 1;
    renderReviewsTable();
};

window.handleSort = function (key) {
    if (sortKey === key) sortDesc = !sortDesc;
    else { sortKey = key; sortDesc = false; }
    renderReviewsTable();
};

window.goToPage = function (page) {
    currentPage = page;
    renderReviewsTable();
};

window.exportReviewsCSV = function () {
    const data = allReviews.map(r => ({
        ID: r.id,
        Produit: getProductName(r.productId),
        Client: getClientName(r.clientId),
        Score: r.rating,
        Commentaire: r.comment,
        Date: r.date
    }));
    window.exportToCSV(data, 'SugarStats_Feedback.csv');
};

async function showDetails(id) {
    if (allProducts.length === 0) await fetchProducts();
    if (allClients.length === 0) await fetchClients();
    await fetchReviews();
    const r = allReviews.find(rev => rev.id == id);
    const leftHTML = `
        <div class="modal-avatar" style="border-radius:15px; border-color:var(--c-rose); background:rgba(216,27,96,0.05);">
            <i class="fas fa-comment-dots"></i>
        </div>
        <div class="modal-info">
            <h3 class="modal-title-main">ANALYSE SENSORIELLE</h3>
            <p class="modal-subtitle-main">REF: #REV-${r.id}</p>
        </div>
    `;

    const rightHTML = `
        <div class="modal-row">
            <span class="modal-label">Produit Concerné</span>
            <span class="modal-value">${getProductName(r.productId)}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Emetteur</span>
            <span class="modal-value">${getClientName(r.clientId)}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Valeur Perçue</span>
            <span class="modal-value">${r.rating} / 5</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Date Emission</span>
            <span class="modal-value">${new Date(r.date || Date.now()).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="modal-row" style="grid-column: 1 / -1; margin-top:1rem; padding:1.2rem; background:rgba(216, 27, 96, 0.03); border-radius:12px; border:1px solid rgba(216, 27, 96, 0.1);">
             <span class="modal-label" style="color:var(--c-rose);">Critique Littérale</span>
             <span class="modal-value" style="font-family:'Playfair Display', serif; font-style:italic; font-size:1.1rem; line-height:1.6; color:var(--c-text-light);">
                "${r.comment || 'Aucun commentaire textuel.'}"
             </span>
        </div>
    `;

    const actionsHTML = `
        <button onclick="window.exportToPDF()" class="modal-btn modal-btn-primary">
            <i class="fas fa-file-pdf"></i> Exporter Rapport
        </button>
    `;

    window.showDetailsModal({
        title: 'Feedback Gourmet',
        icon: 'fa-comments',
        leftContent: leftHTML,
        rightContentHTML: rightHTML,
        actionsHTML: actionsHTML
    });
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const prod = document.querySelector('.receipt-row strong').innerText;

    doc.setFontSize(22);
    doc.setTextColor(216, 27, 96);
    doc.text('Sugar & Stats - Rapport de Feedback', 20, 20);

    doc.setFontSize(14);
    doc.setTextColor(78, 52, 46);
    doc.text(`Produit: ${prod}`, 20, 35);

    let y = 50;
    const rows = document.querySelectorAll('.receipt-row');
    rows.forEach(row => {
        const label = row.querySelector('span').innerText;
        const value = row.querySelector('strong').innerText;
        doc.text(`${label}: ${value}`, 20, y);
        y += 10;
    });

    const comment = document.querySelector('p[style*="font-style:italic"]').innerText;
    doc.text('Commentaire:', 20, y);
    doc.setFontSize(11);
    doc.text(comment, 20, y + 10, { maxWidth: 170 });

    doc.save(`SugarStats_Review_${prod.replace(/\s+/g, '_')}.pdf`);
}

window.renderReviewsTable = renderReviewsTable;
window.deleteReview = deleteReview;
window.showDetails = showDetails;
window.exportToPDF = exportToPDF;
