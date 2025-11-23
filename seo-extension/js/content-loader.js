/**
 * Content Script Loader
 * Dynamically imports the modular content script to support ES modules
 */
(async () => {
    try {
        const src = chrome.runtime.getURL('js/content.js');
        await import(src);
    } catch (e) {
        console.error('[SEO Analyzer] Failed to load modular content script:', e);
    }
})();
