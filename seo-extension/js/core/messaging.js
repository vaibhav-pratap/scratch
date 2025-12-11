/**
 * Messaging module for Chrome extension communication
 * Handles communication between popup/sidepanel and content script
 */

/**
 * Send a message to a specific tab
 */
export function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Request SEO data from content script
 */
/**
 * Request SEO data from content script with retries
 */
export async function requestSEOData(tabId, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await sendMessageToTab(tabId, { action: "getSEOData" });
            if (response) return response;
        } catch (error) {
            // console.warn(`Attempt ${i + 1} failed:`, error.message); // Silenced to reduce noise
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
            }
        }
    }
    return null;
}

/**
 * Listen for real-time updates from content script
 */
export function listenForUpdates(onDataUpdate, onCWVUpdate) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "seoDataUpdated") {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && sender.tab && tabs[0].id === sender.tab.id) {
                    onDataUpdate(request.data);
                }
            });
        } else if (request.action === "cwvUpdated") {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && sender.tab && tabs[0].id === sender.tab.id) {
                    onCWVUpdate(request.cwv);
                }
            });
        }
    });
}

/**
 * Send highlight toggle message to content script
 */
export async function sendToggleMessage(linkType, enabled) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "toggleHighlight",
            linkType,
            enabled
        });
    }
}
