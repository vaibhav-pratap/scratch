/**
 * Extension Bridge
 * Utilities for interacting with the Chrome Extension API
 */

/**
 * Get the current domain from the active tab
 * @returns {Promise<string>} hostname or 'global'
 */
export function getCurrentDomain() {
    return new Promise((resolve) => {
        if (!chrome.tabs) {
            resolve('global');
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    resolve(url.hostname);
                } catch (e) {
                    resolve('global');
                }
            } else {
                resolve('global');
            }
        });
    });
}
