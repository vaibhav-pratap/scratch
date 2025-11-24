/**
 * Sidepanel Entry Point
 * Imports and initializes all modules for the sidepanel interface
 */

// Core modules
import { initSidePanel } from './core/init.js';
import { listenForUpdates } from './core/messaging.js';

// UI modules
import { renderStaticLayout } from './ui/layout.js';
import { initTabSwitching } from './ui/tabs.js';
import { initThemeToggle } from './ui/theme.js';
import { setupHighlightToggles, setupSidePanelToggle } from './ui/toggles.js';
import { renderCWVChart } from './ui/charts.js';

// Data modules
import { renderData } from './data/renderer.js';
import { downloadPDF, downloadExcel, downloadJSON, downloadCSV } from './data/exporters.js';

// Utils
import { setupStaticCopyButtons, copyToClipboard } from './utils/clipboard.js';

// Initialize when DOM is ready
function init() {
    // 0. Render Static Layout (Modular HTML)
    renderStaticLayout();

    // 1. Tab Switching
    initTabSwitching();

    // 2. Theme Toggle
    initThemeToggle();

    // 3. Initialize Data Fetching
    initSidePanel((data) => {
        window.currentSEOData = data;
        renderData(data);
    });

    // 4. Setup Copy Buttons
    setupStaticCopyButtons();

    // 5. Setup Toggles
    setupHighlightToggles();
    setupSidePanelToggle();

    // 6. Real-time Updates Listener
    listenForUpdates(renderData, renderCWVChart);

    // 7. Listen for tab switching and navigation
    chrome.tabs.onActivated.addListener(() => {
        initSidePanel((data) => {
            window.currentSEOData = data;
            renderData(data);
            // Re-setup buttons after data reload
            setupExportButtons();
        });
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id === tabId) {
                    initSidePanel((data) => {
                        window.currentSEOData = data;
                        renderData(data);
                        // Re-setup buttons after data reload
                        setupExportButtons();
                    });
                }
            });
        }
    });

    // 8. Setup Export Buttons (with delay to ensure DOM is ready)
    setTimeout(() => {
        setupExportButtons();
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Setup export button handlers using event delegation
 */
function setupExportButtons() {
    const footer = document.querySelector('.app-footer');
    if (!footer) return;

    footer.removeEventListener('click', handleFooterClick);
    footer.addEventListener('click', handleFooterClick);
}

function handleFooterClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const data = window.currentSEOData;

    if (target.id === 'btn-download') {
        if (data) downloadJSON(data);
    } else if (target.id === 'btn-download-csv') {
        if (data) downloadExcel(data);
    } else if (target.id === 'btn-download-pdf') {
        if (data) downloadPDF(data);
    } else if (target.id === 'btn-copy') {
        if (data) copyToClipboard(JSON.stringify(data, null, 2), target);
    }
}
