const API_BASE_URL = "http://localhost:3000";
let allProducts = [];
let allCategories = [];

// Table State
let currentPage = 1;
const itemsPerPage = 8;
let sortKey = 'name';
let sortDesc = false;
let searchQuery = '';
let selectedCategory = '';

// ==================== API CALLS ====================

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    allCategories = await res.json();
    return allCategories;
  } catch (err) {
    console.error("Error fetching categories:", err);
  }
}

async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    allProducts = await res.json();
    return allProducts;
  } catch (err) {
    console.error("Error fetching products:", err);
  }
}

async function deleteProduct(id) {
  const confirmed = await window.showConfirmModal({
    title: 'Désintégration Moléculaire',
    text: 'Êtes-vous sûr de vouloir supprimer ce chef-d\'œuvre du laboratoire ? Cette action est irréversible.',
    confirmText: 'Supprimer',
    cancelText: 'Préserver',
    icon: 'fa-trash-alt'
  });

  if (!confirmed) return;

  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      window.showToast("Succès au laboratoire : Produit désintégré.", "success");
      renderProductsTable(); // Re-render table
    } else {
      const data = await res.json();
      window.showToast(data.error || "Échec de la désintégration.", "error");
    }
  } catch (err) {
    console.error("Error deleting product:", err);
  }
}

async function saveProduct(event) {
  event.preventDefault();
  const id = document.getElementById('productId')?.value;
  const isEdit = !!id;

  const productData = {
    name: document.getElementById('name').value,
    description: document.getElementById('description').value,
    price: parseFloat(document.getElementById('price').value),
    stock: parseInt(document.getElementById('stock').value),
    id_categorie: parseInt(document.getElementById('categoryId').value),
    image: document.getElementById('image').value || "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=2670&auto=format&fit=crop"
  };

  const token = localStorage.getItem("authToken");

  try {
    const res = await fetch(isEdit ? `${API_BASE_URL}/api/products/${id}` : `${API_BASE_URL}/api/products`, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(productData)
    });

    if (res.ok) {
      window.showToast(isEdit ? "Chef-d'œuvre mis à jour !" : "Nouveau chef-d'œuvre archivé !", "success");
      setTimeout(() => window.location.href = 'list.html', 1500);
    } else {
      const data = await res.json();
      window.showToast(data.error || "Échec de l'archivage.", "error");
    }
  } catch (err) {
    console.error("Error saving product:", err);
  }
}

// ==================== UI RENDERING (TABLE) ====================

function getCategoryName(id) {
  const cat = allCategories.find(c => c.id_categorie == id);
  return cat ? cat.libelle : "Inconnu";
}

async function renderProductsTable() {
  if (allProducts.length === 0) await fetchProducts();
  if (allCategories.length === 0) await fetchCategories();

  let filtered = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.id_categorie == selectedCategory;
    return matchesSearch && matchesCategory;
  });

  filtered = window.sortData(filtered, sortKey, sortDesc);
  const { items, pages } = window.paginateData(filtered, currentPage, itemsPerPage);

  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  tbody.innerHTML = items.map(p => `
    <tr ondblclick="showDetails(${p.id})" style="cursor:pointer;" title="Double-cliquez pour les détails">
        <td>
            <img src="${p.image}" class="product-thumb">
            <strong>${p.name}</strong>
        </td>
        <td><span style="color:var(--c-text-light);">${getCategoryName(p.id_categorie)}</span></td>
        <td><span style="font-weight:700; color:var(--c-rose);">$${p.price.toFixed(2)}</span></td>
        <td>
            <span class="status-pill ${p.stock > 10 ? 'status-instock' : (p.stock > 0 ? 'status-lowstock' : 'status-outofstock')}">
                <i class="fas ${p.stock > 10 ? 'fa-check' : (p.stock > 0 ? 'fa-exclamation' : 'fa-times')}"></i> ${p.stock} units
            </span>
        </td>
        <td>
            <div class="actions-cell">
                <a href="edit.html?id=${p.id}" class="icon-btn btn-edit" title="Modifier"><i class="fas fa-edit"></i></a>
                <button onclick="event.stopPropagation(); deleteProduct(${p.id})" class="icon-btn btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>
  `).join('');

  renderPagination(pages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  if (!container) return;

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<div class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`;
  }
  container.innerHTML = html;
}

// ==================== INTERACTION HANDLERS ====================

window.handleSearch = function () {
  searchQuery = document.getElementById('searchInput').value;
  selectedCategory = document.getElementById('categoryFilter').value;
  currentPage = 1;
  renderProductsTable();
};

window.handleSort = function (key) {
  if (sortKey === key) {
    sortDesc = !sortDesc;
  } else {
    sortKey = key;
    sortDesc = false;
  }
  renderProductsTable();
};

window.goToPage = function (page) {
  currentPage = page;
  renderProductsTable();
};

window.exportProductsCSV = function () {
  const dataToExport = allProducts.map(p => ({
    ID: p.id,
    Nom: p.name,
    Categorie: getCategoryName(p.id_categorie),
    Prix: p.price,
    Stock: p.stock,
    Description: p.description
  }));
  window.exportToCSV(dataToExport, 'SugarStats_Products_Inventory.csv');
};

// ==================== FORM LOGIC ====================

async function populateCategoryDropdown() {
  await fetchCategories();
  const select = document.getElementById('categoryId');
  if (!select) return;
  select.innerHTML = '<option value="">Choisir un segment</option>' +
    allCategories.map(c => `<option value="${c.id_categorie}">${c.libelle}</option>`).join('');
}

async function prefillEditForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return;

  await populateCategoryDropdown();
  await fetchProducts();
  const product = allProducts.find(p => p.id == id);

  if (product) {
    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description;
    document.getElementById('price').value = product.price;
    document.getElementById('stock').value = product.stock;
    document.getElementById('categoryId').value = product.id_categorie;
    document.getElementById('image').value = product.image;
  }
}

// ==================== DETAIL PAGE ====================

async function showDetails(id) {
  if (allCategories.length === 0) await fetchCategories();
  await fetchProducts();
  const product = allProducts.find(p => p.id == id);
  if (!product) return;

  const catName = getCategoryName(product.id_categorie);

  const leftHTML = `
    <img src="${product.image}" class="product-image" style="width:100%; border-radius:15px; box-shadow:0 10px 20px rgba(0,0,0,0.1); border:4px solid white;" alt="${product.name}">
    <div class="modal-info" style="margin-top:1rem;">
        <h3 class="modal-title-main" style="font-family:'Playfair Display', serif;">${product.name}</h3>
        <p class="modal-subtitle-main" style="color:var(--c-rose); font-weight:700; font-size:1.4rem; font-family:'Playfair Display', serif;">$${product.price.toFixed(2)}</p>
    </div>
  `;

  const rightHTML = `
        <div class="modal-row">
            <span class="modal-label">Référence Lab</span>
            <span class="modal-value">#${product.id}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Segment Pâtissier</span>
            <span class="modal-value">${catName}</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Réserve Stratégique</span>
            <span class="modal-value">${product.stock} unités en stock</span>
        </div>
        <div class="modal-row">
            <span class="modal-label">Date de Création</span>
            <span class="modal-value">${new Date().toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="modal-row" style="grid-column: 1 / -1; border:none; margin-top:0.5rem;">
            <span class="modal-label">Notes de Dégustation</span>
            <span class="modal-value" style="font-family:'Playfair Display', serif; font-style:italic; font-size:1.1rem; line-height:1.6; color:var(--c-text-light);">
                "Une expérimentation culinaire d'exception combinant des textures onctueuses et des saveurs audacieuses, typique de l'excellence Sugar & Stats."
            </span>
        </div>
  `;

  const actionsHTML = `
    <a href="edit.html?id=${product.id}" class="modal-btn modal-btn-rose">
        <i class="fas fa-edit"></i> Modifier Masterpiece
    </a>
    <button onclick="window.exportToPDF()" class="modal-btn modal-btn-primary">
        <i class="fas fa-file-pdf"></i> Exporter PDF
    </button>
  `;

  window.showDetailsModal({
    title: "Fiche d'Excellence",
    icon: 'fa-cookie-bite',
    leftContent: leftHTML,
    rightContentHTML: rightHTML,
    actionsHTML: actionsHTML
  });
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const name = document.querySelector('.detail-info h3').innerText;
  const rows = document.querySelectorAll('.detail-row');

  doc.setFontSize(22);
  doc.setTextColor(216, 27, 96);
  doc.text('Sugar & Stats - Dossier Produit', 20, 20);

  doc.setFontSize(16);
  doc.setTextColor(78, 52, 46);
  doc.text(name, 20, 35);

  let y = 50;
  rows.forEach(row => {
    const label = row.querySelector('.detail-label').innerText;
    const value = row.querySelector('.detail-value').innerText;
    doc.setFontSize(12);
    doc.setTextColor(141, 110, 99);
    doc.text(`${label}:`, 20, y);
    doc.setTextColor(78, 52, 46);
    doc.text(value.substring(0, 100), 60, y); // Simple wrap avoidance
    y += 10;
  });

  doc.save(`SugarStats_${name.replace(/\s+/g, '_')}.pdf`);
}

// Exports
window.deleteProduct = deleteProduct;
window.renderProductsTable = renderProductsTable;
window.populateCategoryDropdown = populateCategoryDropdown;
window.prefillEditForm = prefillEditForm;
window.saveProduct = saveProduct;
window.showDetails = showDetails;
window.exportToPDF = exportToPDF;
window.fetchCategories = fetchCategories;
