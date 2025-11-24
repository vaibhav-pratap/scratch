/**
 * Initialization module for popup and sidepanel
 * Handles initial data loading and error states
 */

// Core modules
import { saveToCache, loadFromCache, saveToSession, loadFromSession } from './storage.js';
import { requestSEOData } from './messaging.js';

/**
 * Initialize the popup extension interface
 */
export async function initPopup(renderCallback) {
    try {
        // Popups reliably get the active tab using query
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // STEP 1: Try session storage first (shared with sidepanel, fastest)
        const sessionData = await loadFromSession();
        if (sessionData) {
            console.log('[initPopup] Loaded from session storage');
            renderCallback(sessionData);
            // We still fetch fresh data in background, but UI is ready
        }

        // STEP 2: Try local cache if no session data
        if (!sessionData) {
            const cached = loadFromCache(tab.url);
            if (cached) {
                console.log('[initPopup] Loaded from local cache');
                renderCallback(cached);
            }
        }

        // STEP 3: Optimistic Data Request (Avoid injecting if script is alive)
        console.log('[initPopup] Requesting fresh data...');
        let data = await requestSEOData(tab.id, 1); // 1 attempt only first

        // STEP 4: Inject content script ONLY if request failed
        if (!data) {
            console.log('[initPopup] No response, injecting content script...');
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['js/content-loader.js']
                });
                // Wait a bit for script to initialize
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.warn('[initPopup] Script injection failed (maybe already there?):', e);
            }

            // Retry request after injection
            data = await requestSEOData(tab.id, 3);
        }

        // STEP 5: Handle fresh data
        if (data) {
            console.log('[initPopup] Received fresh data');
            renderCallback(data);
            saveToCache(tab.url, data);
            await saveToSession(data);
        } else if (!sessionData && !loadFromCache(tab.url)) {
            showError("Received empty response from page. Try refreshing.");
        }

    } catch (error) {
        console.error("Init Error:", error);
        showError("An unexpected error occurred: " + error.message);
    }
}

/**
 * Initialize sidepanel with data
 * Uses chrome.sidePanel.getCurrentTabId() for robust active tab detection.
 */
export async function initSidePanel(renderCallback) {
    console.log('[initSidePanel] Starting initialization...');
    let tabId;

    try {
        // FIX: Use getCurrentTabId() for reliable tab detection in Side Panel context
        tabId = await chrome.sidePanel.getCurrentTabId();
    } catch (e) {
        // Fallback if getCurrentTabId is unavailable or fails
        console.warn('[initSidePanel] chrome.sidePanel.getCurrentTabId failed. Falling back to chrome.tabs.query.');
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab ? activeTab.id : null;
    }

    // Main Error Catch (moved the check inside the outer block to ensure all sync failures are caught)
    try {
        if (!tabId) {
            console.warn('[initSidePanel] Could not determine active tab ID.');
            showError("Could not find an active web page tab to analyze.");
            return;
        }

        const tab = await chrome.tabs.get(tabId);
        console.log('[initSidePanel] Target tab:', tab);

        // Check if the tab is a valid web page
        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            console.warn('[initSidePanel] Invalid tab or URL');
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // STEP 1: Try session storage first (shared between popup/sidepanel)
        const sessionData = await loadFromSession();
        if (sessionData) {
            console.log('[initSidePanel] Found data in session storage!');
            renderCallback(sessionData);
            return; // Use session data and exit
        }

        // STEP 2: Try localStorage cache
        const cached = loadFromCache(tab.url);
        console.log('[initSidePanel] Cached data:', cached ? 'found' : 'not found');
        if (cached) {
            console.log('[initSidePanel] Using cached data');
            renderCallback(cached);
        }

        // STEP 3 & 4: Inject content script with robust retry logic and delay
        console.log('[initSidePanel] Injecting content script...');
        let scriptExecuted = false;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['js/content-loader.js']
                });
                scriptExecuted = true;
                console.log('[initSidePanel] Content script injected successfully on attempt', attempt + 1);
                break;
            } catch (e) {
                console.warn('[initSidePanel] Injection attempt', attempt + 1, 'failed:', e.message);
                if (attempt < 4) {
                    const delay = 300 * (attempt + 1); // Increasing delay
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        const initDelay = scriptExecuted ? 1500 : 500;
        console.log('[initSidePanel] Waiting', initDelay, 'ms for content script to initialize...');
        await new Promise(resolve => setTimeout(resolve, initDelay));

        // STEP 5: Request fresh data with retries
        console.log('[initSidePanel] Requesting fresh data...');
        let data = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            data = await requestSEOData(tab.id);
            if (data) {
                console.log('[initSidePanel] Received data on attempt', attempt + 1);
                break;
            }
            console.warn('[initSidePanel] No data on attempt', attempt + 1);
            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('[initSidePanel] Final data:', data ? 'received' : 'none');

        if (data) {
            console.log('[initSidePanel] Calling renderCallback with fresh data');
            renderCallback(data);
            saveToCache(tab.url, data);
            await saveToSession(data);
        } else if (!cached && !sessionData) {
            console.error('[initSidePanel] No data received and no cache/session');
            showError("Couldn't load SEO data. Please try refreshing the page.");
        }

    } catch (error) {
        console.error("[initSidePanel] Error:", error);
        showError("An unexpected error occurred: " + error.message);
    }
}

/**
 * Display an error message to the user
 */
export function showError(msg) {
    console.log('[showError]', msg);

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