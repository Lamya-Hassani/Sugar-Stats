const API_BASE_URL = "http://localhost:3000";
let allCategories = [];

let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'libelle';
let sortDesc = false;
let searchQuery = '';

async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        allCategories = await res.json();
        return allCategories;
    } catch (err) {
        console.error("Error fetching categories:", err);
    }
}

async function deleteCategory(id) {
    const confirmed = await window.showConfirmModal({
        title: 'Suppression du Segment',
        text: 'Voulez-vous vraiment supprimer cette taxonomie ? Tous les produits associés resteront orphelins.',
        confirmText: 'Supprimer',
        icon: 'fa-tags'
    });

    if (!confirmed) return;

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            window.showToast("Segment supprimé.", "success");
            renderCategoriesTable();
        } else {
            const data = await res.json();
            window.showToast(data.error || "Échec de suppression.", "error");
        }
    } catch (err) {
        console.error("Error deleting category:", err);
    }
}

async function saveCategory(event) {
    event.preventDefault();
    const id = document.getElementById('categoryId')?.value;
    const isEdit = !!id;

    const categoryData = {
        libelle: document.getElementById('libelle').value,
        description: document.getElementById('description').value
    };

    const token = localStorage.getItem("authToken");

    try {
        const res = await fetch(isEdit ? `${API_BASE_URL}/api/categories/${id}` : `${API_BASE_URL}/api/categories`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(categoryData)
        });

        if (res.ok) {
            window.showToast(isEdit ? "Segment mis à jour !" : "Nouveau segment créé !", "success");
            setTimeout(() => window.location.href = 'list.html', 1500);
        } else {
            const data = await res.json();
            window.showToast(data.error || "Erreur segment.", "error");
        }
    } catch (err) {
        console.error("Error saving category:", err);
    }
}

async function renderCategoriesTable() {
    if (allCategories.length === 0) await fetchCategories();

    let filtered = allCategories.filter(c =>
        c.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered = window.sortData(filtered, sortKey, sortDesc);
    const { items, pages } = window.paginateData(filtered, currentPage, itemsPerPage);

    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(c => `
    <tr ondblclick="showDetails(${c.id_categorie})" style="cursor:pointer;" title="Double-cliquez pour les détails">
        <td><strong>#CAT-${c.id_categorie}</strong></td>
        <td><span style="font-weight:600; color:var(--c-text-main);">${c.libelle}</span></td>
        <td><p class="cat-desc-preview" title="${c.description}">${c.description.substring(0, 50)}...</p></td>
        <td>
            <div class="actions-cell">
                <a href="edit.html?id=${c.id_categorie}" class="icon-btn btn-edit" title="Modifier"><i class="fas fa-edit"></i></a>
                <button onclick="event.stopPropagation(); deleteCategory(${c.id_categorie})" class="icon-btn btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>
  `).join('');

    renderPagination(pages);
}

// ... (existing navigation/export) ...

async function showDetails(id) {
    await fetchCategories();
    const cat = allCategories.find(c => c.id_categorie == id);
    if (!cat) return;

    const leftHTML = `
        <div class="modal-avatar" style="border-color:var(--c-rose);">
            <i class="fas fa-tag"></i>
        </div>
        <div class="modal-info">
            <h3 class="modal-title-main">${cat.libelle}</h3>
            <p class="modal-subtitle-main">Segment Pâtissier</p>
        </div>
    `;

    const rightHTML = `
        <div class="modal-row">
            <span class="modal-label">Identifiant du Segment</span>
            <span class="modal-value">#CAT-${cat.id_categorie}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Libellé Officiel</span>
            <span class="modal-value">${cat.libelle}</span>
        </div>
        <div class="modal-row" style="grid-column: 1 / -1; border-top: 1px dashed rgba(141,110,99,0.1); margin-top:0.5rem; padding-top:0.5rem;">
            <span class="modal-label">Description Analytique</span>
            <span class="modal-value" style="font-family:'Playfair Display', serif; font-style:italic; line-height:1.5;">"${cat.description}"</span>
        </div>
    `;

    const actionsHTML = `
        <a href="edit.html?id=${cat.id_categorie}" class="modal-btn modal-btn-rose">
            <i class="fas fa-edit"></i> Modifier Segment
        </a>
        <button onclick="window.exportToPDF()" class="modal-btn modal-btn-primary">
            <i class="fas fa-file-pdf"></i> Exporter PDF
        </button>
    `;

    window.showDetailsModal({
        title: 'Fiche Taxonomique',
        icon: 'fa-tag',
        leftContent: leftHTML,
        rightContentHTML: rightHTML,
        actionsHTML: actionsHTML
    });
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const name = document.querySelector('h2').innerText;
    doc.setFontSize(22);
    doc.setTextColor(216, 27, 96);
    doc.text('Sugar & Stats - Segment Pâtissier', 20, 20);
    doc.setFontSize(16);
    doc.setTextColor(78, 52, 46);
    doc.text(name, 20, 35);
    doc.setFontSize(12);
    doc.text(document.querySelector('.description').innerText, 20, 50, { maxWidth: 170 });
    doc.save(`SugarStats_Category_${name.replace(/\s+/g, '_')}.pdf`);
}

window.goToPage = function (page) {
    currentPage = page;
    renderCategoriesTable();
};

async function prefillCategoryForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    await fetchCategories();
    const cat = allCategories.find(c => c.id_categorie == id);
    if (cat) {
        document.getElementById('categoryId').value = cat.id_categorie;
        document.getElementById('libelle').value = cat.libelle;
        document.getElementById('description').value = cat.description;
    }
}

window.prefillCategoryForm = prefillCategoryForm;
window.handleSearch = function () {
    searchQuery = document.getElementById('searchInput').value;
    currentPage = 1;
    renderCategoriesTable();
};

window.handleSort = function (key) {
    if (sortKey === key) sortDesc = !sortDesc;
    else { sortKey = key; sortDesc = false; }
    renderCategoriesTable();
};

window.deleteCategory = deleteCategory;
window.renderCategoriesTable = renderCategoriesTable;
window.saveCategory = saveCategory;
window.showDetails = showDetails;
window.exportToPDF = exportToPDF;
