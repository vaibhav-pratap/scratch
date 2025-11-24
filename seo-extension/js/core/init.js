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
    console.log('[initSidePanel] Starting initialization...');
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('[initSidePanel] Active tab:', tab);

        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            console.warn('[initSidePanel] Invalid tab or URL');
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // Try to load cached data first
        const cached = loadFromCache(tab.url);
        console.log('[initSidePanel] Cached data:', cached ? 'found' : 'not found');
        if (cached) {
            console.log('[initSidePanel] Calling renderCallback with cached data');
            // Set global data for cached too
            window.currentSEOData = cached;
            console.log('[initSidePanel] Set window.currentSEOData from cache:', window.currentSEOData);
            renderCallback(cached);
        }

        // Inject content script if needed (with retries for sidepanel)
        let injected = false;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['js/content-loader.js']
                });
                injected = true;
                console.log('[initSidePanel] Content script injected on attempt', attempt + 1);
                break;
            } catch (e) {
                console.warn('[initSidePanel] Injection attempt', attempt + 1, 'failed:', e);
                if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
                }
            }
        }

        // Request fresh data (with extra delay for sidepanel to let content script initialize)
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        console.log('[initSidePanel] Requesting fresh data from tab:', tab.id);
        const data = await requestSEOData(tab.id);
        console.log('[initSidePanel] Received data:', data ? 'yes' : 'no', data);

        if (data) {
            console.log('[initSidePanel] Calling renderCallback with fresh data');
            // CRITICAL: Set global data BEFORE calling callback
            window.currentSEOData = data;
            console.log('[initSidePanel] Set window.currentSEOData:', window.currentSEOData);
            renderCallback(data);
            saveToCache(tab.url, data);
        } else if (!cached) {
            console.error('[initSidePanel] No data received and no cache');
            showError("Received empty response from page.");
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
