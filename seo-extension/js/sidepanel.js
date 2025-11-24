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
        console.log('[Sidepanel Callback] Received data:', data ? 'YES' : 'NO', data);
        window.currentSEOData = data;
        console.log('[Sidepanel Callback] Set window.currentSEOData:', window.currentSEOData);
        renderData(data);
        console.log('[Sidepanel Callback] After renderData, window.currentSEOData:', window.currentSEOData);
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
    console.log('[Sidepanel] Setting up export buttons...');

    // Use event delegation on the footer container
    const footer = document.querySelector('.app-footer');
    if (!footer) {
        console.error('[Sidepanel] Footer not found!');
        return;
    }

    console.log('[Sidepanel] Footer found, attaching delegated listener');

    // Remove any existing listener to prevent duplicates
    footer.removeEventListener('click', handleFooterClick);
    footer.addEventListener('click', handleFooterClick);
}

function handleFooterClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const data = window.currentSEOData;

    console.log('[Sidepanel] Button clicked:', target.id);
    console.log('[Sidepanel] window.currentSEOData:', window.currentSEOData);
    console.log('[Sidepanel] data variable:', data);

    if (target.id === 'btn-download') {
        console.log('[Sidepanel] Download JSON clicked');
        if (data) downloadJSON(data);
        else console.warn('[Sidepanel] No data available');
    } else if (target.id === 'btn-download-csv') {
        console.log('[Sidepanel] Download CSV clicked');
        if (data) downloadExcel(data);
        else console.warn('[Sidepanel] No data available');
    } else if (target.id === 'btn-download-pdf') {
        console.log('[Sidepanel] Download PDF clicked');
        if (data) downloadPDF(data);
        else console.warn('[Sidepanel] No data available');
    } else if (target.id === 'btn-copy') {
        console.log('[Sidepanel] Copy clicked');
        if (data) copyToClipboard(JSON.stringify(data, null, 2), target);
        else console.warn('[Sidepanel] No data available');
    }
}
