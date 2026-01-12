if (typeof API_BASE_URL === 'undefined') {
  var API_BASE_URL = "http://localhost:3000";
}

let currentUserOrders = [];
let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('authUser')) || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('authToken');

  if (!token || !user) {
    window.location.href = 'pages/auth.html';
    return;
  }

  await fetchAllProducts();
  renderProfile(user);
  fetchOrderHistory(user.id, token);
});

async function fetchAllProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    allProducts = await res.json();
  } catch (err) {
    console.error("Error fetching products:", err);
  }
}

function renderProfile(user) {
  const displayName = user.name || user.username;

  if (document.getElementById('userName')) document.getElementById('userName').textContent = displayName;
  if (document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').textContent = displayName;
  if (document.getElementById('userInitial')) document.getElementById('userInitial').textContent = displayName.charAt(0).toUpperCase();
  if (document.getElementById('userUsername')) document.getElementById('userUsername').textContent = `@${user.username}`;
  if (document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email || 'Non renseigné';
  if (document.getElementById('userPhone')) document.getElementById('userPhone').textContent = user.phone || 'Non renseigné';
  if (document.getElementById('userAddress')) document.getElementById('userAddress').textContent = user.address || 'Non renseignée';

  if (document.getElementById('userDate')) {
    const regDate = user.registrationDate ? new Date(user.registrationDate) : new Date();
    document.getElementById('userDate').textContent = regDate.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  // Populate edit form
  if (document.getElementById('editName')) document.getElementById('editName').value = displayName;
  if (document.getElementById('editEmail')) document.getElementById('editEmail').value = user.email || '';
  if (document.getElementById('editPhone')) document.getElementById('editPhone').value = user.phone || '';
  if (document.getElementById('editAddress')) document.getElementById('editAddress').value = user.address || '';
  if (document.getElementById('editPassword')) document.getElementById('editPassword').value = '';

  // Mock stats for demo (
  if (document.getElementById('sessionsCount')) document.getElementById('sessionsCount').textContent = Math.floor(Math.random() * 20) + 5;
  if (document.getElementById('favCount')) document.getElementById('favCount').textContent = Math.floor(Math.random() * 10) + 2;
}

function toggleEdit(editing) {
  document.getElementById('infoDisplay').style.display = editing ? 'none' : 'block';
  document.getElementById('infoEdit').style.display = editing ? 'block' : 'none';
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('authUser')) || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('authToken');

  const updatedData = {
    name: document.getElementById('editName').value,
    email: document.getElementById('editEmail').value,
    phone: document.getElementById('editPhone').value,
    address: document.getElementById('editAddress').value
  };

  const pwdInput = document.getElementById('editPassword');
  if (pwdInput && pwdInput.value.trim().length > 0) {
    updatedData.password = pwdInput.value.trim();
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/clients/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    });

    if (!res.ok) throw new Error('Failed to update profile');

    const updatedUser = await res.json();

    if (localStorage.getItem('authUser')) {
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    renderProfile(updatedUser);
    toggleEdit(false);
    showToast('Profil mis à jour avec succès !', 'success');

  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function fetchOrderHistory(clientId, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Could not fetch orders');

    const orders = await res.json();
    currentUserOrders = orders;
    renderOrders(orders);

  } catch (err) {
    console.error(err);
    const list = document.getElementById('orderList');
    if (list) list.innerHTML = '<p style="text-align:center; color:#ff5252">Erreur lors du chargement des commandes.</p>';
  }
}

function renderOrders(orders) {
  const list = document.getElementById('orderList');
  if (!list) return;

  if (orders.length === 0) {
    list.innerHTML = '<div style="text-align:center; opacity:0.5; padding:1.5rem 0;">Vous n\'avez pas encore passé de commande.</div>';
    if (document.getElementById('experimentsCount')) document.getElementById('experimentsCount').textContent = '0';
    if (document.getElementById('ordersCount')) document.getElementById('ordersCount').textContent = '0';
    updateLoyalty(0);
    return;
  }

  let totalSpent = 0;
  let html = '';

  orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  orders.forEach(order => {
    totalSpent += Number(order.totalAmount);
    const date = new Date(order.orderDate).toLocaleDateString('fr-FR');
    const statusClass = order.status === 'Payé' ? 'status-paye' : 'status-attente';

    // Resolve product names
    const itemsList = order.items.map(i => {
      let name = i.name;
      if (!name && i.productId) {
        const p = allProducts.find(prod => prod.id === Number(i.productId));
        name = p ? p.name : 'Produit inconnu';
      }
      return `${i.quantity}x ${name || 'Article'}`;
    }).join(', ');

    html += `
      <div class="order-row">
        <div class="order-label">
          #${order.id.toString().slice(-6)}
          <div style="font-size:0.7rem; font-weight:400; opacity:0.6;">${date}</div>
        </div>
        <div style="opacity:0.8; font-size:0.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${itemsList}">
          ${itemsList}
        </div>
        <div style="font-weight:700; color:var(--c-text);">${Number(order.totalAmount).toFixed(2)} DH</div>
        <div style="text-align:right;">
          <span class="status-badge ${statusClass}">
            <i class="fa-solid ${order.status === 'Payé' ? 'fa-check' : 'fa-clock'}"></i>
            ${order.status}
          </span>
        </div>
      </div>
    `;
  });

  list.innerHTML = html;

  if (document.getElementById('experimentsCount')) document.getElementById('experimentsCount').textContent = orders.length;
  if (document.getElementById('ordersCount')) document.getElementById('ordersCount').textContent = orders.length;
  if (document.getElementById('lastOrderText')) {
    const lastDate = new Date(orders[0].orderDate).toLocaleDateString('fr-FR');
    document.getElementById('lastOrderText').textContent = `Dernière commande : ${lastDate}`;
  }

  updateLoyalty(totalSpent);
}

function updateLoyalty(totalSpent) {
  const progressFill = document.getElementById('loyaltyProgress');
  const loyaltyLevel = document.getElementById('loyaltyLevel');
  if (!progressFill || !loyaltyLevel) return;

  const goal = 500;
  const progress = Math.min((totalSpent / goal) * 100, 100);

  progressFill.style.width = `${progress}%`;

  let level = "Explorateur de saveurs";
  if (progress >= 100) level = "Maître Alchimiste";
  else if (progress >= 60) level = "Chercheur Confirmé";
  else if (progress >= 30) level = "Apprenti Gourmet";

  loyaltyLevel.textContent = `Niveau actuel : ${level} • ${Math.round(progress)} % vers une expérimentation offerte`;
}

// ==================== CSV EXPORT HELPER ====================
function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]); // Get the headers from the first row
  const csvContent = [
    headers.join(','), // Join the headers with commas
    ...data.map(row => headers.map(header => {
      let val = row[header] === null || row[header] === undefined ? '' : row[header];
      // Escape quotes and commas
      val = val.toString().replace(/"/g, '""');
      if (val.search(/("|,|\n)/g) >= 0) val = '"' + val + '"'; //search for quotes, commas, and new lines
      return val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); // Create a Blob object with the CSV content
  const link = document.createElement("a"); // Create a link element
  if (link.download !== undefined) { 
    const url = URL.createObjectURL(blob); // Create a Blob URL
    link.setAttribute("href", url); // Set the link's href attribute to the Blob URL
    link.setAttribute("download", filename); // Set the link's download attribute to the filename
    link.style.visibility = 'hidden'; // Hide the link element
    document.body.appendChild(link); // Append the link element to the document
    link.click(); // Trigger the download
    document.body.removeChild(link); // Remove the link element from the document
  }
}

window.exportHistory = function () {
  if (currentUserOrders.length === 0) {
    showToast("Aucun échantillon de données à exporter.", "error");
    return;
  }

  try {
    // Transform order data for CSV
    const csvData = currentUserOrders.map(order => {
      // Parse items safely with name resolution
      let itemsList = '';
      if (Array.isArray(order.items)) {
        // the role of map is to transform the array of items into a string
        itemsList = order.items.map(i => {
          let name = i.name;
          if (!name && i.productId) {
            const p = allProducts.find(prod => prod.id === Number(i.productId));
            name = p ? p.name : 'Produit inconnu';
          }
          return `${i.quantity}x ${name || 'Article'}`;
        }).join('; ');
      }

      return {
        'ID Commande': `#${order.id.toString().slice(-6)}`, 
        'Date': new Date(order.orderDate).toLocaleDateString('fr-FR'),
        'Articles': itemsList,
        'Montant Total (DH)': Number(order.totalAmount).toFixed(2),
        'Statut': order.status
      };
    });

    exportToCSV(csvData, `Historique_Commandes_SugarStats_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast("Export CSV réussi !", "success");

  } catch (error) {
    console.error("Export error:", error);
    showToast("Erreur lors de l'export CSV.", "error");
  }
};

window.generateGlobalInvoice = function () {
  if (currentUserOrders.length === 0) {
    showToast("Aucune transaction enregistrée.", "error");
    return;
  }

  const total = currentUserOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const date = new Date().toLocaleDateString('fr-FR');

  showConfirm({
    title: 'Facture Globale Labo',
    text: `Résumé de vos contributions :\n- Date: ${date}\n- Expériences: ${currentUserOrders.length}\n- Investissement Total: ${total.toFixed(2)} DH`,
    icon: 'fa-file-invoice-dollar',
    confirmText: 'Vu',
    cancelText: 'Fermer'
  });
};

// ==================== ELEGANT UI HELPERS ====================

window.showToast = function (message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `custom-alert ${type}`;
  const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('active'), 10);

  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

let currentConfirmCallback = null;

window.showConfirm = function (options = {}) {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;

  document.getElementById('modalTitle').textContent = options.title || 'Attention';
  document.getElementById('modalText').innerText = options.text || 'Voulez-vous continuer ?';
  const iconEl = document.getElementById('modalIcon');
  iconEl.className = `fas ${options.icon || 'fa-exclamation-triangle'}`;

  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.textContent = options.confirmText || 'Confirmer';

  currentConfirmCallback = options.onConfirm || null;
  overlay.classList.add('active');
};

window.closeConfirm = function (confirmed) {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;

  overlay.classList.remove('active');
  if (confirmed && currentConfirmCallback) {
    currentConfirmCallback();
  }
  currentConfirmCallback = null;
};
