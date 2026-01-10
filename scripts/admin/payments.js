const API_BASE_URL = "http://localhost:3000";
let allPayments = [];
let allClients = [];

let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'paymentDate';
let sortDesc = true;
let searchQuery = '';
let selectedStatus = '';

async function fetchClients() {
    const res = await fetch(`${API_BASE_URL}/api/clients`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
    });
    allClients = await res.json();
}

async function fetchPayments() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/payments`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
        });
        allPayments = await res.json();
        return allPayments;
    } catch (err) {
        console.error("Error fetching payments:", err);
    }
}

async function deletePayment(id) {
    const confirmed = await window.showConfirmModal({
        title: 'Annulation de Flux',
        text: 'Voulez-vous vraiment invalider cette transaction financière ?',
        confirmText: 'Invalider',
        icon: 'fa-file-invoice-dollar'
    });

    if (!confirmed) return;

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/payments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            window.showToast("Flux monétaire invalidé.", "success");
            renderPaymentsTable();
        } else {
            window.showToast("Erreur financière.", "error");
        }
    } catch (err) {
        console.error("Error deleting payment:", err);
    }
}

async function savePayment(event) {
    event.preventDefault();
    const id = document.getElementById('paymentId')?.value;
    const isEdit = !!id;

    const paymentData = {
        clientId: parseInt(document.getElementById('clientId').value),
        orderId: parseInt(document.getElementById('orderId').value),
        amount: parseFloat(document.getElementById('amount').value),
        paymentMethod: document.getElementById('paymentMethod').value,
        paymentStatus: document.getElementById('paymentStatus').value,
        paymentDate: document.getElementById('paymentDate').value,
        transactionId: document.getElementById('transactionId').value
    };

    const token = localStorage.getItem("authToken");

    try {
        const res = await fetch(isEdit ? `${API_BASE_URL}/api/payments/${id}` : `${API_BASE_URL}/api/payments`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(paymentData)
        });

        if (res.ok) window.location.href = 'list.html';
        else window.showToast("Échec de l'enregistrement.", "error");
    } catch (err) {
        console.error("Error saving payment:", err);
    }
}

function getClientName(id) {
    const c = allClients.find(client => client.id == id);
    return c ? (c.name || c.username) : "Inconnu";
}

async function renderPaymentsTable() {
    if (allPayments.length === 0) await fetchPayments();

    let filtered = allPayments.filter(p => {
        const idStr = (p.id || "").toString();
        const method = (p.paymentMethod || "").toLowerCase();
        const status = (p.paymentStatus || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return idStr.includes(query) || method.includes(query) || status.includes(query);
    });

    filtered = window.sortData(filtered, sortKey, sortDesc);
    const { items, pages } = window.paginateData(filtered, currentPage, itemsPerPage);

    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(p => `
    <tr ondblclick="showDetails(${p.id})" style="cursor:pointer;" title="Double-cliquez pour les détails">
        <td><strong>#PAY-${p.id}</strong></td>
        <td><span style="font-weight:700; color:var(--c-rose);">$${(p.amount || 0).toFixed(2)}</span></td>
        <td><i class="fas fa-money-check-alt" style="margin-right:0.5rem; color:var(--c-text-light);"></i> ${p.paymentMethod || 'N/A'}</td>
        <td>${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('fr-FR') : 'N/A'}</td>
        <td><span class="status-pill status-${(p.paymentStatus || 'pending').toLowerCase()}">${p.paymentStatus || 'Pending'}</span></td>
        <td>
            <div class="actions-cell">
                <a href="edit.html?id=${p.id}" class="icon-btn btn-edit" title="Modifier"><i class="fas fa-edit"></i></a>
                <button onclick="event.stopPropagation(); deletePayment(${p.id})" class="icon-btn btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>
  `).join('');

    window.renderPagination(pages);
}

window.handleSearch = function () {
    searchQuery = document.getElementById('searchInput').value;
    selectedStatus = document.getElementById('statusFilter')?.value || "";
    currentPage = 1;
    renderPaymentsTable();
};

window.handleSort = function (key) {
    if (sortKey === key) sortDesc = !sortDesc;
    else { sortKey = key; sortDesc = false; }
    renderPaymentsTable();
}

window.goToPage = function (page) {
    currentPage = page;
    renderPaymentsTable();
};

window.exportPaymentsCSV = function () {
    const data = allPayments.map(p => ({
        TXN_ID: p.transactionId,
        Client: getClientName(p.clientId),
        Montant: p.amount,
        Date: p.paymentDate,
        Methode: p.paymentMethod,
        Statut: p.paymentStatus
    }));
    window.exportToCSV(data, 'SugarStats_Finance.csv');
};

async function populateDropdowns() {
    await fetchClients();
    const clientSelect = document.getElementById('clientId');
    if (!clientSelect) return;
    clientSelect.innerHTML = '<option value="">Choisir un sujet</option>' +
        allClients.map(c => `<option value="${c.id}">${c.name || c.username}</option>`).join('');
}

async function prefillPaymentForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    await populateDropdowns();
    await fetchPayments();
    const pay = allPayments.find(p => p.id == id);
    if (pay) {
        document.getElementById('paymentId').value = pay.id;
        document.getElementById('clientId').value = pay.clientId;
        document.getElementById('orderId').value = pay.orderId;
        document.getElementById('amount').value = pay.amount;
        document.getElementById('paymentMethod').value = pay.paymentMethod;
        document.getElementById('paymentStatus').value = pay.paymentStatus;
        document.getElementById('paymentDate').value = pay.paymentDate.split('T')[0];
        document.getElementById('transactionId').value = pay.transactionId || "";
    }
}

async function showDetails(id) {
    await fetchPayments();
    const pay = allPayments.find(p => p.id == id);
    if (!pay) return;

    const leftHTML = `
        <div class="modal-avatar" style="border-radius:15px; border-color:var(--c-rose); background:rgba(216,27,96,0.05);">
            <i class="fas fa-credit-card"></i>
        </div>
        <div class="modal-info">
            <h3 class="modal-title-main" style="color:var(--c-rose); font-weight:700;">$${(pay.amount || 0).toFixed(2)}</h3>
            <div style="text-align:center; margin-top:0.5rem;">
                <span class="status-pill status-${(pay.paymentStatus || 'pending').toLowerCase()}">${pay.paymentStatus || 'Pending'}</span>
            </div>
        </div>
    `;

    const rightHTML = `
        <div class="modal-row">
            <span class="modal-label">Référence Transactionnelle</span>
            <span class="modal-value">#PAYMENT-${pay.id}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Méthode de Règlement</span>
            <span class="modal-value">${pay.paymentMethod || 'N/A'}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Horodatage</span>
            <span class="modal-value">${pay.paymentDate ? new Date(pay.paymentDate).toLocaleString('fr-FR') : 'N/A'}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Statut du Transfert</span>
            <span class="modal-value" style="font-weight:700;">${(pay.paymentStatus || 'Pending').toUpperCase()}</span>
        </div>
        <div class="modal-row" style="grid-column: 1 / -1; margin-top:1rem; padding:1.2rem; background:rgba(216, 27, 96, 0.03); border-radius:12px; border:1px solid rgba(216, 27, 96, 0.1);">
             <span class="modal-label" style="color:var(--c-rose);">Note d'Audit FinTech</span>
             <span class="modal-value" style="font-size:0.85rem; color:var(--c-text-light);">
                Cette transaction a été validée par le système de compensation central. Aucun litige en cours. Le montant a été crédité sur le compte principal Sugar & Stats.
             </span>
        </div>
    `;

    const actionsHTML = `
        <a href="edit.html?id=${pay.id}" class="modal-btn modal-btn-rose">
            <i class="fas fa-edit"></i> Rectifier Ecriture
        </a>
        <button onclick="window.exportToPDF()" class="modal-btn modal-btn-primary">
            <i class="fas fa-file-pdf"></i> Exporter PDF
        </button>
    `;

    window.showDetailsModal({
        title: 'Registre Transactionnel',
        icon: 'fa-file-invoice-dollar',
        leftContent: leftHTML,
        rightContentHTML: rightHTML,
        actionsHTML: actionsHTML
    });
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const txnId = document.querySelector('.modal-title-main').innerText;

    doc.setFontSize(22);
    doc.setTextColor(216, 27, 96);
    doc.text('Sugar & Stats - Confirmation de Flux', 20, 20);

    doc.setFontSize(14);
    doc.setTextColor(78, 52, 46);
    doc.text(txnId, 20, 35);

    doc.save(`SugarStats_Receipt_${txnId}.pdf`);
}

window.showDetails = showDetails;
window.exportToPDF = exportToPDF;
window.deletePayment = deletePayment;
window.savePayment = savePayment;
window.renderPaymentsTable = renderPaymentsTable;
window.prefillPaymentForm = prefillPaymentForm;
window.populateDropdowns = populateDropdowns;
