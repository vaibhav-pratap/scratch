/**
 * Image Highlighting Module
 * Highlights images on the page
 */

/**
 * Highlight a specific image on the page
 */
export function highlightImage(imgSrc) {
    // Clear any existing highlights
    clearImageHighlights();

    // Normalize the source URL
    const normalizedSrc = makeAbsoluteUrl(imgSrc);

    // Find all potential image elements
    const allElements = document.querySelectorAll('img, source, svg, [style*="background"]');

    let foundImage = null;

    for (const el of allElements) {
        const sources = [];

        // Collect all possible sources for this element
        if (el.tagName.toLowerCase() === 'img') {
            if (el.src) sources.push(el.src);
            if (el.getAttribute('src')) sources.push(makeAbsoluteUrl(el.getAttribute('src')));
            if (el.currentSrc) sources.push(el.currentSrc);
            if (el.getAttribute('data-src')) sources.push(makeAbsoluteUrl(el.getAttribute('data-src')));
            if (el.getAttribute('data-original')) sources.push(makeAbsoluteUrl(el.getAttribute('data-original')));

            // Check srcset
            const srcset = el.srcset || el.getAttribute('srcset');
            if (srcset) {
                srcset.split(',').forEach(entry => {
                    const url = entry.trim().split(/\s+/)[0];
                    if (url) sources.push(makeAbsoluteUrl(url));
                });
            }
        } else if (el.tagName.toLowerCase() === 'source') {
            if (el.src) sources.push(el.src);
            if (el.getAttribute('src')) sources.push(makeAbsoluteUrl(el.getAttribute('src')));
            if (el.srcset) sources.push(el.srcset);
        } else if (el.tagName.toLowerCase() === 'svg') {
            // For inline SVGs, check if the data URI matches
            if (imgSrc.includes('data:image/svg+xml')) {
                foundImage = el;
                break;
            }
        } else {
            // Check background image
            const bgStyle = window.getComputedStyle(el).backgroundImage;
            if (bgStyle && bgStyle !== 'none') {
                const matches = bgStyle.matchAll(/url\(['"]?(.*?)['"]?\)/g);
                for (const match of matches) {
                    if (match[1]) sources.push(makeAbsoluteUrl(match[1]));
                }
            }
        }

        // Check if any source matches
        for (const source of sources) {
            if (source && (
                source === imgSrc ||
                source === normalizedSrc ||
                makeAbsoluteUrl(source) === normalizedSrc ||
                makeAbsoluteUrl(source) === imgSrc
            )) {
                foundImage = el;
                break;
            }
        }

        if (foundImage) break;
    }

    if (foundImage) {
        // Toggle behavior: if already highlighted, remove it
        if (foundImage.classList.contains('seo-ext-highlight-image')) {
            foundImage.classList.remove('seo-ext-highlight-image');
            return false; // Toggled OFF
        }

        // Add highlight class
        foundImage.classList.add('seo-ext-highlight-image');

        // Scroll into view
        foundImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true; // Toggled ON
    }
    return false;
}

/**
 * Clear all image highlights
 */
export function clearImageHighlights() {
    document.querySelectorAll('.seo-ext-highlight-image').forEach(el => {
        el.classList.remove('seo-ext-highlight-image');
    });
}

/**
 * Make URL absolute
 */
function makeAbsoluteUrl(url) {
    if (!url) return null;
    try {
        return new URL(url, document.baseURI).href;
    } catch (e) {
        return url;
    }
}
