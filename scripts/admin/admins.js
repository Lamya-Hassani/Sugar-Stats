const API_BASE_URL = "http://localhost:3000";
let allAdmins = [];
let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'username';
let sortDesc = false;
let searchQuery = '';

// ==================== API CALLS ====================

async function fetchAdmins() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/clients`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
        });
        const allUsers = await res.json();
        // Strict Filter for Admins
        allAdmins = allUsers.filter(u => u.role === 'admin');
        return allAdmins;
    } catch (err) {
        console.error("Error fetching admins:", err);
    }
}

async function createAdmin(event) {
    event.preventDefault();

    const adminData = {
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: 'admin'
    };

    // Auto-inject secret for superadmins to bypass prompt
    const currentUser = JSON.parse(localStorage.getItem('authUser')) || {};
    if (currentUser.role === 'superadmin') {
        adminData.adminSecret = "bakeryAdmin2026";
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(adminData),
        });

        const data = await res.json();

        if (res.ok) {
            window.showToast("Administrateur créé avec succès !", "success");
            setTimeout(() => window.location.href = 'list.html', 1500);
        } else {
            window.showToast(data.error || "Erreur lors de la création.", "error");
        }
    } catch (err) {
        console.error(err);
        window.showToast("Erreur réseau.", "error");
    }
}

async function removeAdmin(id) {
    const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
    if (id == currentUserId) {
        window.showToast("Vous ne pouvez pas vous supprimer vous-même !", "error");
        return;
    }

    const confirmed = await window.showConfirmModal({
        title: 'Révoquer les droits ?',
        text: 'Cet administrateur perdra tous ses accès.',
        confirmText: 'Révoquer',
        icon: 'fa-user-shield'
    });

    if (!confirmed) return;

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, { // Using clients endpoint as it's the generic user endpoint
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            window.showToast("Accès révoqué.", "success");
            renderAdminsTable();
        } else {
            window.showToast("Erreur lors de la suppression.", "error");
        }
    } catch (err) {
        console.error(err);
        window.showToast("Erreur réseau.", "error");
    }
}

async function showAdminDetails(id) {
    const admin = allAdmins.find(a => a.id === id);
    if (!admin) return;

    window.showDetailsModal({
        title: "Détails Administrateur",
        icon: "fa-user-shield",
        leftContent: `
            <div class="modal-avatar">${admin.username.charAt(0).toUpperCase()}</div>
            <h3 class="modal-title-main">${admin.username}</h3>
            <p class="modal-subtitle-main">${admin.email}</p>
            <div style="margin-top:1rem;">
                <span class="status-pill status-completed"><i class="fas fa-check-circle"></i> Actif</span>
            </div>
        `,
        rightContentHTML: `
            <div class="modal-row">
                <span class="modal-label">ID</span>
                <span class="modal-value">#${admin.id}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Role</span>
                <span class="modal-value" style="text-transform:capitalize;">${admin.role}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Nom Complet</span>
                <span class="modal-value">${admin.name || 'Non renseigné'}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Date d'inscription</span>
                <span class="modal-value">${new Date(admin.registrationDate || Date.now()).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        `,
        actionsHTML: `
    <button class="modal-btn" onclick="editAdmin(${admin.id})" style="background:#F5F5F5; color:#333;">
                <i class="fas fa-edit"></i> Modifier
            </button>
            <button class="modal-btn modal-btn-rose" onclick="removeAdmin(${admin.id})">
                <i class="fas fa-trash"></i> Supprimer
            </button>
        `
    });
}

// ==================== UI RENDERING ====================

async function renderAdminsTable() {
    await fetchAdmins();

    let filtered = allAdmins.filter(a => {
        const term = searchQuery.toLowerCase();
        return (a.username || "").toLowerCase().includes(term) ||
            (a.email || "").toLowerCase().includes(term);
    });

    filtered = window.sortData(filtered, sortKey, sortDesc);
    const { items, pages } = window.paginateData(filtered, currentPage, itemsPerPage);

    const tbody = document.getElementById('adminsTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(a => `
    <tr ondblclick="showAdminDetails(${a.id})" style="cursor: pointer;">
        <td>
            <div style="display:flex; align-items:center; gap:10px;">
                <div class="client-avatar" style="background:var(--c-apricot);">${(a.username || "?").charAt(0).toUpperCase()}</div>
                <strong>${a.username}</strong>
            </div>
        </td>
        <td>${a.email || "Non renseigné"}</td>
        <td>${new Date(a.registrationDate || Date.now()).toLocaleDateString('fr-FR')}</td>
        <td>
            <div class="actions-cell">
                <button onclick="editAdmin(${a.id})" class="icon-btn btn-edit" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="removeAdmin(${a.id})" class="icon-btn btn-delete" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    </tr>
  `).join('');

    renderPagination(pages);
}

// ==================== EDIT LOGIC ====================

function editAdmin(id) {
    window.location.href = `edit.html?id=${id}`;
}

async function initEditAdmin() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        window.location.href = 'list.html';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
        });

        if (!res.ok) throw new Error("Admin introuvable");
        const admin = await res.json();

        document.getElementById('username').value = admin.username;
        document.getElementById('name').value = admin.name || '';
        document.getElementById('email').value = admin.email || '';
    } catch (err) {
        console.error(err);
        window.showToast("Erreur lors du chargement.", "error");
        setTimeout(() => window.location.href = 'list.html', 1500);
    }
}

async function updateAdmin(event) {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const updateData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
    };

    const password = document.getElementById('password').value;
    if (password) {
        updateData.password = password;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            },
            body: JSON.stringify(updateData),
        });

        if (res.ok) {
            window.showToast("Administrateur modifié avec succès !", "success");
            setTimeout(() => window.location.href = 'list.html', 1500);
        } else {
            const data = await res.json();
            window.showToast(data.error || "Erreur lors de la modification.", "error");
        }
    } catch (err) {
        console.error(err);
        window.showToast("Erreur réseau.", "error");
    }
}

// Helpers
window.handleSearch = function () {
    searchQuery = document.getElementById('searchInput').value;
    currentPage = 1;
    renderAdminsTable();
};

window.handleSort = function (key) {
    if (sortKey === key) sortDesc = !sortDesc;
    else { sortKey = key; sortDesc = false; }
    renderAdminsTable();
};

window.goToPage = function (page) {
    currentPage = page;
    renderAdminsTable();
};

window.createAdmin = createAdmin;
window.renderAdminsTable = renderAdminsTable;
window.removeAdmin = removeAdmin;
window.showAdminDetails = showAdminDetails;
window.editAdmin = editAdmin;
window.initEditAdmin = initEditAdmin;
window.updateAdmin = updateAdmin;
