/**
 * Tab switching module
 * Handles navigation between different tabs
 */

import { getSettings } from '../core/storage.js';

/**
 * Initialize tab switching functionality
 */
export async function initTabSwitching() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    // 0. Check for default Notes setting
    const settings = await getSettings(['defaultToNotes']);
    let defaultTabId = 'notes';

    if (settings.defaultToNotes) {
        defaultTabId = 'notes';
    }

    // 1. Restore saved tab state
    let savedTabId = localStorage.getItem('activeTab');

    // If no saved tab, or if we want to force default (optional logic, but let's respect user navigation for now unless it's a fresh open)
    // Actually, user request implies "default page to open everything", which usually means on fresh start.
    // But localStorage persists across sessions. Let's prioritize the setting if no localStorage, OR if we want to override.
    // Standard behavior: if user set a default, use it. If they navigated away, remember it? 
    // Let's say: if "defaultToNotes" is true, we default to 'notes' if no savedTabId exists.
    // If savedTabId exists, we respect it (user was just there).

    // However, "default page to open everything" might mean "always open on this page".
    // Let's implement: If setting is enabled, override savedTabId on initialization? 
    // Usually "default page" means the home page.

    if (settings.defaultToNotes) {
        // If we want to force it every time the popup opens:
        savedTabId = 'notes';
    }

    if (savedTabId) {
        // Deactivate default active
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        // Activate saved tab
        const savedTabBtn = document.querySelector(`.tab-btn[data-tab="${savedTabId}"]`);
        const savedTabContent = document.getElementById(savedTabId);

        if (savedTabBtn && savedTabContent) {
            savedTabBtn.classList.add('active');
            savedTabContent.classList.add('active');

            // Scroll to saved tab immediately
            // Use 'start' for first tab to prevent cutoff
            setTimeout(() => {
                const tabsContainer = document.querySelector('.tabs-container');
                const isFirstTab = savedTabBtn.previousElementSibling === null;

                // Reset scroll to 0 for first tab to show margin
                if (isFirstTab && tabsContainer) {
                    tabsContainer.scrollLeft = 0;
                } else {
                    savedTabBtn.scrollIntoView({
                        behavior: 'instant',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            }, 0);
        } else {
            // Fallback to default if saved tab not found
            const defaultTab = document.querySelector(`.tab-btn[data-tab="${defaultTabId}"]`);
            if (defaultTab) defaultTab.classList.add('active');
            const defaultContent = document.getElementById(defaultTabId);
            if (defaultContent) defaultContent.classList.add('active');
        }
    } else {
        // No saved tab, use default
        // Deactivate default active (which is hardcoded in HTML usually)
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        const defaultTab = document.querySelector(`.tab-btn[data-tab="${defaultTabId}"]`);
        if (defaultTab) defaultTab.classList.add('active');
        const defaultContent = document.getElementById(defaultTabId);
        if (defaultContent) defaultContent.classList.add('active');

        // Reset scroll for default tab if it's first
        setTimeout(() => {
            const tabsContainer = document.querySelector('.tabs-container');
            if (tabsContainer && defaultTab && defaultTab.previousElementSibling === null) {
                tabsContainer.scrollLeft = 0;
            }
        }, 0);
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // 2. Save state
            localStorage.setItem('activeTab', targetId);

            // 2b. Dispatch Event for Sidepanel to handle (render content)
            const event = new CustomEvent('tabActivated', { detail: { tabId: targetId } });
            document.dispatchEvent(event);

            // 3. Auto-scroll - use 'start' for first tab to prevent cutoff
            const isFirstTab = tab.previousElementSibling === null;
            tab.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: isFirstTab ? 'start' : 'center'
            });
        });
    });

    // 4. Initialize Drag Scrolling
    setupDragScrolling(document.querySelector('.tabs-container'));
}

/**
 * Enable drag-to-scroll for the tabs container
 */
function setupDragScrolling(slider) {
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active'); // Optional: for cursor grabbing style if needed
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault(); // Prevent text selection
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast (multiplier)
        slider.scrollLeft = scrollLeft - walk;
    });

    // Touch support acts natively with overflow-x: auto, 
    // but we can ensure it feels right if needed. 
    // Usually browser handles touch scroll on overflow elements automatically.
}

/**
 * Programmatically switch to a specific tab
 */
export function switchToTab(tabId) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.click();
        }
    });
}

/**
 * Initialize custom tooltips for tab buttons
 * Shows a styled tooltip below inactive tabs on hover
 */
export function initTabTooltips() {
    // Create shared tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tab-tooltip';
    tooltip.innerHTML = '<div class="tab-tooltip-title"></div><div class="tab-tooltip-desc"></div>';
    document.body.appendChild(tooltip);

    const titleEl = tooltip.querySelector('.tab-tooltip-title');
    const descEl = tooltip.querySelector('.tab-tooltip-desc');

    let showTimeout = null;

    function showTooltip(btn) {
        const tipTitle = btn.dataset.tipTitle;
        const tipDesc = btn.dataset.tipDesc;
        if (!tipTitle) return;

        titleEl.textContent = tipTitle;
        descEl.textContent = tipDesc || '';
        descEl.style.display = tipDesc ? '' : 'none';

        // Position below the button, centered
        const rect = btn.getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.classList.remove('visible');

        // Need to measure tooltip size after content update
        requestAnimationFrame(() => {
            const tipW = tooltip.offsetWidth;
            let left = rect.left + (rect.width / 2) - (tipW / 2);
            const top = rect.bottom + 6;

            // Clamp to viewport
            const viewW = window.innerWidth;
            if (left < 4) left = 4;
            if (left + tipW > viewW - 4) left = viewW - tipW - 4;

            // Update arrow position relative to button center
            const arrowLeft = rect.left + (rect.width / 2) - left;
            tooltip.style.setProperty('--arrow-left', `${arrowLeft}px`);

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
            tooltip.classList.add('visible');
        });
    }

    function hideTooltip() {
        clearTimeout(showTimeout);
        tooltip.classList.remove('visible');
        setTimeout(() => {
            if (!tooltip.classList.contains('visible')) {
                tooltip.style.display = 'none';
            }
        }, 200);
    }

    // Attach listeners to all tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn[data-tip-title]');
    tabBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            // Don't show tooltip for active tab
            if (btn.classList.contains('active')) return;
            clearTimeout(showTimeout);
            showTimeout = setTimeout(() => showTooltip(btn), 300);
        });

        btn.addEventListener('mouseleave', () => {
            hideTooltip();
        });
    });
}
