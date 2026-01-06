const API_BASE_URL = "http://localhost:3000";
let allCategories = [];

// ==================== API CALLS ====================

async function fetchCategories() {
    const token = localStorage.getItem("authToken");
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch categories");
        allCategories = await res.json();
        return allCategories;
    } catch (err) {
        console.error("Error fetching categories:", err);
    }
}

async function deleteCategory(id) {
    if (!confirm("Attention : supprimer une catégorie peut affecter les produits liés. Continuer ?")) return;

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Catégorie supprimée.");
            location.reload();
        } else {
            const data = await res.json();
            alert(data.error || "Échec de la suppression.");
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
        description: document.getElementById('description').value,
    };

    const token = localStorage.getItem("authToken");
    const url = isEdit ? `${API_BASE_URL}/api/categories/${id}` : `${API_BASE_URL}/api/categories`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData)
        });

        if (res.ok) {
            alert(isEdit ? "Catégorie mise à jour !" : "Catégorie créée !");
            window.location.href = 'list.html';
        } else {
            const data = await res.json();
            alert(data.error || "Échec de l'enregistrement.");
        }
    } catch (err) {
        console.error("Error saving category:", err);
    }
}

// ==================== UI RENDERING ====================

async function loadCategoriesList() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column: 1/-1;">Synchronisation des taxonomies...</p>';

    await fetchCategories();

    if (!allCategories || allCategories.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1;">Aucune catégorie trouvée dans le laboratoire.</p>';
        return;
    }

    grid.innerHTML = allCategories.map(c => `
        <div class="category-card">
            <div class="category-icon"><i class="fas fa-tags"></i></div>
            <div class="category-content">
                <h3 class="category-name">${c.libelle}</h3>
                <p class="category-desc">${c.description || "Aucune description scientifique."}</p>
                <div class="category-actions">
                    <a href="edit.html?id=${c.id_categorie}" class="action-btn edit"><i class="fas fa-edit"></i> Modifier</a>
                    <button onclick="deleteCategory(${c.id_categorie})" class="action-btn delete"><i class="fas fa-trash"></i> Supprimer</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function prefillCategoryForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    await fetchCategories();
    const category = allCategories.find(c => c.id_categorie == id);

    if (category) {
        document.getElementById('categoryId').value = category.id_categorie;
        document.getElementById('libelle').value = category.libelle;
        document.getElementById('description').value = category.description || '';
    }
}

// Export functions
window.loadCategoriesList = loadCategoriesList;
window.deleteCategory = deleteCategory;
window.saveCategory = saveCategory;
window.prefillCategoryForm = prefillCategoryForm;
