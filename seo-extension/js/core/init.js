import { saveToCache, loadFromCache, saveToSession, loadFromSession, getSettings, saveSettings } from './storage.js';
import { requestSEOData } from './messaging.js';
import { initDatabase } from './db.js';

/**
 * Initialize the popup extension interface
 */
export async function initPopup(renderCallback) {
    try {
        await initDatabase();

        // Popups reliably get the active tab using query
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // STEP 1: Try session storage first (shared with sidepanel, fastest)
        const sessionData = await loadFromSession();
        if (sessionData) {
            renderCallback(sessionData);
            // We still fetch fresh data in background, but UI is ready
        }

        // STEP 2: Try local cache if no session data
        if (!sessionData) {
            const cached = loadFromCache(tab.url);
            if (cached) {
                renderCallback(cached);
            }
        }

        // STEP 3: Optimistic Data Request (Avoid injecting if script is alive)
        let data = await requestSEOData(tab.id, 1); // 1 attempt only first

        // STEP 4: Inject content script ONLY if request failed
        if (!data) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['js/content-loader.js']
                });
                // Wait a bit for script to initialize
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                // Script injection failed (maybe already there?)
            }

            // Retry request after injection
            data = await requestSEOData(tab.id, 3);
        }

        // STEP 5: Handle fresh data
        if (data) {
            renderCallback(data);
            saveToCache(tab.url, data);
            await saveToSession(data);
        } else if (!sessionData && !loadFromCache(tab.url)) {
            showError("Received empty response from page. Try refreshing.");
        }

    } catch (error) {
        showError("An unexpected error occurred: " + error.message);
    }
}

/**
 * Initialize sidepanel with data - OPTIMIZED for fast tab switching
 * Uses chrome.sidePanel.getCurrentTabId() for robust active tab detection.
 */
export async function initSidePanel(renderCallback) {
    await initDatabase();

    let tabId;

    try {
        // FIX: Use getCurrentTabId() for reliable tab detection in Side Panel context
        tabId = await chrome.sidePanel.getCurrentTabId();
    } catch (e) {
        // Fallback if getCurrentTabId is unavailable or fails
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab ? activeTab.id : null;
    }

    // Main Error Catch
    try {
        if (!tabId) {
            showError("Could not find an active web page tab to analyze.");
            return;
        }

        const tab = await chrome.tabs.get(tabId);

        // Check if the tab is a valid web page
        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // STEP 1: Show cached data IMMEDIATELY (faster UX)
        const cached = loadFromCache(tab.url);
        if (cached) {
            renderCallback(cached);
            // Continue to fetch fresh data in background
        }

        // STEP 2: Request fresh data with minimal delay
        let data = await requestSEOData(tabId, 2); // Only 2 attempts for speed

        // STEP 3: Inject content script ONLY if no response
        if (!data) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['js/content-loader.js']
                });

                // Shorter wait time for better performance
                await new Promise(resolve => setTimeout(resolve, 300));

                // Retry request after injection
                data = await requestSEOData(tab.id, 2);
            } catch (e) {
                // Silently fail or log debug only if needed
            }
        }

        if (data) {
            renderCallback(data);
            saveToCache(tab.url, data);
            await saveToSession(data);
        } else if (!cached) {
            showError("Couldn't load SEO data. Please try refreshing the page.");
        }

    } catch (error) {
        showError("An unexpected error occurred: " + error.message);
    }
}

/**
 * Display an error message to the user
 */
export function showError(msg) {
    // Try to switch to overview tab
    const overviewTab = document.querySelector('[data-tab="overview"]');
    const overviewContent = document.getElementById('overview');
    if (overviewTab && overviewContent) {
        // Activate overview tab
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        overviewTab.classList.add('active');
        overviewContent.classList.add('active');
    }

    const container = document.getElementById('suggestions-list') || document.getElementById('suggestions-container');
    if (container) {
        container.innerHTML = `<div class="suggestion-item error" style="font-size: 14px; padding: 20px;">${msg}</div>`;
        // Ensure parent is visible if it was hidden
        const parent = container.closest('.tab-content');
        if (parent) parent.style.display = 'block';
    } else {
        // Fallback if UI is completely broken
        document.body.innerHTML = `<div style="padding: 20px; color: red; text-align: center; margin-top: 50px; font-size: 16px;">Error: ${msg}</div>`;
    }
}