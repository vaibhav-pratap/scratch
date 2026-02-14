/**
 * Images extractor module
 * Extracts all images including img, svg, srcset, lazy-loaded, and background images
 */

/**
 * Parse srcset and return the best URL (largest width or first)
 */
function parseSrcset(srcset) {
    if (!srcset) return null;
    const candidates = srcset.split(',').map(entry => {
        const parts = entry.trim().split(/\s+/);
        const url = parts[0];
        const desc = parts[1] || '';
        let width = 0;
        if (desc.endsWith('w')) width = parseInt(desc, 10);
        if (desc.endsWith('x')) width = parseFloat(desc) * 1000; // Rough approx for density
        return { url, width };
    });
    // Sort by width descending and take the best one
    candidates.sort((a, b) => b.width - a.width);
    return candidates[0] ? candidates[0].url : null;
}

/**
 * Convert to Absolute URL
 */
function getAbsoluteUrl(url) {
    if (!url) return null;
    url = url.trim();
    if (url.startsWith('data:')) return url; // Allow data URIs (SVG, base64 images)
    try {
        return new URL(url, document.baseURI).href;
    } catch (e) {
        return null;
    }
}

/**
 * Get all images from the page
 */
export function getImages() {
    const images = [];
    const seenSrcs = new Set();

    // Helper: Add image to list
    const addImage = (src, alt, title, type, element, extraEntries = {}) => {
        const absUrl = getAbsoluteUrl(src);
        if (!absUrl || seenSrcs.has(absUrl)) return;

        // Dimension check (relaxed for lazy/source/draggable/svg)
        const isTiny = (element.width || 0) < 10 && (element.height || 0) < 10;
        const isStandardImg = type === 'img';

        // Only filter standard <img> tags if they are tiny AND have no special attributes
        if (isStandardImg && isTiny && !absUrl.startsWith('data:')) return;

        seenSrcs.add(absUrl);
        
        // Extract loading attribute
        const loading = element.getAttribute('loading') || 'eager';

        images.push({
            src: absUrl,
            alt: alt || '',
            title: title || '',
            type: type,
            width: element.width || 0,
            height: element.height || 0,
            naturalWidth: element.naturalWidth || 0,
            naturalHeight: element.naturalHeight || 0,
            loading: loading,
            // New attributes for detailed analysis
            role: extraEntries.role || null,
            ariaHidden: extraEntries.ariaHidden || null,
            ariaLabel: extraEntries.ariaLabel || null,
            classes: extraEntries.classes || ''
        });
    };

    // Unified Scanner
    const elements = document.querySelectorAll('img, source, svg, [draggable="true"], [style*="background-image"]');

    elements.forEach(el => {
        const tag = el.tagName.toLowerCase();
        let src = null;
        let type = tag;
        let alt = el.getAttribute('alt') || '';
        let title = el.getAttribute('title') || '';

        // Strategy 0: Inline SVG
        if (tag === 'svg') {
            try {
                const serializer = new XMLSerializer();
                const svgString = serializer.serializeToString(el);
                src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
                type = 'svg (inline)';
            } catch (e) {
                // Ignore serialization errors
            }
        }

        // Strategy 1: Check srcset
        if (!src) {
            const srcset = el.getAttribute('srcset') || el.getAttribute('data-srcset');
            if (srcset) {
                src = parseSrcset(srcset);
                type = `${tag} (srcset)`;
            }
        }

        // Strategy 2: Check lazy attributes
        if (!src) {
            const lazyAttrs = ['data-src', 'data-original', 'data-img-url', 'data-lazy', 'data-url', 'data-image'];
            for (const attr of lazyAttrs) {
                if (el.getAttribute(attr)) {
                    src = el.getAttribute(attr);
                    type = `${tag} (lazy)`;
                    break;
                }
            }
        }

        // Strategy 3: Check standard src
        if (!src && el.getAttribute('src')) {
            src = el.getAttribute('src');
            type = tag;
        }

        // Strategy 4: Check background image
        if (!src) {
            const bgStyle = el.style.backgroundImage;
            if (bgStyle && bgStyle.includes('url(')) {
                const match = bgStyle.match(/url\(['"]?(.*?)['"]?\)/);
                if (match && match[1]) src = match[1];
                type = 'css background';
            }
            if (!src) {
                const dataBg = el.getAttribute('data-bg') || el.getAttribute('data-background');
                if (dataBg) {
                    src = dataBg;
                    type = 'data-bg';
                }
            }
        }

        // Special handling for <source> tags
        if (tag === 'source' && !alt) {
            const parentImg = el.parentElement && el.parentElement.querySelector('img');
            if (parentImg) {
                alt = parentImg.alt || '';
                title = parentImg.title || '';
            }
        }

        if (src) {
            // Enhanced attribute extraction
            const role = el.getAttribute('role');
            const ariaHidden = el.getAttribute('aria-hidden');
            const ariaLabel = el.getAttribute('aria-label');
            const classes = el.className || '';

            addImage(src, alt, title, type, el, { role, ariaHidden, ariaLabel, classes });
        }
    });

    return images;
}

