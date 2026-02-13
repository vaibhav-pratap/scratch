import { switchToTab } from './tabs.js';

/**
 * Initialize Menu Logic
 */
export function initMenu() {
    const btnMenu = document.getElementById('btn-menu');
    const modal = document.getElementById('menu-modal');
    const bottomSheet = modal?.querySelector('.bottom-sheet');
    const menuSettings = document.getElementById('menu-settings');

    if (!btnMenu || !modal) return;

    // Open Menu
    btnMenu.addEventListener('click', () => {
        modal.style.display = 'flex';
        // Add minimal delay to allow display:flex to apply before opacity transition
        requestAnimationFrame(() => {
            modal.classList.add('open');
        });
    });

    // Close Menu (Click Backdrop)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMenu();
        }
    });

    // Close on Settings Click and navigate
    if (menuSettings) {
        menuSettings.addEventListener('click', () => {
            closeMenu();
            switchToTab('settings');
        });
    }

    // New Menu Item Listeners
    ['support', 'contact', 'terms'].forEach(id => {
        const item = document.getElementById(`menu-${id}`);
        if (item) {
            item.addEventListener('click', () => {
                closeMenu();
                switchToTab(id);
            });
        }
    });

    function closeMenu() {
        modal.classList.remove('open');
        // Wait for transition to finish before hiding
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Match CSS transition duration
    }
}
