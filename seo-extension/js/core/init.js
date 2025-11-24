/**
 * Initialization module for popup and sidepanel
 * Handles initial data loading and error states
 */

import { saveToCache, loadFromCache } from './storage.js';
import { requestSEOData, listenForUpdates } from './messaging.js';

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
        } else if (!cached) {
            showError("Received empty response from page.");
        }

    } catch (error) {
        console.error("Init Error:", error);
        showError("An unexpected error occurred: " + error.message);
    }
}

/**
 * Initialize the sidepanel extension interface
 */
export async function initSidePanel(renderCallback) {
    // Same as popup init (could be unified if needed)
    return initPopup(renderCallback);
}

/**
 * Display an error message to the user
 */
/**
 * Display an error message to the user
 */
export function showError(msg) {
    const container = document.getElementById('suggestions-list') || document.getElementById('suggestions-container');
    if (container) {
        container.innerHTML = `<div class="suggestion-item error">${msg}</div>`;
        // Ensure parent is visible if it was hidden
        const parent = container.closest('.tab-content');
        if (parent) parent.style.display = 'block';
    } else {
        // Fallback if UI is completely broken
        document.body.innerHTML = `<div style="padding: 20px; color: red;">Error: ${msg}</div>`;
    }
}
