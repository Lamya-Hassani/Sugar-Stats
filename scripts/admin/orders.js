const API_BASE_URL = "http://localhost:3000";
let allOrders = [];
let allClients = [];
let allProducts = [];

// ==================== API CALLS ====================

async function fetchData() {
    const token = localStorage.getItem("authToken");
    try {
        const [ordersRes, clientsRes, productsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/orders`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/clients`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/products`)
        ]);

        allOrders = await ordersRes.json();
        allClients = await clientsRes.json();
        allProducts = await productsRes.json();
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

async function deleteOrder(id) {
    if (!confirm("Voulez-vous vraiment archiver cette commande scientifique ?")) return;

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Commande supprimée.");
            location.reload();
        } else {
            const data = await res.json();
            alert(data.error || "Échec de la suppression.");
        }
    } catch (err) {
        console.error("Error deleting order:", err);
    }
}

async function saveOrder(event) {
    event.preventDefault();
    const id = document.getElementById('orderId')?.value;
    const isEdit = !!id;

    // Collect items from dynamic rows
    const itemRows = document.querySelectorAll('.item-row');
    const items = Array.from(itemRows).map(row => ({
        productId: parseInt(row.querySelector('.product-select').value),
        quantity: parseInt(row.querySelector('.quantity-input').value)
    })).filter(item => item.productId && item.quantity > 0);

    if (items.length === 0) {
        alert("Veuillez ajouter au moins un produit valide.");
        return;
    }

    const orderData = {
        clientId: parseInt(document.getElementById('clientId').value),
        items: items,
        totalAmount: parseFloat(document.getElementById('totalAmount').value),
        status: document.getElementById('status').value,
        orderDate: document.getElementById('orderDate').value || new Date().toISOString()
    };

    const token = localStorage.getItem("authToken");
    const url = isEdit ? `${API_BASE_URL}/api/orders/${id}` : `${API_BASE_URL}/api/orders`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert(isEdit ? "Commande mise à jour !" : "Commande créée !");
            window.location.href = 'list.html';
        } else {
            const data = await res.json();
            alert(data.error || "Échec de l'enregistrement.");
        }
    } catch (err) {
        console.error("Error saving order:", err);
    }
}

// ==================== UI RENDERING ====================

function getClientName(id) {
    const client = allClients.find(c => c.id === id);
    return client ? (client.name || client.username) : `Client #${id}`;
}

async function loadOrdersList() {
    const grid = document.getElementById('ordersGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column: 1/-1;">Calcul des trajectoires logistiques...</p>';

    await fetchData();

    if (!allOrders || allOrders.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1;">Aucune commande détectée dans le radar.</p>';
        return;
    }

    grid.innerHTML = allOrders.map(o => `
        <div class="order-card">
            <div class="order-status-badge ${o.status.toLowerCase().replace(/\s/g, '-')}">${o.status}</div>
            <div class="order-header">
                <div class="order-id">#${o.id.toString().slice(-6)}</div>
                <div class="order-date">${new Date(o.orderDate).toLocaleDateString()}</div>
            </div>
            <div class="order-client">${getClientName(o.clientId)}</div>
            <div class="order-amount">$${o.totalAmount.toFixed(2)}</div>
            <div class="order-actions">
                <a href="edit.html?id=${o.id}" class="action-btn edit"><i class="fas fa-eye"></i> Gérer</a>
                <button onclick="deleteOrder(${o.id})" class="action-btn delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function addItemRow(productId = '', quantity = 1) {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <select class="product-select" onchange="calculateTotal()" required>
            <option value="">Sélectionner un produit</option>
            ${allProducts.map(p => `<option value="${p.id}" data-price="${p.price}" ${p.id == productId ? 'selected' : ''}>${p.name} ($${p.price})</option>`).join('')}
        </select>
        <input type="number" class="quantity-input" min="1" value="${quantity}" oninput="calculateTotal()" required>
        <button type="button" class="remove-item-btn" onclick="this.parentElement.remove(); calculateTotal();"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(row);
    calculateTotal();
}

function calculateTotal() {
    let total = 0;
    const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => {
        const select = row.querySelector('.product-select');
        const quantity = row.querySelector('.quantity-input').value;
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
            total += parseFloat(selectedOption.dataset.price) * parseInt(quantity);
        }
    });
    document.getElementById('totalAmount').value = total.toFixed(2);
}

async function populateClientDropdown() {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/clients`, { headers: { "Authorization": `Bearer ${token}` } });
    allClients = await res.json();

    const select = document.getElementById('clientId');
    if (!select) return;

    select.innerHTML = '<option value="">Choisir un sujet (client)</option>' +
        allClients.map(c => `<option value="${c.id}">${c.name || c.username}</option>`).join('');
}

async function prefillOrderForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    await fetchData();
    await populateClientDropdown();

    const order = id ? allOrders.find(o => o.id == id) : null;

    if (order) {
        document.getElementById('orderId').value = order.id;
        document.getElementById('clientId').value = order.clientId;
        document.getElementById('totalAmount').value = order.totalAmount;
        document.getElementById('status').value = order.status;
        document.getElementById('orderDate').value = order.orderDate.split('T')[0];

        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        order.items.forEach(item => addItemRow(item.productId, item.quantity));
    } else {
        // For NEW order, add one empty row by default
        addItemRow();
    }
}

// Export functions
window.loadOrdersList = loadOrdersList;
window.deleteOrder = deleteOrder;
window.saveOrder = saveOrder;
window.prefillOrderForm = prefillOrderForm;
window.addItemRow = addItemRow;
window.calculateTotal = calculateTotal;
