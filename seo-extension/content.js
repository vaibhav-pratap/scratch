// content.js - SEO Data Extractor

(function () {
    function getMetaContent(name) {
        const element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
        return element ? element.getAttribute('content') : null;
    }

    function getHeadings() {
        const headings = [];
        const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach(header => {
            headings.push({
                tag: header.tagName.toLowerCase(),
                text: header.innerText.trim().substring(0, 100) // Truncate for display
            });
        });
        return headings;
    }

    function getImages() {
        const images = [];
        const seenSrcs = new Set();

        // Helper: Parse srcset and return the best URL (largest width or first)
        const parseSrcset = (srcset) => {
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
        };

        // Helper: Convert to Absolute URL
        const getAbsoluteUrl = (url) => {
            if (!url) return null;
            url = url.trim();
            if (url.startsWith('data:')) return url; // Allow data URIs (SVG, base64 images)
            try {
                return new URL(url, document.baseURI).href;
            } catch (e) {
                return null;
            }
        };

        // Helper: Add image to list
        const addImage = (src, alt, type, element) => {
            const absUrl = getAbsoluteUrl(src);
            if (!absUrl || seenSrcs.has(absUrl)) return;

            // Dimension check (relaxed for lazy/source/draggable/svg)
            const isTiny = (element.width || 0) < 10 && (element.height || 0) < 10;
            const isStandardImg = type === 'img';

            // Only filter standard <img> tags if they are tiny AND have no special attributes
            // SVGs and Data URIs are often small icons, so we allow them
            if (isStandardImg && isTiny && !absUrl.startsWith('data:')) return;

            seenSrcs.add(absUrl);
            images.push({
                src: absUrl,
                alt: alt || '',
                type: type,
                width: element.width || 0,
                height: element.height || 0
            });
        };

        // Unified Scanner
        // 1. Select ALL potential image elements including SVG
        const elements = document.querySelectorAll('img, source, svg, [draggable="true"], [style*="background-image"]');

        elements.forEach(el => {
            const tag = el.tagName.toLowerCase();
            let src = null;
            let type = tag;
            let alt = el.getAttribute('alt') || el.getAttribute('title') || '';

            // Strategy 0: Inline SVG
            if (tag === 'svg') {
                try {
                    const serializer = new XMLSerializer();
                    const svgString = serializer.serializeToString(el);
                    // Convert to base64 data URI
                    src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
                    type = 'svg (inline)';
                } catch (e) {
                    // Ignore serialization errors
                }
            }

            // Strategy 1: Check srcset (highest priority for quality)
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

            // Strategy 4: Check background image (style or attribute)
            if (!src) {
                const bgStyle = el.style.backgroundImage;
                if (bgStyle && bgStyle.includes('url(')) {
                    const match = bgStyle.match(/url\(['"]?(.*?)['"]?\)/);
                    if (match && match[1]) src = match[1];
                    type = 'css background';
                }
                // Fallback for data-bg
                if (!src) {
                    const dataBg = el.getAttribute('data-bg') || el.getAttribute('data-background');
                    if (dataBg) {
                        src = dataBg;
                        type = 'data-bg';
                    }
                }
            }

            // Special handling for <source> tags: try to find parent <picture> <img> for alt text
            if (tag === 'source' && !alt) {
                const parentImg = el.parentElement && el.parentElement.querySelector('img');
                if (parentImg) alt = parentImg.alt;
            }

            if (src) {
                addImage(src, alt, type, el);
            }
        });

        return images;
    }

    function getOGTags() {
        const og = {};
        const metas = document.querySelectorAll('meta[property^="og:"]');
        metas.forEach(meta => {
            og[meta.getAttribute('property')] = meta.getAttribute('content');
        });
        return og;
    }

    function getTwitterTags() {
        const twitter = {};
        const metas = document.querySelectorAll('meta[name^="twitter:"]');
        metas.forEach(meta => {
            twitter[meta.getAttribute('name')] = meta.getAttribute('content');
        });
        return twitter;
    }

    function getLinks() {
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

    function getHreflangs() {
        return Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(el => ({
            lang: el.getAttribute('hreflang'),
            href: el.getAttribute('href')
        }));
    }

    function getPAA() {
        if (!window.location.hostname.includes('google')) return [];

        const questions = [];
        // Common selector for PAA questions in Google SERP
        const elements = document.querySelectorAll('.related-question-pair .v7jaNc, .related-question-pair .CSkcDe, .related-question-pair .wQiwMc');
        elements.forEach(el => {
            if (el.innerText) questions.push(el.innerText);
        });
        return questions;
    }

    function extractSEOData() {
        return {
            title: document.title,
            description: getMetaContent('description'),
            keywords: getMetaContent('keywords'),
            canonical: document.querySelector('link[rel="canonical"]')?.href || null,
            robots: getMetaContent('robots'),
            headings: getHeadings(),
            images: getImages(),
            links: getLinks(),
            og: getOGTags(),
            twitter: getTwitterTags(),
            hreflang: getHreflangs(),
            paa: getPAA(),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getSEOData") {
            const data = extractSEOData();
            sendResponse(data);
        } else if (request.action === "toggleNofollow") {
            const nofollowLinks = document.querySelectorAll('a[rel~="nofollow"]');
            nofollowLinks.forEach(link => {
                link.classList.toggle('seo-highlight-nofollow');
            });
        }
        return true; // Keep channel open
    });
})();
