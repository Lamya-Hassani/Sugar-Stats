const API_BASE_URL = "http://localhost:3000";
let allOrders = [];
let allClients = [];
let allProducts = [];
let currentOrderItems = [];

let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'id';
let sortDesc = true;
let searchQuery = '';
let selectedStatus = '';

async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        allProducts = await res.json();
    } catch (err) {
        console.error("Error fetching products:", err);
    }
}

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
            await fetchOrders();
            renderOrdersTable();
        } else {
            window.showToast("Échec de l'annulation.", "error");
        }
    } catch (err) {
        console.error("Error deleting order:", err);
    }
}

window.exportOrdersCSV = function () {
    const dataToExport = allOrders.map(o => ({
        ID: o.id,
        Client: getClientName(o.clientId),
        Date: new Date(o.orderDate).toLocaleDateString(),
        Total: o.totalAmount,
        Status: o.status
    }));
    window.exportToCSV(dataToExport, 'SugarStats_Orders.csv');
};


async function saveOrder(event) {
    event.preventDefault();
    const id = document.getElementById('orderId')?.value;
    const isEdit = !!id;

    const orderData = {
        clientId: parseInt(document.getElementById('clientId').value),
        orderDate: document.getElementById('orderDate').value,
        status: document.getElementById('status').value,
        totalAmount: parseFloat(document.getElementById('totalAmount').value),
        items: currentOrderItems
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

// Nested Items Management
window.addItemToOrder = function () {
    const productId = document.getElementById('productSelect')?.value;
    const quantity = parseInt(document.getElementById('productQuantity')?.value || 1);

    if (!productId) {
        window.showToast("Veuillez sélectionner un produit.", "info");
        return;
    }

    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    const existingItem = currentOrderItems.find(i => i.productId == productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        currentOrderItems.push({
            productId: parseInt(productId),
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }

    renderItemsTable();
    calculateTotal();

    // Reset selection
    document.getElementById('productSelect').value = "";
    document.getElementById('productQuantity').value = "1";
};

window.removeOrderItem = function (index) {
    currentOrderItems.splice(index, 1);
    renderItemsTable();
    calculateTotal();
};

function renderItemsTable() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    if (currentOrderItems.length === 0) {
        container.innerHTML = `<p style="color: var(--c-text-muted); font-size: 0.9rem; text-align: center;">Aucun produit ajouté.</p>`;
        return;
    }

    let html = `
        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
            <thead>
                <tr style="border-bottom:1px solid rgba(0,0,0,0.1); text-align:left;">
                    <th style="padding:0.5rem;">Produit</th>
                    <th style="padding:0.5rem;">Qté</th>
                    <th style="padding:0.5rem;">Prix</th>
                    <th style="padding:0.5rem;">Sous-total</th>
                    <th style="padding:0.5rem;"></th>
                </tr>
            </thead>
            <tbody>
    `;

    currentOrderItems.forEach((item, index) => {
        html += `
            <tr style="border-bottom:1px solid rgba(0,0,0,0.05);">
                <td style="padding:0.5rem;">${item.name}</td>
                <td style="padding:0.5rem;">${item.quantity}</td>
                <td style="padding:0.5rem;">$${item.price.toFixed(2)}</td>
                <td style="padding:0.5rem;">$${(item.price * item.quantity).toFixed(2)}</td>
                <td style="padding:0.5rem; text-align:right;">
                    <button type="button" onclick="window.removeOrderItem(${index})" style="background:none; border:none; color:var(--c-magenta); cursor:pointer;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function calculateTotal() {
    const total = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalInput = document.getElementById('totalAmount');
    if (totalInput) {
        totalInput.value = total.toFixed(2);
    }
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

    // Get content from the modal
    const openModal = document.querySelector('.custom-modal-overlay.active .custom-modal') || document.querySelector('.details-modal-overlay.active .details-modal');
    if (!openModal) {
        window.showToast("Ouvrez d'abord une fiche.", "info");
        return;
    }

    const title = openModal.querySelector('.modal-title-main')?.innerText || "Document";
    const subtitle = openModal.querySelector('.modal-subtitle-main')?.innerText || "";

    doc.setFontSize(22);
    doc.setTextColor(216, 27, 96);
    doc.text('Sugar & Stats - Document Logistique', 20, 20);

    doc.setFontSize(14);
    doc.setTextColor(78, 52, 46);
    doc.text(title, 20, 35);
    doc.setFontSize(12);
    doc.text(subtitle, 20, 42);

    let y = 55;
    const rows = openModal.querySelectorAll('.modal-row');
    rows.forEach(row => {
        const label = row.querySelector('.modal-label')?.innerText || "";
        const value = row.querySelector('.modal-value')?.innerText || "";

        doc.setFontSize(11);
        doc.setTextColor(141, 110, 99);
        doc.text(label, 20, y);

        doc.setFontSize(12);
        doc.setTextColor(78, 52, 46);
        const splitValue = doc.splitTextToSize(value, 150);
        doc.text(splitValue, 20, y + 6);

        y += 12 + (splitValue.length * 5);
    });

    doc.save(`SugarStats_Order_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
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
    if (select) {
        select.innerHTML = '<option value="">Choisir un sujet gourmet</option>' +
            allClients.map(c => `<option value="${c.id}">${c.name || c.username}</option>`).join('');
    }

    await fetchProducts();
    const productSelect = document.getElementById('productSelect');
    if (productSelect) {
        productSelect.innerHTML = '<option value="">Ajouter un produit...</option>' +
            allProducts.map(p => `<option value="${p.id}">${p.name} ($${p.price})</option>`).join('');
    }
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

        // Load items if they exist (assuming backend sends them, otherwise start empty or mock)
        if (order.items && Array.isArray(order.items)) {
            currentOrderItems = order.items.map(item => ({
                productId: item.productId || item.id, // Handle potential backend naming diffs
                name: item.name || getProductName(item.productId),
                price: item.price,
                quantity: item.quantity
            }));
            renderItemsTable();
        }
    }
}

function getProductName(id) {
    const p = allProducts.find(product => product.id == id);
    return p ? p.name : "Produit Inconnu";
}

window.deleteOrder = deleteOrder;
window.renderOrdersTable = renderOrdersTable;
window.saveOrder = saveOrder;
window.prefillOrderForm = prefillOrderForm;
window.showDetails = showDetails;
window.exportToPDF = exportToPDF;
window.populateDropdowns = populateDropdowns;
window.addItemToOrder = addItemToOrder;
window.removeOrderItem = removeOrderItem;
