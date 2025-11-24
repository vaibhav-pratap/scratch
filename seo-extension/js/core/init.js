/**
 * Initialization module for popup and sidepanel
 * Handles initial data loading and error states
 */

import { saveToCache, loadFromCache } from './storage.js';
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
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // Try to load cached data first
        const cached = loadFromCache(tab.url);
        if (cached) {
            window.currentSEOData = cached;
            renderCallback(cached);
        }

        // Inject content script if needed (with retries for sidepanel)
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['js/content-loader.js']
                });
                break;
            } catch (e) {
                if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        // Request fresh data (with delay for content script initialization)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const data = await requestSEOData(tab.id);

        if (data) {
            window.currentSEOData = data;
            renderCallback(data);
            saveToCache(tab.url, data);
        } else if (!cached) {
            showError("Received empty response from page.");
        }

    } catch (error) {
        console.error("[initSidePanel] Error:", error);
        showError("An unexpected error occurred: " + error.message);
    }
} else {
    // Fallback if UI is completely broken
    document.body.innerHTML = `<div style="padding: 20px; color: red; text-align: center; margin-top: 50px; font-size: 16px;">Error: ${msg}</div>`;
}
}
