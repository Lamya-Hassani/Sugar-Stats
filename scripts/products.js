if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = "http://localhost:3000";
}
let products = [];
let categories = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    await fetchCategories();
    await fetchProducts();
    renderCategories(); // New: dynamic categories
    setupSearch();
    renderProducts();
}

async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        categories = await res.json();
    } catch (err) {
        console.error("Error fetching categories:", err);
    }
}

async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        products = await res.json();
    } catch (err) {
        console.error("Error fetching products:", err);
    }
}

function renderCategories() {
    const container = document.getElementById('categoryContainer');
    if (!container) return;

    let html = `<button class="filter-btn active" data-category="all">Tout</button>`;

    categories.forEach(cat => {
        html += `<button class="filter-btn" data-category="${cat.id_categorie}">${cat.libelle}</button>`;
    });

    container.innerHTML = html;
    setupFilters(); // Re-attach listeners to new buttons
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentCategory = btn.dataset.category;
            renderProducts();
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderProducts(e.target.value.toLowerCase());
        });
    }
}

function renderProducts(filterQuery = '') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let filtered = products;

    // Filter by Category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.id_categorie == currentCategory);
    }

    // Filter by Search
    if (filterQuery) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(filterQuery) ||
            p.description.toLowerCase().includes(filterQuery)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; opacity: 0.5;">
            <i class="fa-solid fa-cookie-bite" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>Aucune création ne correspond à votre recherche.</p>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        // Fix malformed URLs (e.g., missing colon like https//)
        let imgSrc = p.image || "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=1000&auto=format&fit=crop";
        if (imgSrc.startsWith('https//')) {
            imgSrc = imgSrc.replace('https//', 'https://');
        } else if (imgSrc.startsWith('http//')) {
            imgSrc = imgSrc.replace('http//', 'http://');
        }

        return `
        <div class="product-card" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${imgSrc}">
            <img src="${imgSrc}" 
                 alt="${p.name}" 
                 class="product-img"
                 onerror="this.src='https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=1000&auto=format&fit=crop'">
            <div class="product-info">
                <span style="font-size: 0.75rem; color: var(--c-accent); font-weight: 700; text-transform: uppercase;">${getCategoryName(p.id_categorie)}</span>
                <h3 style="margin: 0.5rem 0; font-family: 'Playfair Display', serif;">${p.name}</h3>
                <p style="font-size: 0.9rem; color: #8a6a64; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7rem;">
                    ${p.description || "Une création artisanale d'exception..."}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price">${p.price.toFixed(2)} DH</span>
                    <button class="btn btn-primary add-to-cart" style="padding: 0.6rem 1.2rem; border-radius: 12px; font-size: 0.8rem;">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function getCategoryName(id) {
    const cat = categories.find(c => c.id_categorie == id);
    return cat ? cat.libelle : "Spécialité";
}
