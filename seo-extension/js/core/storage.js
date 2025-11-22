/**
 * Storage module for caching and settings management
 * Handles both localStorage and chrome.storage
 */

/**
 * Save SEO data to local cache
 */
export function saveToCache(url, data) {
    const cacheKey = `seo_data_${url}`;
    try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to cache data', e);
    }
}

/**
 * Load SEO data from local cache
 */
export function loadFromCache(url) {
    const cacheKey = `seo_data_${url}`;
    const savedData = localStorage.getItem(cacheKey);
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (e) {
            console.warn('Failed to parse cached data', e);
            return null;
        }
    }
    return null;
}

/**
 * Get settings from chrome.storage.local
 */
export async function getSettings(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
            resolve(result);
        });
    });
}

/**
 * Save settings to chrome.storage.local
 */
export async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.local.set(settings, () => {
            resolve();
        });
    });
}

/**
 * Save theme preference
 */
export function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

/**
 * Get saved theme preference
 */
export function getTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}
