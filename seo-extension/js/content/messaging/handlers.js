/**
 * Message handlers module
 * Handles incoming messages from popup/sidepanel
 */

import { toggleLinkHighlight } from '../highlighting/links.js';

/**
 * Setup message listener
 */
export function setupMessageListener(extractDataFn) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getSEOData") {
            sendResponse(extractDataFn());
        } else if (request.action === "toggleNofollow") {
            toggleLinkHighlight('nofollow', request.enabled !== false);
        } else if (request.action === "toggleHighlight") {
            toggleLinkHighlight(request.linkType, request.enabled);
        }
        return true; // Keep channel open for async response
    });
}
