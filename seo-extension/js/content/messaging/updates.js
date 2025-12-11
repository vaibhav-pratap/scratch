/**
 * Messaging module
 * Handles Chrome extension message communication
 */

import { getCWV } from '../performance/cwv.js';

/**
 * Send SEO data update to extension
 */
export function sendUpdate(data) {
    try {
        chrome.runtime.sendMessage({
            action: "seoDataUpdated",
            data: data
        });
    } catch (e) {
        // console.warn('[SEO Analyzer] Failed to send update:', e);
    }
}

/**
 * Send CWV update to extension
 */
export function sendCWVUpdate() {
    try {
        chrome.runtime.sendMessage({
            action: "cwvUpdated",
            cwv: getCWV()
        });
    } catch (e) {
        // console.warn('[SEO Analyzer] Failed to send CWV update:', e);
    }
}
