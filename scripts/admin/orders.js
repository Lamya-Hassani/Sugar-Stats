const API_BASE_URL = "http://localhost:3000";
let allOrders = [];
let allClients = [];

let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'id';
let sortDesc = true;
let searchQuery = '';
let selectedStatus = '';

async function fetchClients() {
    const res = await fetch(`${API_BASE_URL}/api/clients`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
    });
    allClients = await res.json();
}

async function fetchOrders() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/orders`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
        });
        allOrders = await res.json();
        return allOrders;
    } catch (err) {
        console.error("Error fetching orders:", err);
    }
}

async function deleteOrder(id) {
    const confirmed = await window.showConfirmModal({
        title: 'Annulation de Mission',
        text: 'Voulez-vous vraiment annuler et archiver cette mission logistique ?',
        confirmText: 'Annuler Mission',
        icon: 'fa-box-open'
    });

    if (!confirmed) return;

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            window.showToast("Mission logistique annulée.", "success");
            renderOrdersTable();
        } else {
            window.showToast("Échec de l'annulation.", "error");
        }
    } catch (err) {
        console.error("Error deleting order:", err);
    }
}

async function saveOrder(event) {
    event.preventDefault();
    const id = document.getElementById('orderId')?.value;
    const isEdit = !!id;

    const orderData = {
        clientId: parseInt(document.getElementById('clientId').value),
        orderDate: document.getElementById('orderDate').value,
        status: document.getElementById('status').value,
        totalAmount: parseFloat(document.getElementById('totalAmount').value),
        items: [] // In a real app, nested items would be here
    };

    const token = localStorage.getItem("authToken");

    try {
        const res = await fetch(isEdit ? `${API_BASE_URL}/api/orders/${id}` : `${API_BASE_URL}/api/orders`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            window.showToast(isEdit ? "Mission mise à jour !" : "Nouvelle mission de livraison confirmée !", "success");
            setTimeout(() => window.location.href = 'list.html', 1500);
        } else {
            window.showToast("Erreur logistique.", "error");
        }
    } catch (err) {
        console.error("Error saving order:", err);
    }
}

function getClientName(id) {
    const c = allClients.find(client => client.id == id);
    return c ? (c.name || c.username) : "Sujet Inconnu";
}

async function renderOrdersTable() {
    if (allClients.length === 0) await fetchClients();
    if (allOrders.length === 0) await fetchOrders();

    let filtered = allOrders.filter(o => {
        const clientName = getClientName(o.clientId).toLowerCase();
        const matchesSearch = o.id.toString().includes(searchQuery) || clientName.includes(searchQuery.toLowerCase());
        const matchesStatus = !selectedStatus || o.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    filtered = window.sortData(filtered, sortKey, sortDesc);
    const { items, pages } = window.paginateData(filtered, currentPage, itemsPerPage);

    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(o => `
    <tr ondblclick="showDetails(${o.id})" style="cursor:pointer;" title="Double-cliquez pour les détails">
        <td><strong>#MIS-${o.id}</strong></td>
        <td><i class="fas fa-user-circle" style="color:var(--c-text-light); margin-right:0.5rem;"></i> ${getClientName(o.clientId)}</td>
        <td>${new Date(o.orderDate).toLocaleDateString('fr-FR')}</td>
        <td><span style="font-weight:700; color:var(--c-rose);">$${o.totalAmount.toFixed(2)}</span></td>
        <td>${window.getStatusPill(o.status)}</td>
        <td>
            <div class="actions-cell">
                <a href="edit.html?id=${o.id}" class="icon-btn btn-edit" title="Modifier"><i class="fas fa-edit"></i></a>
                <button onclick="event.stopPropagation(); deleteOrder(${o.id})" class="icon-btn btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>
  `).join('');

    renderPagination(pages);
}

// ... (existing navigation/export) ...

async function showDetails(id) {
    if (allClients.length === 0) await fetchClients();
    await fetchOrders();
    const order = allOrders.find(o => o.id == id);
    if (!order) return;

    const leftHTML = `
        <div class="modal-avatar" style="border-radius:15px; border-color:var(--c-rose); background:rgba(216,27,96,0.05);">
            <i class="fas fa-receipt"></i>
        </div>
        <div class="modal-info">
            <h3 class="modal-title-main">#MIS-${order.id}</h3>
            <div style="text-align:center; margin-top:0.5rem;">
                ${window.getStatusPill(order.status)}
            </div>
        </div>
    `;

    const rightHTML = `
        <div class="modal-row">
            <span class="modal-label">Sujet Gourmet</span>
            <span class="modal-value">${getClientName(order.clientId)}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Date de Mission</span>
            <span class="modal-value">${new Date(order.orderDate).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Valeur de la Transaction</span>
            <span class="modal-value" style="font-weight:700; color:var(--c-rose);">$${order.totalAmount.toFixed(2)}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">ID Transactionnel</span>
            <span class="modal-value">#ORD-${order.id}</span>
        </div>
        <div class="modal-row" style="grid-column: 1 / -1; margin-top:1rem; padding:1.2rem; background:rgba(216, 27, 96, 0.03); border-radius:12px; border:1px solid rgba(216, 27, 96, 0.1);">
             <span class="modal-label" style="color:var(--c-rose);">Note Logistique</span>
             <span class="modal-value" style="font-size:0.85rem; color:var(--c-text-light);">
                Expédition haute priorité via le canal Sugar Express. Conditions de conservation optimales garanties pour une expérience gourmet parfaite.
             </span>
        </div>
    `;

    const actionsHTML = `
        <a href="edit.html?id=${order.id}" class="modal-btn modal-btn-rose">
            <i class="fas fa-edit"></i> Modifier Mission
        </a>
        <button onclick="window.exportToPDF()" class="modal-btn modal-btn-primary">
            <i class="fas fa-file-pdf"></i> Exporter PDF
        </button>
    `;

    window.showDetailsModal({
        title: 'Voucher Logistique',
        icon: 'fa-box-open',
        leftContent: leftHTML,
        rightContentHTML: rightHTML,
        actionsHTML: actionsHTML
    });
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const idRef = document.querySelector('.receipt-header p').innerText;

    doc.setFontSize(22);
    doc.setTextColor(216, 27, 96);
    doc.text('Sugar & Stats - Facture Logistique', 20, 20);

    doc.setFontSize(14);
    doc.setTextColor(78, 52, 46);
    doc.text(idRef, 20, 35);

    let y = 50;
    const rows = document.querySelectorAll('.receipt-row, .receipt-total');
    rows.forEach(row => {
        const label = row.querySelector('span').innerText;
        const value = row.querySelector('strong').innerText;
        doc.text(`${label}: ${value}`, 20, y);
        y += 10;
    });

    doc.save(`SugarStats_Invoice_${idRef.replace('#', '')}.pdf`);
}

window.goToPage = function (page) {
    currentPage = page;
    renderOrdersTable();
};

window.handleSearch = function () {
    searchQuery = document.getElementById('searchInput').value;
    selectedStatus = document.getElementById('statusFilter')?.value || "";
    currentPage = 1;
    renderOrdersTable();
};

window.handleSort = function (key) {
    if (sortKey === key) sortDesc = !sortDesc;
    else { sortKey = key; sortDesc = false; }
    renderOrdersTable();
};

async function populateDropdowns() {
    await fetchClients();
    const select = document.getElementById('clientId');
    if (!select) return;
    select.innerHTML = '<option value="">Choisir un sujet gourmet</option>' +
        allClients.map(c => `<option value="${c.id}">${c.name || c.username}</option>`).join('');
}

async function prefillOrderForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    await populateDropdowns();
    await fetchOrders();
    const order = allOrders.find(o => o.id == id);
    if (order) {
        document.getElementById('orderId').value = order.id;
        document.getElementById('clientId').value = order.clientId;
        document.getElementById('orderDate').value = order.orderDate.split('T')[0];
        document.getElementById('status').value = order.status;
        document.getElementById('totalAmount').value = order.totalAmount;
    }
}

window.deleteOrder = deleteOrder;
window.renderOrdersTable = renderOrdersTable;
window.saveOrder = saveOrder;
window.prefillOrderForm = prefillOrderForm;
window.showDetails = showDetails;
window.exportToPDF = exportToPDF;
window.populateDropdowns = populateDropdowns;
