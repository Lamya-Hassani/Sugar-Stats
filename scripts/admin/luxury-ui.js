/* scripts/admin/luxury-ui.js */

document.addEventListener('DOMContentLoaded', () => {
    initProgressBar();
    // initLuxuryCursor(); // REMOVED for performance debugging
    initEntranceAnimations();
    enhanceCharts();
    initHoverSparkles();
});

function initProgressBar() {
    const bar = document.createElement('div');
    bar.className = 'luxury-loader-bar';
    document.body.appendChild(bar);

    const style = document.createElement('style');
    style.innerHTML = `
        .luxury-loader-bar {
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(to right, #FF0080, #7928CA);
            z-index: 10001;
            width: 0%;
            transition: width 0.4s ease, opacity 0.5s ease;
            box-shadow: 0 0 15px rgba(255, 0, 128, 0.4);
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => { bar.style.width = '40%'; }, 100);
    setTimeout(() => { bar.style.width = '100%'; }, 400);
    setTimeout(() => { bar.style.opacity = '0'; }, 800);
}

// function initLuxuryCursor() { ... } // Removed for performance debugging

function initEntranceAnimations() {
    const selector = '.stat-card, .chart-container, .action-card, .table-container, .header, h2';
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';

        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 50 + (index * 40)); // Faster stagger
    });
}

function initHoverSparkles() {
    // Only attach to main interactive elements to save perf
    const targets = document.querySelectorAll('.stat-card, .action-card, .btn-primary');
    targets.forEach(target => {
        target.addEventListener('mousemove', (e) => {
            if (Math.random() > 0.08) return;
            createSparkle(e.clientX, e.clientY);
        });
    });
}

function createSparkle(x, y) {
    const s = document.createElement('div');
    s.innerHTML = '\u2728'; // ✨
    s.style.position = 'fixed';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.fontSize = '14px';
    s.style.pointerEvents = 'none';
    s.style.zIndex = '10000';
    document.body.appendChild(s);

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 40 + 10;

    s.animate([
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0) rotate(180deg)`, opacity: 0 }
    ], {
        duration: 600,
        easing: 'ease-out'
    }).onfinish = () => s.remove();
}

function enhanceCharts() {
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "'Poppins', sans-serif";
        Chart.defaults.color = '#4A4A6A';
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(26, 26, 46, 0.95)';
        Chart.defaults.plugins.tooltip.padding = 14;
        Chart.defaults.plugins.tooltip.cornerRadius = 12;
        Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: '700' };
        Chart.defaults.plugins.tooltip.bodyFont = { size: 13 };
        Chart.defaults.plugins.tooltip.usePointStyle = true;
    }
}
