/**
 * Sidepanel Entry Point
 * Imports and initializes all modules for the sidepanel interface (same as popup)
 */

// Core modules
import { initSidePanel } from './core/init.js';
import { listenForUpdates } from './core/messaging.js';

// UI modules
import { initTabSwitching } from './ui/tabs.js';
import { initThemeToggle } from './ui/theme.js';
import { setupHighlightToggles, setupSidePanelToggle } from './ui/toggles.js';
import { renderCWVChart } from './ui/charts.js';

// Data modules
import { renderData } from './data/renderer.js';
import { downloadPDF, downloadExcel, downloadJSON } from './data/exporters.js';

// Utils
import { setupStaticCopyButtons, copyToClipboard } from './utils/clipboard.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
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
    chrome.tabs.onActivated.addListener(() => initSidePanel(renderData));
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id === tabId) {
                    initSidePanel(renderData);
                }
            });
        }
    });

    // 8. Setup Export Buttons
    setupExportButtons();
});

/**
 * Setup export button handlers
 */
function setupExportButtons() {
    document.getElementById('btn-download')?.addEventListener('click', (e) => {
        const data = window.currentSEOData;
        if (data) downloadJSON(data);
    });

    document.getElementById('btn-download-csv')?.addEventListener('click', (e) => {
        const data = window.currentSEOData;
        if (data) downloadExcel(data);
    });

    document.getElementById('btn-download-pdf')?.addEventListener('click', (e) => {
        const data = window.currentSEOData;
        if (data) downloadPDF(data);
    });

    document.getElementById('btn-copy')?.addEventListener('click', (e) => {
        const data = window.currentSEOData;
        if (data) copyToClipboard(JSON.stringify(data, null, 2), e.target);
    });
}

// Store data globally for export buttons
const originalRenderData = renderData;
window.renderData = function (data) {
    window.currentSEOData = data;
    originalRenderData(data);
};
