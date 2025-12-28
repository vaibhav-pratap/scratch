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
                const isFirstTab = savedTabBtn.previousElementSibling === null;
                savedTabBtn.scrollIntoView({
                    behavior: 'instant',
                    block: 'nearest',
                    inline: isFirstTab ? 'start' : 'center'
                });
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
