/**
 * Sidepanel Entry Point
 * Imports and initializes all modules for the sidepanel interface
 */

// Core modules
import { initSidePanel } from './core/init.js';
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
import { renderKeywordsPlanner } from './ui/keywords-planner.js';
import { renderKeywordsIdeas } from './ui/keywords-ideas.js';
import { renderProfile } from './ui/profile.js';

// Data modules
import { renderData } from './data/renderer.js';
import { downloadPDF, downloadExcel, downloadJSON, downloadCSV } from './data/exporters.js';

// Utils
import { setupStaticCopyButtons, copyToClipboard } from './utils/clipboard.js';

// Global variable to store the current data for export/copy functionality
window.currentSEOData = null;

// Initialize when DOM is ready
function init() {
    // 0. Render Static Layout (Modular HTML)
    renderStaticLayout();

    // 1. Tab Switching
    initTabSwitching();

    // 2. Theme Toggle
    initThemeToggle();

    // 3. Setup Copy Buttons
    setupStaticCopyButtons();

    // 4. Setup Export Buttons
    setupExportButtons();

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
        console.error('[Sidepanel] Error initializing Keywords Settings:', error);
    }

    // 8. Initialize Keywords Performance
    updateKeywordsPerformance();

    // 9. Initialize Keywords Planner
    const keywordsPlannerContainer = document.getElementById('keywords-planner-container');
    if (keywordsPlannerContainer) {
        renderKeywordsPlanner(keywordsPlannerContainer);
    }

    // 9b. Initialize Keywords Ideas (BigQuery)
    const keywordsIdeasContainer = document.getElementById('keywords-ideas-container');
    if (keywordsIdeasContainer) {
        renderKeywordsIdeas(keywordsIdeasContainer);
    }

    // 10. Setup Ads Transparency
    initAdsTransparency();
    initMetaAds();

    // 11. Setup AI Summary
    initAISummary();

    // 12. Setup AI Insights
    try {
        initAIInsights();
    } catch (error) {
        console.error('[Sidepanel] Error initializing AI Insights:', error);
    }

    // 13. Setup AI Analysis Tab
    try {
        initAIAnalysisTab().catch(error => {
            console.error('[Sidepanel] Error initializing AI Analysis:', error);
        });
    } catch (error) {
        console.error('[Sidepanel] Error calling initAIAnalysisTab:', error);
    }

    // 14. Initialize Data Fetching
    initSidePanel((data) => {
        console.log('[Sidepanel Callback] Received initial data:', data ? 'YES' : 'NO');
        window.currentSEOData = data;
        renderData(data);
    });

    // 15. Real-time Updates Listener
    listenForUpdates(data => {
        window.currentSEOData = data;
        renderData(data);
    }, renderCWVChart);

    // 16. Listen for tab switching and navigation changes
    const handleTabChange = () => {
        initSidePanel((data) => {
            window.currentSEOData = data;
            renderData(data);
        });
        updateKeywordsPerformance();
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

    // 17. Profile Button Listener
    document.getElementById('btn-profile')?.addEventListener('click', () => {
        switchToTab('profile');
    });

    // 18. Custom Tab Switch Listener
    document.addEventListener('switch-tab', (e) => {
        if (e.detail && e.detail.tab) {
            switchToTab(e.detail.tab);
        }
    });

    // 19. Profile Tab Activation Listener
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
    const btnDownload = document.getElementById('btn-download');
    const btnDownloadCsv = document.getElementById('btn-download-csv');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    const btnCopy = document.getElementById('btn-copy');

    console.log('Setting up export buttons:', { btnDownload, btnDownloadCsv, btnDownloadPdf, btnCopy });

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

    if (btnDownloadCsv) {
        btnDownloadCsv.addEventListener('click', () => {
            console.log('Download CSV clicked');
            const data = window.currentSEOData;
            if (data) {
                downloadExcel(data);
            } else {
                console.warn('No data available for export (CSV)');
            }
        });
    }

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