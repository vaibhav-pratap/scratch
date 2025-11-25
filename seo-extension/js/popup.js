/**
 * Popup Entry Point
 * Imports and initializes all modules for the popup interface
 */

// Core modules
import { initPopup } from './core/init.js';
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

// Initialize when DOM is ready
function init() {
    // 0. Render Static Layout (Modular HTML)
    renderStaticLayout();

    // 1. Tab Switching
    initTabSwitching();

    // 2. Theme Toggle
    initThemeToggle();

    // 3. Initialize Data Fetching
    initPopup((data) => {
        window.currentSEOData = data;
        renderData(data);
    });

    // 4. Setup Copy Buttons
    setupStaticCopyButtons();

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
        console.error('[Popup] Error initializing AI Insights:', error);
    }

    // 9. Setup AI Analysis Tab (async, don't await to avoid blocking)
    try {
        // Call without await - it handles its own initialization timing
        initAIAnalysisTab().catch(error => {
            console.error('[Popup] Error initializing AI Analysis:', error);
        });
    } catch (error) {
        console.error('[Popup] Error calling initAIAnalysisTab:', error);
    }

    // 10. Real-time Updates Listener
    listenForUpdates(renderData, renderCWVChart);

    // 11. Setup Export Buttons (with slight delay to ensure DOM is ready)
    setTimeout(() => {
        setupExportButtons();
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Setup export button handlers
 */
function setupExportButtons() {
    const btnDownload = document.getElementById('btn-download');
    const btnDownloadCsv = document.getElementById('btn-download-csv');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    const btnCopy = document.getElementById('btn-copy');

    console.log('Setting up export buttons:', { btnDownload, btnDownloadCsv, btnDownloadPdf, btnCopy });

    if (btnDownload) {
        btnDownload.addEventListener('click', (e) => {
            console.log('Download JSON clicked');
            const data = window.currentSEOData;
            if (data) {
                downloadJSON(data);
            } else {
                console.warn('No data available for export');
            }
        });
    }

    if (btnDownloadCsv) {
        btnDownloadCsv.addEventListener('click', (e) => {
            console.log('Download CSV clicked');
            const data = window.currentSEOData;
            if (data) {
                downloadExcel(data);
            } else {
                console.warn('No data available for export');
            }
        });
    }

    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', (e) => {
            console.log('Download PDF clicked');
            const data = window.currentSEOData;
            if (data) {
                downloadPDF(data);
            } else {
                console.warn('No data available for export');
            }
        });
    }

    if (btnCopy) {
        btnCopy.addEventListener('click', (e) => {
            console.log('Copy JSON clicked');
            const data = window.currentSEOData;
            if (data) {
                copyToClipboard(JSON.stringify(data, null, 2), e.target);
            } else {
                console.warn('No data available for export');
            }
        });
    }
}

// Store data globally for export buttons (temporary solution)
// A better approach would be to pass it via Events or State management
const originalRenderData = renderData;
window.renderData = function (data) {
    window.currentSEOData = data;
    originalRenderData(data);
};
