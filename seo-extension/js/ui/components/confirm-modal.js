/**
 * Custom Confirmation Modal
 * Replaces native confirm() with an Adobe Spectrum inspired dialog
 */
export const ConfirmModal = {
    /**
     * Show a confirmation modal
     * @param {Object} options
     * @param {string} options.title - Modal title
     * @param {string} options.message - Modal message
     * @param {string} options.confirmText - Text for confirm button (default: 'Delete')
     * @param {string} options.cancelText - Text for cancel button (default: 'Cancel')
     * @param {string} options.variant - 'destructive' (red) or 'primary' (blue)
     * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise
     */
    show({ title, message, confirmText = 'Delete', cancelText = 'Cancel', variant = 'destructive' }) {
        return new Promise((resolve) => {
            // Create backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'confirm-modal-backdrop';

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';

            // Modal Content
            modal.innerHTML = `
                <h3 class="confirm-title">${title}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="confirm-btn-cancel">${cancelText}</button>
                    <button class="confirm-btn-action ${variant}">${confirmText}</button>
                </div>
            `;

            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);

            // Animate in
            requestAnimationFrame(() => {
                backdrop.classList.add('visible');
                modal.classList.add('visible');
            });

            // Focus management
            const cancelBtn = modal.querySelector('.confirm-btn-cancel');
            const confirmBtn = modal.querySelector('.confirm-btn-action');
            confirmBtn.focus();

            // Handlers
            const close = (result) => {
                backdrop.classList.remove('visible');
                modal.classList.remove('visible');
                setTimeout(() => {
                    if (backdrop.parentNode) {
                        document.body.removeChild(backdrop);
                    }
                    resolve(result);
                }, 200); // Wait for transition
            };

            cancelBtn.addEventListener('click', () => close(false));
            confirmBtn.addEventListener('click', () => close(true));

            // Click outside to close (optional, usually native confirm is modal so clicking outside might not close, but consistent UI often does. Let's make it strict for 'confirm' replacement to avoid accidental dismissal, or allow it as 'cancel'.)
            // Let's allow click outside as cancel for better UX
            backdrop.onclick = (e) => {
                if (e.target === backdrop) close(false);
            };

            // Keyboard support
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    }
};
