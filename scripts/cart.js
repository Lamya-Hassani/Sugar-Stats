// ==================== CART MANAGEMENT SYSTEM ====================
// This script handles all cart operations using localStorage

const API_BASE_URL = "http://localhost:3000";

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('sugarStatsCart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('sugarStatsCart', JSON.stringify(cart));
    updateCartCount();
}

// Add item to cart
function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            description: product.description,
            quantity: quantity
        });
    }

    saveCart(cart);
    showNotification(`${product.name} added to cart!`);
}

// Remove item from cart
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    renderCart();
}

// Update item quantity
function updateQuantity(productId, newQuantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart(cart);
            renderCart();
        }
    }
}

// Clear entire cart
function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        localStorage.removeItem('sugarStatsCart');
        updateCartCount();
        renderCart();
        showNotification('Cart cleared!');
    }
}

// Get cart item count
function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Update cart count badge in navbar
function updateCartCount() {
    const count = getCartCount();
    const badges = document.querySelectorAll('#navCartCount, .cart-count');
    badges.forEach(badge => {
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    });
}

// Calculate cart totals
function calculateTotals() {
    const cart = getCart();
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10; // 10% tax
    const delivery = subtotal > 0 ? 5.00 : 0; // $5 delivery fee
    const total = subtotal + tax + delivery;

    return {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        delivery: delivery.toFixed(2),
        total: total.toFixed(2)
    };
}

// Render cart items on cart.html page
function renderCart() {
    const cart = getCart();
    const emptyCart = document.getElementById('emptyCart');
    const cartWithItems = document.getElementById('cartWithItems');
    const cartItemsList = document.getElementById('cartItemsList');

    if (!cartItemsList) return; // Not on cart page

    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartWithItems.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartWithItems.style.display = 'grid';

    // Render cart items
    cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-img">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">$${item.price.toFixed(2)} each</div>
                <div class="item-controls">
                    <div class="quantity-control">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remove item">🗑️</button>
                </div>
            </div>
            <div class="item-subtotal">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');

    // Update summary
    const totals = calculateTotals();
    document.getElementById('summarySubtotal').textContent = `$${totals.subtotal}`;
    document.getElementById('summaryTax').textContent = `$${totals.tax}`;
    document.getElementById('summaryDelivery').textContent = `$${totals.delivery}`;
    document.getElementById('summaryTotal').textContent = `$${totals.total}`;
}

// Proceed to checkout
async function proceedToCheckout() {
    const cart = getCart();

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('authUser');

    if (!token || !user) {
        if (confirm('You need to be logged in to checkout. Go to login page?')) {
            window.location.href = 'pages/auth.html';
        }
        return;
    }

    const userData = JSON.parse(user);
    const totals = calculateTotals();

    // Create order object
    const orderData = {
        clientId: userData.id,
        items: cart.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        totalAmount: parseFloat(totals.total),
        orderDate: new Date().toISOString(),
        status: "En attente"
    };

    try {
        // Create order via API
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Failed to create order');
        }

        const order = await response.json();

        // Create payment record
        const paymentData = {
            orderId: order.id,
            clientId: userData.id,
            amount: parseFloat(totals.total),
            paymentMethod: "Carte Bancaire",
            paymentStatus: "En attente",
            paymentDate: new Date().toISOString()
        };

        const paymentResponse = await fetch(`${API_BASE_URL}/api/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });

        if (!paymentResponse.ok) {
            console.error('Failed to create payment record');
        }

        // Clear cart
        localStorage.removeItem('sugarStatsCart');
        updateCartCount();

        // Show success message
        alert(`Order placed successfully!\n\nOrder ID: ${order.id}\nTotal: $${totals.total}\n\nThank you for your order!`);

        // Redirect to home or order confirmation page
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Checkout error:', error);
        alert('There was an error processing your order. Please try again.');
    }
}

// Show notification (simple version)
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #3E3634;
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-family: 'Space Mono', monospace;
        font-size: 0.9rem;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // If on cart page, render cart
    if (document.getElementById('cartItemsList')) {
        renderCart();
    }
});

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.clearCart = clearCart;
    window.getCart = getCart;
    window.getCartCount = getCartCount;
    window.proceedToCheckout = proceedToCheckout;
}
