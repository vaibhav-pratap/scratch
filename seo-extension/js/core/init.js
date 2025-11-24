/**
 * Initialization module for popup and sidepanel
 * Handles initial data loading and error states
 */

import { saveToCache, loadFromCache, saveToSession } from './storage.js';
import { requestSEOData } from './messaging.js';

/**
 * Initialize the popup extension interface
 */
export async function initPopup(renderCallback) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // Try to load cached data first for instant render
        const cached = loadFromCache(tab.url);
        if (cached) {
            renderCallback(cached);
        }

        // Inject content script if needed (robustness)
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['js/content-loader.js']
            });
        } catch (e) {
            // Script might already be there, ignore
        }

        // Request fresh data
        const data = await requestSEOData(tab.id);
        if (data) {
            renderCallback(data);
            saveToCache(tab.url, data);
            // Save to session storage for sidepanel
            await saveToSession(data);
        } else if (!cached) {
            showError("Received empty response from page.");
        }

    } catch (error) {
        console.error("Init Error:", error);
        showError("An unexpected error occurred: " + error.message);
    }
}

/**
 * Initialize sidepanel with data
 */
export async function initSidePanel(renderCallback) {
    console.log('[initSidePanel] Starting initialization...');
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('[initSidePanel] Active tab:', tab);

        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            console.warn('[initSidePanel] Invalid tab or URL');
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // STEP 1: Try session storage first (shared between popup/sidepanel)
        const { loadFromSession } = await import('./storage.js');
        const sessionData = await loadFromSession();
        if (sessionData) {
            console.log('[initSidePanel] Found data in session storage!');
            window.currentSEOData = sessionData;
            console.log('[initSidePanel] Set window.currentSEOData from session:', window.currentSEOData);
            renderCallback(sessionData);
            return; // Use session data if available
        }

        // STEP 2: Try localStorage cache
        const cached = loadFromCache(tab.url);
        console.log('[initSidePanel] Cached data:', cached ? 'found' : 'not found');
        if (cached) {
            console.log('[initSidePanel] Using cached data');
            window.currentSEOData = cached;
            console.log('[initSidePanel] Set window.currentSEOData from cache:', window.currentSEOData);
            renderCallback(cached);
        }

        // STEP 3: Inject content script with robust retry logic
        console.log('[initSidePanel] Injecting content script...');
        let scripExecuted = false;
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
                    console.log('[initSidePanel] Waiting', delay, 'ms before retry...');
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // STEP 4: Wait for content script to initialize
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
            window.currentSEOData = data;
            console.log('[initSidePanel] Set window.currentSEOData:', window.currentSEOData);
            renderCallback(data);
            saveToCache(tab.url, data);

            // Save to session storage for sharing
            const { saveToSession } = await import('./storage.js');
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
