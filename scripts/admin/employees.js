const API_BASE_URL = "http://localhost:3000";
let allEmployees = [];

let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'name';
let sortDesc = false;
let searchQuery = '';

async function fetchEmployees() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/employees`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
        });
        allEmployees = await res.json();
        return allEmployees;
    } catch (err) {
        console.error("Error fetching employees:", err);
    }
}

async function deleteEmployee(id) {
    const confirmed = await window.showConfirmModal({
        title: 'Fin de Mission',
        text: 'Voulez-vous vraiment clore le dossier de ce collaborateur ?',
        confirmText: 'Clore Dossier',
        icon: 'fa-user-times'
    });

    if (!confirmed) return;

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            window.showToast("Contrat terminé.", "success");
            await fetchEmployees();
            renderEmployeesTable();
        } else {
            window.showToast("Erreur RH.", "error");
        }
    } catch (err) {
        console.error("Error deleting employee:", err);
    }
}

// ... existing functions ...

window.exportEmployeesCSV = function () {
    const dataToExport = allEmployees.map(e => ({
        ID: e.id,
        Nom: e.name,
        Poste: e.position,
        Salaire: e.salary,
        Embauche: new Date(e.hireDate).toLocaleDateString(),
        Email: e.email,
        Tel: e.phone
    }));
    window.exportToCSV(dataToExport, 'SugarStats_Employees.csv');
};


async function saveEmployee(event) {
    event.preventDefault();
    const id = document.getElementById('employeeId')?.value;
    const isEdit = !!id;

    const employeeData = {
        name: document.getElementById('name').value,
        position: document.getElementById('position').value,
        salary: parseFloat(document.getElementById('salary').value),
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        hireDate: document.getElementById('hireDate').value
    };

    const token = localStorage.getItem("authToken");

    try {
        const res = await fetch(isEdit ? `${API_BASE_URL}/api/employees/${id}` : `${API_BASE_URL}/api/employees`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(employeeData)
        });

        if (res.ok) {
            window.showToast(isEdit ? "Dossier RH mis à jour !" : "Nouveau collaborateur recruté !", "success");
            setTimeout(() => window.location.href = 'list.html', 1500);
        } else {
            window.showToast("Échec RH.", "error");
        }
    } catch (err) {
        console.error("Error saving employee:", err);
    }
}

async function renderEmployeesTable() {
    if (allEmployees.length === 0) await fetchEmployees();

    let filtered = allEmployees.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.position.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered = window.sortData(filtered, sortKey, sortDesc);
    const { items, pages } = window.paginateData(filtered, currentPage, itemsPerPage);

    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(e => `
    <tr ondblclick="showDetails(${e.id})" style="cursor:pointer;" title="Double-cliquez pour les détails">
        <td>
            <div class="client-avatar">${e.name.charAt(0).toUpperCase()}</div>
            <strong>${e.name}</strong>
        </td>
        <td><span style="color:var(--c-text-light);">${e.position}</span></td>
        <td>$${e.salary.toLocaleString()}</td>
        <td>${new Date(e.hireDate).toLocaleDateString('fr-FR')}</td>
        <td>
            <div class="actions-cell">
                <a href="edit.html?id=${e.id}" class="icon-btn btn-edit" title="Modifier"><i class="fas fa-edit"></i></a>
                <button onclick="event.stopPropagation(); deleteEmployee(${e.id})" class="icon-btn btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>
  `).join('');

    renderPagination(pages);
}

async function showDetails(id) {
    await fetchEmployees();
    const emp = allEmployees.find(e => e.id == id);
    if (!emp) return;

    const leftHTML = `
        <div class="modal-avatar" style="border-color:var(--c-rose);">${emp.name.charAt(0).toUpperCase()}</div>
        <div class="modal-info">
            <h3 class="modal-title-main">${emp.name}</h3>
            <p class="modal-subtitle-main">${emp.position}</p>
        </div>
    `;

    const rightHTML = `
        <div class="modal-row">
            <span class="modal-label">Référence Collaborateur</span>
            <span class="modal-value">#EMP-${emp.id}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Affectation</span>
            <span class="modal-value">${emp.position}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Rémunération Annuelle</span>
            <span class="modal-value">$${emp.salary.toLocaleString()}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Canal de Liaison</span>
            <span class="modal-value">${emp.email}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Ligne Directe</span>
            <span class="modal-value">${emp.phone}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Date d'Intégration</span>
            <span class="modal-value">${new Date(emp.hireDate).toLocaleDateString('fr-FR')}</span>
        </div>
    `;

    const actionsHTML = `
        <a href="edit.html?id=${emp.id}" class="modal-btn modal-btn-rose">
            <i class="fas fa-edit"></i> Modifier Dossier
        </a>
        <button onclick="window.exportToPDF()" class="modal-btn modal-btn-primary">
            <i class="fas fa-file-pdf"></i> Exporter PDF
        </button>
    `;

    window.showDetailsModal({
        title: 'Dossier Professionnel',
        icon: 'fa-user-tie',
        leftContent: leftHTML,
        rightContentHTML: rightHTML,
        actionsHTML: actionsHTML
    });
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const openModal = document.querySelector('.custom-modal-overlay.active .custom-modal') || document.querySelector('.details-modal-overlay.active .details-modal');
    if (!openModal) {
        window.showToast("Ouvrez d'abord une fiche.", "info");
        return;
    }

    const name = openModal.querySelector('.modal-title-main')?.innerText || "Employe";
    const position = openModal.querySelector('.modal-subtitle-main')?.innerText || "";

    doc.setFontSize(22);
    doc.setTextColor(216, 27, 96);
    doc.text('Sugar & Stats - Fiche Collaborateur', 20, 20);

    doc.setFontSize(14);
    doc.setTextColor(78, 52, 46);
    doc.text(name, 20, 35);
    doc.text(position, 20, 42);

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
        doc.text(value, 20, y + 6);
        y += 16;
    });

    doc.save(`SugarStats_Employee_${name.replace(/\s+/g, '_')}.pdf`);
}

window.goToPage = function (page) {
    currentPage = page;
    renderEmployeesTable();
};

window.handleSearch = function () {
    searchQuery = document.getElementById('searchInput').value;
    currentPage = 1;
    renderEmployeesTable();
};

window.handleSort = function (key) {
    if (sortKey === key) sortDesc = !sortDesc;
    else { sortKey = key; sortDesc = false; }
    renderEmployeesTable();
};

async function prefillEmployeeForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    await fetchEmployees();
    const emp = allEmployees.find(e => e.id == id);
    if (emp) {
        document.getElementById('employeeId').value = emp.id;
        document.getElementById('name').value = emp.name;
        document.getElementById('position').value = emp.position;
        document.getElementById('salary').value = emp.salary;
        document.getElementById('email').value = emp.email;
        document.getElementById('phone').value = emp.phone;
        document.getElementById('hireDate').value = emp.hireDate.split('T')[0];
    }
}

window.deleteEmployee = deleteEmployee;
window.renderEmployeesTable = renderEmployeesTable;
window.saveEmployee = saveEmployee;
window.prefillEmployeeForm = prefillEmployeeForm;
window.showDetails = showDetails;
window.exportToPDF = exportToPDF;
