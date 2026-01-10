/* scripts/admin/bakery-bg.js */

const CONFIG = {
    // THEME PALETTE EXTRACTED FROM YOUR IMAGE
    colors: [
        '#F7C065', // Apricot Yellow
        '#3FA182', // Teal Green
        '#C93D67', // Berry Pink
        '#D0D0D0', // Silver Grey
        '#8AD8B8'  // Mint Green
    ],
    
    // Settings
    opacity: 0.35, // Slightly higher opacity to make these vibrant colors pop
    count: 35,     // Number of pastries
    minSize: 40,
    maxSize: 75,
    speed: 0.4     // Float speed
};

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Canvas Setup
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '-1'; 
canvas.style.pointerEvents = 'none';
document.body.appendChild(canvas);

let width, height;
let items = [];

// --- PASTRY ARTISTS (Drawing Functions) ---

const drawDonut = (ctx, size, color) => {
    ctx.fillStyle = color;
    // Dough
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Hole
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(0, 0, size/5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Sprinkles (White to contrast with vibrant colors)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for(let i=0; i<6; i++) {
        let ang = Math.random() * Math.PI * 2;
        let r = (size/3.2);
        ctx.beginPath();
        // Elongated sprinkles
        let sx = Math.cos(ang)*r;
        let sy = Math.sin(ang)*r;
        ctx.rect(sx, sy, 3, 6);
        ctx.fill();
    }
};

const drawMacaron = (ctx, size, color) => {
    ctx.fillStyle = color;
    const h = size * 0.55;
    
    // Top Shell
    ctx.beginPath();
    ctx.ellipse(0, -h/4, size/2, h/3, 0, Math.PI, 0); 
    ctx.fill();
    
    // Bottom Shell
    ctx.beginPath();
    ctx.ellipse(0, h/4, size/2, h/3, 0, 0, Math.PI); 
    ctx.fill();
    
    // Filling (White cream)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.roundRect(-size/2.2, -3, size/1.1, 6, 3);
    ctx.fill();
};

const drawCupcake = (ctx, size, color) => {
    // Wrapper (Using the Grey from palette for wrapper)
    ctx.fillStyle = '#D0D0D0'; 
    ctx.beginPath();
    ctx.moveTo(-size/4, size/2);
    ctx.lineTo(size/4, size/2);
    ctx.lineTo(size/3, 0);
    ctx.lineTo(-size/3, 0);
    ctx.fill();
    
    // Frosting (The Main Color)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -size/6, size/3, 0, Math.PI*2); 
    ctx.arc(-size/4, 0, size/5, 0, Math.PI*2); 
    ctx.arc(size/4, 0, size/5, 0, Math.PI*2); 
    ctx.fill();
    
    // Cherry (Berry Pink from palette)
    ctx.fillStyle = '#C93D67';
    ctx.beginPath();
    ctx.arc(0, -size/2, size/12, 0, Math.PI*2);
    ctx.fill();
};

const drawCookie = (ctx, size, color) => {
    // Cookie Body (The Main Color)
    ctx.fillStyle = color; 
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Chips (White Chocolate chips)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const chips = [
        {x: -size/6, y: -size/6},
        {x: size/5, y: size/5},
        {x: size/6, y: -size/4},
        {x: -size/4, y: size/8},
        {x: 0, y: 0}
    ];
    chips.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size/12, 0, Math.PI*2);
        ctx.fill();
    });
};

// --- LOGIC ---

class PastryItem {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 100;
        
        this.size = Math.random() * (CONFIG.maxSize - CONFIG.minSize) + CONFIG.minSize;
        this.type = Math.floor(Math.random() * 4); // 0-3
        this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
        
        // Float Upwards with slight side drift
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -(Math.random() * CONFIG.speed + 0.2); 
        
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.02; 
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.vRot;

        // Reset if goes off screen
        if (this.y < -100 || this.x < -100 || this.x > width + 100) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Apply Global Transparency
        ctx.globalAlpha = CONFIG.opacity;
        
        // Draw specific shape
        switch(this.type) {
            case 0: drawDonut(ctx, this.size, this.color); break;
            case 1: drawMacaron(ctx, this.size, this.color); break;
            case 2: drawCupcake(ctx, this.size, this.color); break;
            case 3: drawCookie(ctx, this.size, this.color); break;
        }
        
        ctx.restore();
    }
}

// --- MAIN LOOP ---

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function init() {
    resize();
    items = [];
    for (let i = 0; i < CONFIG.count; i++) {
        items.push(new PastryItem());
    }
    animate();
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    items.forEach(item => {
        item.update();
        item.draw();
    });
    
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
init();