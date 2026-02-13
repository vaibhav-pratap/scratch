/**
 * Sidepanel Entry Point
 * Imports and initializes all modules for the sidepanel interface
 */

// Core modules
import { initSidePanel } from './core/init.js';
import { subscribeToChanges } from './core/db.js';
import { listenForUpdates } from './core/messaging.js';

// UI modules
import { renderStaticLayout } from './ui/layout.js';
import { initTabSwitching, switchToTab } from './ui/tabs.js';
import { initThemeToggle } from './ui/theme.js';
import { setupHighlightToggles, setupSidePanelToggle } from './ui/toggles.js';
import { renderCWVChart } from './ui/charts.js';
import { initAISettings } from './ui/ai-settings.js'; // Unified AI settings (Gemini + OpenAI + Grok)
import { initAISummary } from './ui/ai-summary.js';
import { initAIInsights } from './ui/ai-insights.js';
import { initAIAnalysisTab } from './data/renderers/ai-analysis.js';
import { initAdsTransparency, initMetaAds } from './ui/ads-transparency.js';
import { renderKeywordsSettings } from './ui/keywords-settings.js';
import { renderKeywordsPerformance } from './data/renderers/keywords-performance.js';
import { renderProfile } from './ui/profile.js';
import { renderNotes } from './ui/notes/index.js';
import { initMenu } from './ui/menu.js';

// Data modules
// Data modules
import { renderData, updateCWVMetrics } from './data/renderer.js';
import { downloadPDF, downloadExcel, downloadJSON, downloadCSV } from './data/exporters.js';


// Utils
import { setupStaticCopyButtons, copyToClipboard } from './utils/clipboard.js';

// Expose to global for HTML onclick handlers
window.copyToClipboard = copyToClipboard;

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

    // 6. Setup AI Settings (Gemini, OpenAI, Grok)
    initAISettings();

    // 6b. Setup New Menu
    initMenu();

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
    }, (cwv) => {
        renderCWVChart(cwv);
        updateCWVMetrics(cwv);
    });

    // 16. Listen for tab switching and navigation changes
    const handleTabChange = () => {
        window.currentSEOData = null; // Flush stale data

        // Refresh Notes if tab is active
        const notesTabContent = document.getElementById('notes');
        if (notesTabContent && notesTabContent.classList.contains('active')) {
            const container = document.getElementById('notes-container');
            if (container) renderNotes(container);
        }



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

    // 17b. Notes Button Listener
    document.getElementById('btn-notes-footer')?.addEventListener('click', () => {
        switchToTab('notes');
        const appFooter = document.querySelector('.app-footer');
        if (appFooter) appFooter.style.display = 'none';
    });

    // 17c. Chat Button Listener


    // 18. Custom Tab Switch Listener
    document.addEventListener('switch-tab', (e) => {
        if (e.detail && e.detail.tab) {
            switchToTab(e.detail.tab);
        }
    });

    // 18b. Handle Active Tab Content Rendering
    document.addEventListener('tabActivated', (e) => {
        const tabId = e.detail.tabId;

        // Manage Footer Visibility
        const appFooter = document.querySelector('.app-footer');
        if (appFooter) {
            if (tabId === 'notes') {
                appFooter.style.display = 'none';
            } else {
                appFooter.style.display = 'flex';
            }
        }

        // Trigger Content Renders
        if (tabId === 'notes') {
            const container = document.getElementById('notes-container');
            if (container) renderNotes(container);
        } else if (tabId === 'profile') {
            const container = document.getElementById('profile-container');
            if (container) renderProfile(container);
        }
    });

    // 19. Profile Tab Activation Listener
    const profileTabBtn = document.querySelector('.tab-btn[data-tab="profile"]');
    if (profileTabBtn) {
        profileTabBtn.addEventListener('click', () => {
            const container = document.getElementById('profile-container');
            if (container) renderProfile(container);
        });
    }

    // 20. App Footer Visibility & State Persistence
    const tabButtons = document.querySelectorAll('.tab-btn');
    const appFooter = document.querySelector('.app-footer');

    // Handle tab clicks
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;

            // Save state
            chrome.storage.local.set({ activeTab: tabName });

            // Manage Footer Visibility
            if (appFooter) {
                if (tabName === 'notes') {
                    appFooter.style.display = 'none';
                } else {
                    appFooter.style.display = 'flex';
                }
            }
        });
    });

    // Restore State on Load
    chrome.storage.local.get(['activeTab'], (result) => {
        const savedTab = result.activeTab || 'home';
        if (savedTab !== 'home') {
            switchToTab(savedTab);

            // Trigger specific renders if needed
            if (savedTab === 'notes') {
                const container = document.getElementById('notes-container');
                if (container) renderNotes(container);
            } else if (savedTab === 'profile') {
                const container = document.getElementById('profile-container');
                if (container) renderProfile(container);
            }
        }

        // Set initial footer state
        if (appFooter) {
            if (savedTab === 'notes') {
                appFooter.style.display = 'none';
            } else {
                appFooter.style.display = 'flex';
            }
        }
    });

    // Listen for category changes from other modules (e.g. scratchpad)
    document.addEventListener('categoriesUpdated', async () => {
        await refreshCategories();
    });

    // 21. Setup PouchDB Reactivity
    subscribeToChanges((change) => {
        if (!change.doc) return;
        const type = change.doc.type;

        // Refresh Notes/Todos UI if active and relevant
        if (type === 'note' || type === 'todo' || type === 'category') {
            const notesTabContent = document.getElementById('notes');
            if (notesTabContent && notesTabContent.classList.contains('active')) {
                const container = document.getElementById('notes-container');

                // Smart Re-render: Don't blow away DOM if user is typing in a note
                // This prevents focus loss and flickering during autosave
                if (type === 'note') {
                    const activeEl = document.activeElement;
                    if (activeEl && activeEl.classList.contains('note-content')) {
                        console.log('[Sidepanel] Skipping re-render due to active editing');
                        return;
                    }
                }

                if (container) {
                    renderNotes(container);
                }
            }
        }
    });

} // End of init()

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