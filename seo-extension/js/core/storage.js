/**
 * Storage module for caching SEO data
 */

const CACHE_KEY_PREFIX = 'seo_cache_';
const SESSION_KEY = 'current_seo_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Save data to localStorage cache
 */
export function saveToCache(url, data) {
    if (!url || !data) return;
    const key = CACHE_KEY_PREFIX + url;
    const cacheEntry = {
        data: data,
        timestamp: Date.now()
    };
    try {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        console.log('[Storage] Saved to localStorage cache:', url);
    } catch (e) {
        console.warn('[Storage] Failed to save to localStorage:', e);
    }
}

/**
 * Load data from localStorage cache
 */
export function loadFromCache(url) {
    if (!url) return null;
    const key = CACHE_KEY_PREFIX + url;
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const cacheEntry = JSON.parse(item);
        const age = Date.now() - cacheEntry.timestamp;

        if (age < CACHE_DURATION) {
            console.log('[Storage] Loaded from localStorage cache:', url);
            return cacheEntry.data;
        } else {
            console.log('[Storage] Cache expired for:', url);
            localStorage.removeItem(key);
            return null;
        }
    } catch (e) {
        console.warn('[Storage] Failed to load from localStorage:', e);
        return null;
    }
}

/**
 * Save current SEO data to chrome.storage.session for sharing between popup/sidepanel
 */
export async function saveToSession(data) {
    try {
        await chrome.storage.session.set({ [SESSION_KEY]: data });
        console.log('[Storage] Saved to session storage');
        return true;
    } catch (e) {
        console.warn('[Storage] Failed to save to session:', e);
        return false;
    }
}

/**
 * Load current SEO data from chrome.storage.session
 */
export async function loadFromSession() {
    try {
        const result = await chrome.storage.session.get([SESSION_KEY]);
        if (result[SESSION_KEY]) {
            console.log('[Storage] Loaded from session storage');
            return result[SESSION_KEY];
        }
        return null;
    } catch (e) {
        console.warn('[Storage] Failed to load from session:', e);
        return null;
    }
}

/**
 * Clear session storage
 */
export async function clearSession() {
    try {
        await chrome.storage.session.remove([SESSION_KEY]);
        console.log('[Storage] Cleared session storage');
    } catch (e) {
        console.warn('[Storage] Failed to clear session:', e);
    }
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
