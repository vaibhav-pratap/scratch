/**
 * Links extractor module
 * Extracts internal/external links and hreflang tags
 */

/**
 * Get all links categorized as internal/external
 */
export function getLinks() {
    const internal = [];
    const external = [];
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
        const href = link.href;
        if (!href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            if (link.hostname === window.location.hostname) {
                internal.push({ text: link.innerText.trim(), href: href });
            } else {
                external.push({ text: link.innerText.trim(), href: href });
            }
        }
    });
    return { internal, external };
}

/**
 * Get hreflang alternate links
 */
export function getHreflangs() {
    return Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(el => ({
        lang: el.getAttribute('hreflang'),
        href: el.getAttribute('href')
    }));
}
