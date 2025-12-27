/**
 * Popup Entry Point
 * Imports and initializes all modules for the popup interface
 */

// Core modules
import { initPopup } from './core/init.js';
import { listenForUpdates } from './core/messaging.js';

// UI modules
import { renderStaticLayout } from './ui/layout.js';
import { initTabSwitching, switchToTab } from './ui/tabs.js';
import { initThemeToggle } from './ui/theme.js';
import { setupHighlightToggles, setupSidePanelToggle } from './ui/toggles.js';
import { renderCWVChart } from './ui/charts.js';
import { initGeminiSettings } from './ui/gemini-settings.js';
import { initAISummary } from './ui/ai-summary.js';
import { initAIInsights } from './ui/ai-insights.js';
import { initAIAnalysisTab } from './data/renderers/ai-analysis.js';
import { initAdsTransparency, initMetaAds } from './ui/ads-transparency.js';
import { renderKeywordsSettings } from './ui/keywords-settings.js';
import { renderKeywordsPerformance } from './data/renderers/keywords-performance.js';
import { renderProfile } from './ui/profile.js';

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

    // 7. Setup Keywords Settings
    try {
        const keywordsContainer = document.getElementById('keywords-api-settings');
        if (keywordsContainer) {
            renderKeywordsSettings(keywordsContainer);
        }
    } catch (error) {
        console.error('[Popup] Error initializing Keywords Settings:', error);
    }

    // 8. Initialize Keywords Performance
    updateKeywordsPerformance();

    // 10. Setup Ads Transparency
    initAdsTransparency();
    initMetaAds();

    // 11. Setup AI Summary
    initAISummary();

    // 12. Setup AI Insights
    try {
        initAIInsights();
    } catch (error) {
        console.error('[Popup] Error initializing AI Insights:', error);
    }

    // 13. Setup AI Analysis Tab
    try {
        initAIAnalysisTab().catch(error => {
            console.error('[Popup] Error initializing AI Analysis:', error);
        });
    } catch (error) {
        console.error('[Popup] Error calling initAIAnalysisTab:', error);
    }

    // 14. Real-time Updates Listener
    listenForUpdates(renderData, renderCWVChart);

    // 15. Setup Export Buttons
    setTimeout(() => {
        setupExportButtons();
    }, 100);

    // 16. Profile Button Listener
    document.getElementById('btn-profile')?.addEventListener('click', () => {
        switchToTab('profile');
    });

    // 17. Profile Tab Activation Listener
    const profileTabBtn = document.querySelector('.tab-btn[data-tab="profile"]');
    if (profileTabBtn) {
        profileTabBtn.addEventListener('click', () => {
            const container = document.getElementById('profile-container');
            if (container) {
                renderProfile(container);
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Helper to update Keywords Performance tab
 */
function updateKeywordsPerformance() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            const container = document.getElementById('keywords-performance-container');
            if (container) {
                renderKeywordsPerformance(container, tabs[0].url);
            }
        }
    });
}

/**
 * Setup export button handlers
 */
function setupExportButtons() {
    const btnExport = document.getElementById('btn-export');
    const exportModal = document.getElementById('export-modal');
    
    // Toggle Export Modal
    if (btnExport && exportModal) {
        btnExport.addEventListener('click', () => {
            exportModal.style.display = 'flex';
            // Animate sheet up
            setTimeout(() => {
                exportModal.querySelector('.bottom-sheet').classList.add('active');
            }, 10);
        });

        // Close on backdrop click
        exportModal.addEventListener('click', (e) => {
            if (e.target === exportModal) {
                exportModal.querySelector('.bottom-sheet').classList.remove('active');
                setTimeout(() => {
                    exportModal.style.display = 'none';
                }, 300);
            }
        });
    }

    // Export Actions
    const btnDownload = document.getElementById('btn-download');
    const btnDownloadCsv = document.getElementById('btn-download-csv');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    const btnCopy = document.getElementById('btn-copy');

    const closeExportModal = () => {
        if (exportModal) {
            exportModal.querySelector('.bottom-sheet').classList.remove('active');
            setTimeout(() => {
                exportModal.style.display = 'none';
            }, 300);
        }
    };

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            const data = window.currentSEOData;
            if (data) downloadJSON(data);
            closeExportModal();
        });
    }

    if (btnDownloadCsv) {
        btnDownloadCsv.addEventListener('click', () => {
            const data = window.currentSEOData;
            if (data) downloadExcel(data);
            closeExportModal();
        });
    }

    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => {
            const data = window.currentSEOData;
            if (data) downloadPDF(data);
            closeExportModal();
        });
    }

    if (btnCopy) {
        btnCopy.addEventListener('click', (e) => {
            const data = window.currentSEOData;
            if (data) copyToClipboard(JSON.stringify(data, null, 2), e.target);
            closeExportModal();
        });
    }
}

// Store data globally for export buttons
const originalRenderData = renderData;
window.renderData = function (data) {
    window.currentSEOData = data;
    originalRenderData(data);
};
