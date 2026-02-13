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
            const linkData = {
                text: link.innerText.trim() || link.textContent.trim(),
                href: href,
                rel: link.getAttribute('rel') || '',
                target: link.getAttribute('target') || '',
                hostname: link.hostname
            };

            if (link.hostname === window.location.hostname) {
                internal.push(linkData);
            } else {
                external.push(linkData);
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
