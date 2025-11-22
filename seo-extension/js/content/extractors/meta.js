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
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
        const property = meta.getAttribute('property').replace('og:', '');
        og[property] = meta.getAttribute('content');
    });
    return og;
}

/**
 * Get Twitter Card tags
 */
export function getTwitterTags() {
    const twitter = {};
    document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
        const name = meta.getAttribute('name').replace('twitter:', '');
        twitter[name] = meta.getAttribute('content');
    });
    return twitter;
}
