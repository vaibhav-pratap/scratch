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
import { initGeminiSettings } from './ui/gemini-settings.js';
import { initAISummary } from './ui/ai-summary.js';
import { initAIInsights } from './ui/ai-insights.js';
import { initAIAnalysisTab } from './data/renderers/ai-analysis.js';

// Data modules
import { renderData } from './data/renderer.js';
import { downloadPDF, downloadExcel, downloadJSON, downloadCSV } from './data/exporters.js';

// Utils
import { setupStaticCopyButtons, copyToClipboard } from './utils/clipboard.js';

// Global variable to store the current data for export/copy functionality
// This is the data source for setupExportButtons()
window.currentSEOData = null;

// Initialize when DOM is ready
function init() {
    // 0. Render Static Layout (Modular HTML)
    renderStaticLayout();

    // 1. Tab Switching
    initTabSwitching();

    // 2. Theme Toggle
    initThemeToggle();

    // 3. Setup Copy Buttons (for static elements that don't need currentSEOData)
    setupStaticCopyButtons();

    // 4. Setup Export Buttons (Listeners check window.currentSEOData on click, so safe to setup early)
    setupExportButtons();

    // 5. Setup Toggles
    setupHighlightToggles();
    setupSidePanelToggle();

    // 6. Setup Gemini Settings
    initGeminiSettings();

    // 7. Setup AI Summary
    initAISummary();

    // 8. Setup AI Insights for all tabs
    try {
        initAIInsights();
    } catch (error) {
        console.error('[Sidepanel] Error initializing AI Insights:', error);
    }

    // 9. Setup AI Analysis Tab (async, don't await to avoid blocking)
    try {
        // Call without await - it handles its own initialization timing
        initAIAnalysisTab().catch(error => {
            console.error('[Sidepanel] Error initializing AI Analysis:', error);
        });
    } catch (error) {
        console.error('[Sidepanel] Error calling initAIAnalysisTab:', error);
    }

    // 10. Initialize Data Fetching
    // This callback runs when data is first retrieved
    initSidePanel((data) => {
        console.log('[Sidepanel Callback] Received initial data:', data ? 'YES' : 'NO');

        // Ensure data is set before rendering
        window.currentSEOData = data;
        renderData(data);
    });

    // 11. Real-time Updates Listener
    // Note: The listener will call renderData, which updates the UI.
    // However, we need to ensure renderData also updates window.currentSEOData
    listenForUpdates(data => {
        window.currentSEOData = data; // Update global data on real-time changes
        renderData(data);
    }, renderCWVChart);

    // 12. Listen for tab switching and navigation changes
    // Only re-fetch and re-render data, DO NOT re-setup buttons (listeners are already attached)
    const handleTabChange = () => {
        initSidePanel((data) => {
            window.currentSEOData = data; // Update global data
            renderData(data);
        });
    };

    chrome.tabs.onActivated.addListener(handleTabChange);

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id === tabId) {
                    handleTabChange();
                }
            });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Setup export button handlers
 * This function is called only ONCE after the initial data fetch.
 */
function setupExportButtons() {
    // Only query the DOM once
    const btnDownload = document.getElementById('btn-download');
    const btnDownloadCsv = document.getElementById('btn-download-csv');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    const btnCopy = document.getElementById('btn-copy');

    console.log('Setting up export buttons:', { btnDownload, btnDownloadCsv, btnDownloadPdf, btnCopy });

    // Listener for JSON download
    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            console.log('Download JSON clicked');
            const data = window.currentSEOData;
            if (data) {
                downloadJSON(data);
            } else {
                console.warn('No data available for export (JSON)');
            }
        });
    }

    // Listener for CSV/Excel download
    if (btnDownloadCsv) {
        btnDownloadCsv.addEventListener('click', () => {
            console.log('Download CSV clicked');
            const data = window.currentSEOData;
            if (data) {
                // Assuming downloadExcel can handle CSV format based on the button ID
                downloadExcel(data);
            } else {
                console.warn('No data available for export (CSV)');
            }
        });
    }

    // Listener for PDF download
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => {
            console.log('Download PDF clicked');
            const data = window.currentSEOData;
            if (data) {
                downloadPDF(data);
            } else {
                console.warn('No data available for export (PDF)');
            }
        });
    }

    // Listener for Copy JSON to Clipboard
    if (btnCopy) {
        btnCopy.addEventListener('click', (e) => {
            console.log('Copy JSON clicked');
            const data = window.currentSEOData;
            if (data) {
                copyToClipboard(JSON.stringify(data, null, 2), e.target);
            } else {
                console.warn('No data available for copy');
            }
        });
    }
}