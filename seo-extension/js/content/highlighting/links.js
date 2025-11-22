/**
 * Link highlighting module
 * Handles toggling highlights for different link types
 */

/**
 * Get links by type
 */
export function getLinksByType(type) {
    const links = [];

    switch (type) {
        case 'nofollow':
            document.querySelectorAll('a[rel*="nofollow"]').forEach(link => links.push(link));
            break;
        case 'follow':
            document.querySelectorAll('a[href]').forEach(link => {
                const rel = link.getAttribute('rel') || '';
                if (!rel.includes('nofollow')) links.push(link);
            });
            break;
        case 'external':
            document.querySelectorAll('a[href]').forEach(link => {
                if (link.hostname && link.hostname !== window.location.hostname &&
                    !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
                    links.push(link);
                }
            });
            break;
        case 'internal':
            document.querySelectorAll('a[href]').forEach(link => {
                if (link.hostname === window.location.hostname) {
                    links.push(link);
                }
            });
            break;
        case 'mailto':
            document.querySelectorAll('a[href^="mailto:"]').forEach(link => links.push(link));
            break;
        case 'tel':
            document.querySelectorAll('a[href^="tel:"]').forEach(link => links.push(link));
            break;
    }

    return links;
}

/**
 * Toggle link highlighting
 */
export function toggleLinkHighlight(type, enabled) {
    const links = getLinksByType(type);
    const className = `seo-highlight-${type}`;

    links.forEach(link => {
        if (enabled) {
            link.classList.add(className);
        } else {
            link.classList.remove(className);
        }
    });
}
