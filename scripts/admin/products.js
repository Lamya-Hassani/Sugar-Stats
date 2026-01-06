const API_BASE_URL = "http://localhost:3000";
let allProducts = [];
let allCategories = [];

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
  if (!confirm("Are you sure you want to delete this scientific masterpiece?")) return;

  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert("Product deleted.");
      location.reload();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete product.");
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
    categoryId: parseInt(document.getElementById('categoryId').value),
    image: document.getElementById('image').value || "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=2670&auto=format&fit=crop"
  };

  const token = localStorage.getItem("authToken");
  const url = isEdit ? `${API_BASE_URL}/api/products/${id}` : `${API_BASE_URL}/api/products`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });

    if (res.ok) {
      alert(isEdit ? "Product updated!" : "Product added!");
      window.location.href = 'list.html';
    } else {
      const data = await res.json();
      alert(data.error || "Save failed.");
    }
  } catch (err) {
    console.error("Error saving product:", err);
  }
}

// ==================== UI RENDERING ====================

function getCategoryName(id) {
  const cat = allCategories.find(c => c.id_categorie === id);
  return cat ? cat.libelle : "Unknown";
}

async function loadProductsList() {
  await fetchCategories();
  await fetchProducts();

  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = allProducts.map(p => `
        <div class="product-card">
            <div class="product-badge">${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</div>
            <img src="${p.image}" class="product-img" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
            <div class="product-content">
                <div class="product-cat">${getCategoryName(p.categoryId)}</div>
                <h3 class="product-name">${p.name}</h3>
                <div class="product-price">$${p.price.toFixed(2)}</div>
                <div class="product-actions">
                    <a href="edit.html?id=${p.id}" class="action-btn edit"><i class="fas fa-edit"></i> Edit</a>
                    <button onclick="deleteProduct(${p.id})" class="action-btn delete"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function populateCategoryDropdown() {
  await fetchCategories();
  const select = document.getElementById('categoryId');
  if (!select) return;

  select.innerHTML = '<option value="">Select a category</option>' +
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
    document.getElementById('categoryId').value = product.categoryId;
    document.getElementById('image').value = product.image;
  }
}

// Export for use in HTML
window.deleteProduct = deleteProduct;
window.loadProductsList = loadProductsList;
window.populateCategoryDropdown = populateCategoryDropdown;
window.prefillEditForm = prefillEditForm;
window.saveProduct = saveProduct;
