const API_BASE_URL = "http://localhost:3000";
let allClients = [];

// Table State
let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'name';
let sortDesc = false;
let searchQuery = '';

// ==================== API CALLS ====================

async function fetchClients() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/clients`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
    });
    allClients = await res.json();
    return allClients;
  } catch (err) {
    console.error("Error fetching clients:", err);
  }
}

async function deleteClient(id) {
  const confirmed = await window.showConfirmModal({
    title: 'Extraction du Sujet',
    text: 'Voulez-vous vraiment retirer ce gourmet de nos registres ? Ses données seront définitivement perdues.',
    confirmText: 'Retirer',
    icon: 'fa-user-minus'
  });

  if (!confirmed) return;

  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      window.showToast("Sujet extrait avec succès.", "success");
      await fetchClients(); // Force data refresh
      renderClientsTable();
    } else {
      const data = await res.json();
      window.showToast(data.error || "Échec de l'extraction.", "error");
    }
  } catch (err) {
    console.error("Error deleting client:", err);
  }
}

async function saveClient(event) {
  event.preventDefault();
  const id = document.getElementById('clientId')?.value;
  const isEdit = !!id;

  const clientData = {
    username: document.getElementById('username')?.value,
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value
  };

  // Add password only if field exists and is not empty
  const passField = document.getElementById('password');
  if (passField && passField.value) {
    clientData.password = passField.value;
  }

  const token = localStorage.getItem("authToken");

  try {
    const res = await fetch(isEdit ? `${API_BASE_URL}/api/clients/${id}` : `${API_BASE_URL}/api/clients`, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(clientData)
    });

    if (res.ok) {
      window.showToast(isEdit ? "Profil gourmet mis à jour !" : "Nouveau sujet enregistré !", "success");
      setTimeout(() => window.location.href = 'list.html', 1500);
    } else {
      const data = await res.json();
      window.showToast(data.error || "Erreur d'enregistrement.", "error");
    }
  } catch (err) {
    console.error("Error saving client:", err);
  }
}

// ==================== UI RENDERING (TABLE) ====================

async function renderClientsTable() {
  if (allClients.length === 0) await fetchClients();

  // 1. Filter
  let filtered = allClients.filter(c => {
    // STRICT FILTER: Only show clients
    if (c.role !== 'client') return false;

    const name = (c.name || c.username || "").toLowerCase();
    const email = (c.email || "").toLowerCase();
    const address = (c.address || "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      address.includes(searchQuery.toLowerCase());
  });

  // 2. Sort
  filtered = window.sortData(filtered, sortKey, sortDesc);

  // 3. Paginate
  const { items, total, pages } = window.paginateData(filtered, currentPage, itemsPerPage);

  const tbody = document.getElementById('clientsTableBody');
  if (!tbody) return;

  tbody.innerHTML = items.map(c => `
    <tr ondblclick="showDetails(${c.id})" style="cursor:pointer;" title="Double-cliquez pour les détails">
        <td>
            <div class="client-avatar">${(c.name || c.username || "?").charAt(0).toUpperCase()}</div>
            <strong>${c.name || c.username}</strong>
        </td>
        <td><span style="color:var(--c-text-light); font-size:0.85rem;">${c.email || "Non renseigné"}</span></td>
        <td><span style="font-size:0.85rem;">${new Date(c.registrationDate || Date.now()).toLocaleDateString('fr-FR')}</span></td>
        <td><span style="font-size:0.85rem; color:var(--c-text-light);">${c.address || "Aucune adresse"}</span></td>
        <td>
            <div class="actions-cell">
                <a href="edit.html?id=${c.id}" class="icon-btn btn-edit" title="Modifier"><i class="fas fa-user-edit"></i></a>
                <button onclick="event.stopPropagation(); deleteClient(${c.id})" class="icon-btn btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>
  `).join('');

  renderPagination(pages);
}

// ... (existing navigation/export functions) ...

async function showDetails(id) {
  await fetchClients();
  const client = allClients.find(c => c.id == id);
  if (!client) return;

  const leftHTML = `
    <div class="modal-avatar">${(client.name || client.username || "?").charAt(0).toUpperCase()}</div>
    <div class="modal-info">
        <h3 class="modal-title-main">${client.name || client.username}</h3>
        <p class="modal-subtitle-main">${client.address || "Laboratoire Global"}</p>
        <div style="text-align:center; margin-top:0.5rem;">
            <span class="status-pill ${client.role === 'admin' ? 'livre' : 'expedie'}" style="font-size:0.7rem; padding:0.2rem 0.6rem;">
                ${client.role === 'admin' ? "Collaborateur Admin" : "Sujet Gourmet"}
            </span>
        </div>
    </div>
  `;

  const rightHTML = `
        <div class="modal-row">
            <span class="modal-label">Identifiant Unique</span>
            <span class="modal-value">#${client.id}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Nom de Code</span>
            <span class="modal-value">${client.username}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Canal Email</span>
            <span class="modal-value">${client.email || 'N/A'}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Liaison Téléphonique</span>
            <span class="modal-value">${client.phone || 'N/A'}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Zone de Déploiement</span>
            <span class="modal-value">${client.address || 'N/A'}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Date d'Enregistrement</span>
            <span class="modal-value">${new Date(client.registrationDate || Date.now()).toLocaleDateString('fr-FR')}</span>
        </div>
  `;

  const actionsHTML = `
    <a href="edit.html?id=${client.id}" class="modal-btn modal-btn-rose">
        <i class="fas fa-user-edit"></i> Modifier Profil
    </a>
    <button onclick="window.exportToPDF()" class="modal-btn modal-btn-primary">
        <i class="fas fa-file-pdf"></i> Exporter PDF
    </button>
  `;

  window.showDetailsModal({
    title: 'Fiche Analytique Gourmet',
    icon: 'fa-user-circle',
    leftContent: leftHTML,
    rightContentHTML: rightHTML,
    actionsHTML: actionsHTML
  });
}

window.exportToPDF = function () {
  // 1. Capture content from the currently open modal
  const openModal = document.querySelector('.custom-modal-overlay.active .custom-modal') || document.querySelector('.details-modal-overlay.active .details-modal');
  if (!openModal) {
    window.showToast("Ouvrez d'abord une fiche client.", "info");
    return;
  }

  const name = openModal.querySelector('.modal-title-main')?.innerText || "Client";
  const rows = openModal.querySelectorAll('.modal-row');

  // 2. Setup PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(216, 27, 96); // Rose
  doc.text('Sugar & Stats - Profil Client', 20, 20);

  doc.setFontSize(16);
  doc.setTextColor(78, 52, 46); // Brown
  doc.text(name, 20, 35);

  // 3. Loop rows
  let y = 50;
  rows.forEach(row => {
    const label = row.querySelector('.modal-label')?.innerText || "";
    const value = row.querySelector('.modal-value')?.innerText || "";

    doc.setFontSize(10);
    doc.setTextColor(141, 110, 99);
    doc.text(label, 20, y);

    doc.setFontSize(12);
    doc.setTextColor(78, 52, 46);
    doc.text(value, 20, y + 6);

    y += 15;
  });

  doc.save(`SugarStats_Client_${name.replace(/\s+/g, '_')}.pdf`);
};

window.exportClientsCSV = function () {
  const dataToExport = allClients.map(c => ({
    ID: c.id,
    Nom: c.name || c.username,
    Email: c.email || 'N/A',
    Phone: c.phone || 'N/A',
    Address: c.address || 'N/A',
    Role: c.role,
    "Date Inscription": new Date(c.registrationDate).toLocaleDateString()
  }));
  window.exportToCSV(dataToExport, 'SugarStats_Clients.csv');
};

window.goToPage = function (page) {
  currentPage = page;
  renderClientsTable();
};

window.handleSearch = function () {
  searchQuery = document.getElementById('searchInput').value;
  currentPage = 1;
  renderClientsTable();
};

window.handleSort = function (key) {
  if (sortKey === key) sortDesc = !sortDesc;
  else { sortKey = key; sortDesc = false; }
  renderClientsTable();
};

async function prefillClientForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return;

  await fetchClients();
  const client = allClients.find(c => c.id == id);
  if (client) {
    document.getElementById('clientId').value = client.id;
    document.getElementById('name').value = client.name || client.username;
    document.getElementById('email').value = client.email || "";
    document.getElementById('phone').value = client.phone || "";
    document.getElementById('address').value = client.address || "";
  }
}

window.deleteClient = deleteClient;
window.renderClientsTable = renderClientsTable;
window.prefillClientForm = prefillClientForm;
window.saveClient = saveClient;
window.showDetails = showDetails;
window.exportToPDF = exportToPDF;
window.exportClientsCSV = exportClientsCSV;
