/* card-particles.js */

function initCardParticles(canvasId, hexColors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    // Helper: Convert Hex to RGB
    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.replace('#', ''), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `${r}, ${g}, ${b}`;
    };

    // Prepare Palette: [Primary, Secondary, White Sparkle]
    const colorPalette = [
        `rgba(${hexToRgb(hexColors[0])}, 0.8)`, // Primary
        `rgba(${hexToRgb(hexColors[1])}, 0.6)`, // Secondary
        `rgba(255, 255, 255, 0.9)`              // Sparkle
    ];

    // Resize
    const resize = () => {
        const parent = canvas.parentElement;
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
        initParticles();
    };

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            // Slightly larger particles for "Bokeh" effect
            this.size = Math.random() * 4 + 1; 
            this.speedX = (Math.random() - 0.5) * 1.5; // Faster movement
            this.speedY = (Math.random() - 0.5) * 1.5;
            this.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            this.growth = Math.random() * 0.1 - 0.05; // Pulse effect
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.size += this.growth;

            // Pulse size limits
            if (this.size > 6 || this.size < 0.5) this.growth *= -1;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            
            // Add GLOW effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            
            ctx.fill();
            ctx.shadowBlur = 0; // Reset for performance
        }
    }

    function initParticles() {
        particles = [];
        // More particles for vibrant look
        const particleCount = 45; 
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Orders Card: Raspberry & Gold
    initCardParticles('canvas-orders', ['#FF3366', '#FFC107']); 
    
    // 2. Revenue Card: Gold & Orange
    initCardParticles('canvas-revenue', ['#FFC107', '#FF6D00']); 
    
    // 3. Clients Card: Lavender & Blue
    initCardParticles('canvas-clients', ['#AA00FF', '#00B0FF']); 
});