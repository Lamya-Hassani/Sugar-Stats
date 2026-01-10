document.addEventListener('DOMContentLoaded', () => {
    const cartCountElement = document.getElementById('cart-count');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];



    // Event delegation for "Add to Cart" buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart');
        if (btn) {
            const productCard = btn.closest('.product-card');
            const product = {
                id: productCard.dataset.id,
                name: productCard.dataset.name,
                price: parseFloat(productCard.dataset.price),
                image: productCard.dataset.image,
                quantity: 1
            };

            addToCart(product);
        }
    });

    function addToCart(product) {
        const existingItem = cart.find(item => item.id == product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(product);
        }

        saveCart();
        updateCartCount();
        showNotification(`${product.name} ajouté au panier !`);
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    }

    window.renderCart = function () {
        const emptyCart = document.getElementById('emptyCart');
        const cartWithItems = document.getElementById('cartWithItems');
        const cartItemsList = document.getElementById('cartItemsList');

        if (!cartItemsList) return;

        if (cart.length === 0) {
            emptyCart.style.display = 'block';
            cartWithItems.style.display = 'none';
        } else {
            emptyCart.style.display = 'none';
            cartWithItems.style.display = 'grid';

            let html = '';
            cart.forEach(item => {
                html += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div style="flex: 1;">
                        <h3 style="margin: 0; font-family: 'Playfair Display', serif;">${item.name}</h3>
                        <p style="color: var(--c-accent); font-weight: 700;">${Number(item.price).toFixed(2)} DH</p>
                    </div>
                    <div class="cart-row-actions" style="display: flex; align-items: center; gap: 1rem;">
                        <div style="display: flex; align-items: center; border: 1px solid #eee; border-radius: 12px; padding: 0.3rem;">
                            <button onclick="updateQuantity(${item.id}, -1)" style="background: none; border: none; padding: 0.5rem; cursor: pointer;"><i class="fas fa-minus"></i></button>
                            <span style="padding: 0 1rem; font-weight: 600;">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" style="background: none; border: none; padding: 0.5rem; cursor: pointer;"><i class="fas fa-plus"></i></button>
                        </div>
                        <button onclick="removeItem(${item.id})" style="background: none; border: none; color: #ff5252; cursor: pointer; font-size: 1.2rem; margin-top: 5px;">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                `;
            });
            cartItemsList.innerHTML = html;
            updateSummary();
        }
    };

    window.updateQuantity = function (productId, delta) {
        const item = cart.find(i => i.id == productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeItem(productId);
            } else {
                saveCart();
                renderCart();
                updateCartCount();
            }
        }
    };

    window.removeItem = function (productId) {
        cart = cart.filter(i => i.id != productId);
        saveCart();
        renderCart();
        updateCartCount();
    };

    window.clearCart = function () {
        cart = [];
        saveCart();
        renderCart();
        updateCartCount();
    };

    function updateSummary() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = 20;
        const total = subtotal + delivery;

        if (document.getElementById('summarySubtotal')) document.getElementById('summarySubtotal').textContent = `${subtotal.toFixed(2)} DH`;
        if (document.getElementById('summaryTotal')) document.getElementById('summaryTotal').textContent = `${total.toFixed(2)} DH`;
    }

    window.proceedToCheckout = function () {
        const user = localStorage.getItem('authToken');
        if (!user) {
            window.location.href = 'pages/auth.html?redirect=payment.html';
        } else {
            window.location.href = 'payment.html';
        }
    };

    // --- INIT LOGIC AT THE END ---
    updateCartCount();

    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }

    if (window.updateAuthUI) window.updateAuthUI();

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
});

