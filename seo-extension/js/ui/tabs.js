/**
 * Tab switching module
 * Handles navigation between different tabs
 */

/**
 * Initialize tab switching functionality
 */
export function initTabSwitching() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    // 1. Restore saved tab state
    const savedTabId = localStorage.getItem('activeTab');
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
            setTimeout(() => {
                savedTabBtn.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
            }, 0);
        } else {
            // Fallback to overview if saved tab not found
            const defaultTab = document.querySelector('.tab-btn[data-tab="overview"]');
            if (defaultTab) defaultTab.classList.add('active');
            const defaultContent = document.getElementById('overview');
            if (defaultContent) defaultContent.classList.add('active');
        }
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

            // 3. Auto-scroll to center
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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
