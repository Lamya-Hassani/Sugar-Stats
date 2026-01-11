if (typeof API_BASE_URL === 'undefined') {
  var API_BASE_URL = "http://localhost:3000";
}

let currentUserOrders = [];

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('authUser')) || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('authToken');

  if (!token || !user) {
    window.location.href = 'pages/auth.html';
    return;
  }

  renderProfile(user);
  fetchOrderHistory(user.id, token);
});

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

  // Mock stats for demo (or calculate from history later)
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
    const itemsList = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

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

window.exportHistory = function () {
  if (currentUserOrders.length === 0) {
    showToast("Aucun échantillon de données à exporter.", "error");
    return;
  }

  try {
    // Transform order data into Excel-friendly format
    const excelData = currentUserOrders.map(order => {
      return {
        'ID Commande': `#${order.id.toString().slice(-6)}`,
        'Date': new Date(order.orderDate).toLocaleDateString('fr-FR'),
        'Articles': order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        'Montant Total (DH)': Number(order.totalAmount).toFixed(2),
        'Statut': order.status,
        'ID Client': order.clientId
      };
    });

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 15 },  // ID Commande
      { wch: 12 },  // Date
      { wch: 40 },  // Articles
      { wch: 18 },  // Montant Total
      { wch: 12 },  // Statut
      { wch: 12 }   // ID Client
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Historique des Commandes");

    // Generate Excel file with proper options to avoid protected mode warning
    XLSX.writeFile(wb, "rapport_labo_sugar_stats.xlsx", {
      bookType: 'xlsx',
      type: 'binary',
      compression: true
    });

    showToast("Export Excel réussi !", "success");
  } catch (error) {
    console.error("Export error:", error);
    showToast("Erreur lors de l'export Excel.", "error");
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
