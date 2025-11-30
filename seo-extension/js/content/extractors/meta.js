/**
 * Meta extractor module
 * Extracts meta tags, Open Graph, and Twitter Card data
 */

/**
 * Get meta content by name or property
 */
export function getMetaContent(name) {
    const element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
    return element ? element.getAttribute('content') : null;
}

/**
 * Get Open Graph tags
 */
export function getOGTags() {
    const og = {};
    // Query both property and name attributes for maximum compatibility
    const selectors = [
        'meta[property^="og:"]',
        'meta[name^="og:"]'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(meta => {
        const prop = meta.getAttribute('property') || meta.getAttribute('name');
        const property = prop.replace(/^og:/, '');
        const content = meta.getAttribute('content');

        if (property && content) {
            og[property] = content;
        }
    });
    return og;
}

/**
 * Get Twitter Card tags
 */
export function getTwitterTags() {
    const twitter = {};
    // Query both name and property attributes (some sites use property for twitter tags)
    const selectors = [
        'meta[name^="twitter:"]',
        'meta[property^="twitter:"]'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(meta => {
        const nameAttr = meta.getAttribute('name') || meta.getAttribute('property');
        const name = nameAttr.replace(/^twitter:/, '');
        const content = meta.getAttribute('content');

        if (name && content) {
            twitter[name] = content;
        }
    });
    return twitter;
}

/**
 * Get Favicon URL
 */
export function getFavicon() {
    const selectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.href) {
            return element.href;
        }
    }
    return '/favicon.ico'; // Default fallback
}
