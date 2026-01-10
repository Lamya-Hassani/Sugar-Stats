/**
 * Sugar & Stats - Admin Utilities
 * Shared logic for advanced CRUD features: Custom Modals, CSV Export, Pagination, and Sorting.
 */

// ==================== CUSTOM MODAL ====================

const modalStyles = `
    .custom-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(78, 52, 46, 0.4);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    .custom-modal-overlay.active {
        opacity: 1;
        visibility: visible;
    }
    .custom-modal {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 1.0);
        box-shadow: 0 20px 60px rgba(216, 27, 96, 0.15);
        border-radius: 24px;
        padding: 2.5rem;
        max-width: 450px;
        width: 90%;
        text-align: center;
        transform: scale(0.9);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .custom-modal-overlay.active .custom-modal {
        transform: scale(1);
    }
    .custom-modal-icon {
        font-size: 3rem;
        color: #D32F2F;
        margin-bottom: 1.5rem;
    }
    .custom-modal-title {
        font-family: 'Playfair Display', serif;
        font-size: 1.8rem;
        color: #4E342E;
        margin-bottom: 1rem;
    }
    .custom-modal-text {
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        color: #8D6E63;
        margin-bottom: 2rem;
        line-height: 1.6;
    }
    .custom-modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }
    .modal-btn {
        padding: 0.8rem 2rem;
        border-radius: 50px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
        border: none;
        font-family: 'Poppins', sans-serif;
    }
    .modal-btn-cancel {
        background: #F5F5F5;
        color: #4E342E;
    }
    .modal-btn-confirm {
        background: #D32F2F;
        color: white;
        box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3);
    }
    .modal-btn:hover {
        transform: translateY(-2px);
        opacity: 0.9;
    }

    /* TOAST NOTIFICATIONS */
    .toast-container {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .toast {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        padding: 1rem 2rem;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        border-left: 4px solid var(--c-rose);
        color: var(--c-text-main);
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 1rem;
        transform: translateX(120%);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .toast.active { transform: translateX(0); }
    .toast i { font-size: 1.1rem; }
    .toast.success { border-left-color: #43A047; }
    .toast.error { border-left-color: #D32F2F; }
    .toast.success i { color: #43A047; }
    .toast.error i { color: #D32F2F; }

    /* DETAILS MODAL OVERRIDE / EXTENSION */
    .details-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(78, 52, 46, 0.4); backdrop-filter: blur(12px);
        display: flex; justify-content: center; align-items: center;
        z-index: 9998; opacity: 0; visibility: hidden; transition: all 0.3s;
    }
    .details-modal-overlay.active { opacity: 1; visibility: visible; }
    
    .details-modal {
        background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px);
        border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 25px 70px rgba(216, 27, 96, 0.2);
        max-width: 1000px; width: 95%; padding: 2.5rem;
        position: relative; transform: translateY(30px); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
    }
    .details-modal-overlay.active .details-modal { transform: translateY(0); }

    .details-modal-close {
        position: absolute; top: 1.5rem; right: 1.5rem; font-size: 1.5rem;
        color: var(--c-text-light); cursor: pointer; transition: 0.2s;
    }
    .details-modal-close:hover { color: var(--c-rose); transform: scale(1.1); }

    /* INNER LAYOUT */
    .modal-inner { display: flex; gap: 2.5rem; align-items: flex-start; margin-bottom: 2rem; }
    .modal-left { flex: 0 0 280px; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; border-right: 1px solid rgba(141, 110, 99, 0.2); padding-right: 2.5rem; }
    .modal-right { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        border-top: 1px solid rgba(141, 110, 99, 0.1);
        padding-top: 1.5rem;
    }
    
    /* SHARED COMPONENTS IN MODAL */
    .modal-avatar { width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--c-rose); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--c-rose); background: white; box-shadow: 0 10px 25px rgba(216, 27, 96, 0.2); }
    .modal-title-main { font-family: 'Playfair Display', serif; font-size: 1.8rem; color: var(--c-text-main); margin: 0; text-align: center; }
    .modal-subtitle-main { font-size: 0.9rem; color: var(--c-text-light); margin: 0; text-align: center; }
    
    .modal-row { border-bottom: 1px dashed rgba(141, 110, 99, 0.2); padding-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.2rem; }
    .modal-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--c-text-light); }
    .modal-value { font-size: 0.95rem; color: var(--c-text-main); font-weight: 500; }

    .modal-btn { padding: 0.8rem 1.5rem; border-radius: 50px; border: none; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: 0.2s; text-decoration: none; }
    .modal-btn-primary { background: linear-gradient(135deg, var(--c-text-main) 0%, #3E2723 100%); color: white; }
    .modal-btn-rose { background: var(--c-rose); color: white; }
    .modal-btn:hover { transform: translateY(-2px); opacity: 0.9; }

    @media (max-width: 850px) {
        .modal-inner { flex-direction: column; align-items: center; }
        .modal-left { border-right: none; padding-right: 0; border-bottom: 1px solid rgba(141, 110, 99, 0.2); padding-bottom: 1.5rem; width: 100%; }
        .modal-right { grid-template-columns: 1fr; width: 100%; }
    }
`;

// Inject styles
if (!document.getElementById('admin-utils-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'admin-utils-styles';
    styleSheet.innerText = modalStyles;
    document.head.appendChild(styleSheet);
}

/**
 * Show a custom confirmation modal
 * @param {Object} options { title, text, icon, confirmText, cancelText }
 * @returns {Promise} Resolves to true if confirmed, false otherwise
 */
window.showConfirmModal = function (options = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        overlay.innerHTML = `
            <div class="custom-modal">
                <div class="custom-modal-icon"><i class="fas ${options.icon || 'fa-exclamation-triangle'}"></i></div>
                <div class="custom-modal-title">${options.title || 'Attention'}</div>
                <div class="custom-modal-text">${options.text || 'Voulez-vous vraiment effectuer cette action ?'}</div>
                <div class="custom-modal-actions">
                    <button class="modal-btn modal-btn-cancel">${options.cancelText || 'Annuler'}</button>
                    <button class="modal-btn modal-btn-confirm">${options.confirmText || 'Confirmer'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Trigger animation
        setTimeout(() => overlay.classList.add('active'), 10);

        const closeModal = (result) => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 300);
        };

        overlay.querySelector('.modal-btn-cancel').onclick = () => closeModal(false);
        overlay.querySelector('.modal-btn-confirm').onclick = () => closeModal(true);
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(false); };
    });
};

/**
 * Show a sleek details modal
 * @param {Object} options { title, leftContent, rightContentHTML }
 */
window.showDetailsModal = function (options = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'details-modal-overlay';
    overlay.innerHTML = `
        <div class="details-modal">
            <div class="details-modal-close"><i class="fas fa-times"></i></div>
            <h2 style="font-family:'Playfair Display',serif; color:var(--c-rose); border-bottom:1px solid rgba(216,27,96,0.1); padding-bottom:0.8rem; margin-bottom:1.5rem; font-size:1.6rem;">
                <i class="fas ${options.icon || 'fa-info-circle'}" style="margin-right:0.6rem;"></i> ${options.title || 'Détails'}
            </h2>
            <div class="modal-inner">
                <div class="modal-left">
                    ${options.leftContent || ''}
                </div>
                <div class="modal-right">
                    ${options.rightContentHTML || '<p>Aucune donnée disponible.</p>'}
                </div>
            </div>
            <div class="modal-actions">
                ${options.actionsHTML || ''}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    const closeModal = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 400);
    };

    overlay.querySelector('.details-modal-close').onclick = closeModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
};


// ==================== CSV EXPORT ====================

/**
 * Export JSON data to CSV
 * @param {Array} data Array of objects
 * @param {String} filename Output filename
 */
window.exportToCSV = function (data, filename = 'export.csv') {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            let val = row[header] === null || row[header] === undefined ? '' : row[header];
            // Escape quotes and commas
            val = val.toString().replace(/"/g, '""');
            if (val.search(/("|,|\n)/g) >= 0) val = '"' + val + '"';
            return val;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};


// ==================== TABLE DATA MANAGEMENT ====================

/**
 * Sorts an array of objects by a key
 * @param {Array} arr 
 * @param {String} key 
 * @param {Boolean} desc 
 */
window.sortData = function (arr, key, desc = false) {
    return [...arr].sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
    });
};

/**
 * Paginates an array
 * @param {Array} arr 
 * @param {Number} page 1-indexed
 * @param {Number} perPage 
 */
window.paginateData = function (arr, page, perPage) {
    const start = (page - 1) * perPage;
    return {
        items: arr.slice(start, start + perPage),
        total: arr.length,
        pages: Math.ceil(arr.length / perPage)
    };
};

/**
 * Show a sleek toast notification
 * @param {String} message 
 * @param {String} type 'success' | 'error' | 'info'
 */
window.showToast = function (message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('active'), 10);

    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) container.remove();
        }, 400);
    }, 4000);
};

// ==================== PAGINATION ====================

/**
 * Renders pagination buttons in #pagination container
 * @param {Number} totalPages 
 * @param {Number} currentPage 
 * @param {Function} goToPageFn Function to call on page click
 */
window.renderPagination = function (totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;

    // Use current page from calling module if available, else default 1
    const current = window.currentPage || 1;

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<div class="page-btn ${i === current ? 'active' : ''}" onclick="window.goToPage(${i})">${i}</div>`;
    }
    container.innerHTML = html;
};
