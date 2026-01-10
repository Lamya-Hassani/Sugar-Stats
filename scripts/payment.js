if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = "http://localhost:3000";
}

document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const user = JSON.parse(localStorage.getItem('authUser')) || JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('authToken');

    if (!token || !user) {
        window.location.href = 'pages/auth.html';
        return;
    }

    if (cart.length === 0) {
        window.location.href = 'products.html';
        return;
    }

    renderSummary(cart);
    setupOptions();
});

function renderSummary(cart) {
    const container = document.getElementById('paymentOrderItems');
    let total = 0;
    let html = '';

    cart.forEach(item => {
        const itemLineTotal = item.price * item.quantity;
        total += itemLineTotal;
        html += `
            <div class="order-summary-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>${itemLineTotal.toFixed(2)} DH</span>
            </div>
        `;
    });

    total += 20; // Delivery
    container.innerHTML = html;
    document.getElementById('paymentTotal').textContent = `${total.toFixed(2)} DH`;
}

function setupOptions() {
    const options = document.querySelectorAll('.method-option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });
}

function confirmPayment() {
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

async function executeOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const user = JSON.parse(localStorage.getItem('authUser')) || JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('authToken');
    const method = document.querySelector('.method-option.active').dataset.method;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = subtotal + 20;

    const orderData = {
        clientId: user.id,
        items: cart,
        totalAmount: totalAmount,
        status: method === 'paypal' ? 'Payé' : 'En attente',
        orderDate: new Date().toISOString()
    };

    try {
        // 1. Create Order
        const orderRes = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!orderRes.ok) throw new Error('Failed to create order');
        const order = await orderRes.json();

        // 2. Create Payment Record
        const paymentData = {
            orderId: order.id,
            amount: totalAmount,
            paymentMethod: method === 'paypal' ? 'PayPal' : 'Espèces',
            paymentStatus: method === 'paypal' ? 'Validé' : 'À la livraison'
        };

        await fetch(`${API_BASE_URL}/api/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });

        // 3. Clear Cart and Redirect
        localStorage.removeItem('cart');
        window.location.href = 'profile.html';

    } catch (err) {
        alert("Une erreur est survenue lors de la validation : " + err.message);
    }
}
