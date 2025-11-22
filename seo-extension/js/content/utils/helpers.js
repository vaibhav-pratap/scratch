/**
 * Utilities module
 * Common utility functions
 */

/**
 * Safe extraction with error handling
 */
export function safeExtract(fn, fallback = null) {
    try {
        return fn();
    } catch (e) {
        console.warn('[SEO Analyzer] Extraction Error:', e);
        return fallback;
    }
}

/**
 * Debounce helper
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
