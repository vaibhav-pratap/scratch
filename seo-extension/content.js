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

    function getEmails() {
        const emails = new Set();

        // 1. Extract from mailto: links
        document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
            const email = link.href.replace('mailto:', '').split('?')[0]; // Remove query params
            if (email) emails.add(email.toLowerCase());
        });

        // 2. Extract from page text using regex
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const pageText = document.body.innerText;
        const matches = pageText.match(emailRegex);
        if (matches) {
            matches.forEach(email => emails.add(email.toLowerCase()));
        }

        // 3. Extract from meta tags
        document.querySelectorAll('meta[content*="@"]').forEach(meta => {
            const content = meta.getAttribute('content');
            const matches = content.match(emailRegex);
            if (matches) {
                matches.forEach(email => emails.add(email.toLowerCase()));
            }
        });

        return Array.from(emails).sort();
    }

    function getPhoneNumbers() {
        const phones = new Set();

        // 1. Extract from tel: links
        document.querySelectorAll('a[href^="tel:"]').forEach(link => {
            const phone = link.href.replace('tel:', '').trim();
            const displayText = link.innerText.trim();
            if (phone) {
                phones.add(JSON.stringify({
                    number: phone,
                    display: displayText || phone
                }));
            }
        });

        // 2. Extract from page text using multiple comprehensive patterns
        const pageText = document.body.innerText;

        // Pattern 1: International format with + and spaces/separators
        // Matches: +49 69 589966180, +1 234 567 8900, +44 20 7946 0958
        const intlPattern = /\+\d{1,3}(?:[\s.-]?\d{2,4}){2,5}/g;
        let matches = pageText.match(intlPattern);
        if (matches) {
            matches.forEach(phone => {
                const digits = phone.replace(/\D/g, '');
                if (digits.length >= 10 && digits.length <= 15) {
                    phones.add(JSON.stringify({ number: phone.trim(), display: phone.trim() }));
                }
            });
        }

        // Pattern 2: US/CA format with parentheses
        // Matches: (234) 567-8900, (234)567-8900
        const parensPattern = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
        matches = pageText.match(parensPattern);
        if (matches) {
            matches.forEach(phone => {
                const digits = phone.replace(/\D/g, '');
                if (digits.length === 10) {
                    phones.add(JSON.stringify({ number: phone.trim(), display: phone.trim() }));
                }
            });
        }

        // Pattern 3: Plain formatted numbers
        // Matches: 234-567-8900, 234.567.8900, 234 567 8900 
        const plainPattern = /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/g;
        matches = pageText.match(plainPattern);
        if (matches) {
            matches.forEach(phone => {
                phones.add(JSON.stringify({ number: phone.trim(), display: phone.trim() }));
            });
        }

        // Convert back from JSON strings to objects
        const uniquePhones = Array.from(phones).map(p => JSON.parse(p));

        // Remove duplicates based on digits only
        const seen = new Set();
        const filtered = uniquePhones.filter(phone => {
            const digits = phone.number.replace(/\D/g, '');
            if (seen.has(digits)) return false;
            seen.add(digits);
            return true;
        });

        console.log(`[SEO Analyzer] Found ${filtered.length} phone numbers`);
        return filtered.slice(0, 50); // Limit to 50
    }

    function getSchema() {
        const schemas = [];

        // Helper: Validate common schema types
        const validateSchema = (type, data) => {
            const issues = [];
            if (!type) return { valid: false, issues: ['Missing @type'] };

            // Normalize type to array if string
            const types = Array.isArray(type) ? type : [type];

            types.forEach(t => {
                if (t === 'Product') {
                    if (!data.name) issues.push('Missing "name"');
                    if (!data.offers && !data.review && !data.aggregateRating) issues.push('Missing "offers", "review", or "aggregateRating"');
                }
                if (t === 'Article' || t === 'NewsArticle' || t === 'BlogPosting') {
                    if (!data.headline && !data.name) issues.push('Missing "headline" or "name"');
                    if (!data.author) issues.push('Missing "author"');
                    if (!data.publisher) issues.push('Missing "publisher"');
                    if (!data.datePublished) issues.push('Missing "datePublished"');
                }
                if (t === 'BreadcrumbList') {
                    if (!data.itemListElement) issues.push('Missing "itemListElement"');
                }
                if (t === 'Organization' || t === 'LocalBusiness') {
                    if (!data.name) issues.push('Missing "name"');
                }
            });

            return {
                valid: issues.length === 0,
                issues: issues
            };
        };

        // Helper: Process JSON-LD item
        const processJsonLdItem = (item, context = '') => {
            if (!item) return;

            // Handle @graph (array of items)
            if (item['@graph'] && Array.isArray(item['@graph'])) {
                item['@graph'].forEach(subItem => processJsonLdItem(subItem, context));
                return;
            }

            const type = item['@type'] || 'Unknown';
            const validation = validateSchema(type, item);
            const details = Array.isArray(type) ? type.join(', ') : type;

            schemas.push({
                type: `JSON-LD (${details})`,
                valid: validation.valid,
                details: validation.valid ? 'Valid Structure' : `Issues: ${validation.issues.join(', ')}`,
                data: item
            });
        };

        // 1. JSON-LD
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        jsonLdScripts.forEach(script => {
            try {
                const json = JSON.parse(script.innerText);
                const context = json['@context'] || '';

                if (Array.isArray(json)) {
                    json.forEach(item => processJsonLdItem(item, context));
                } else {
                    processJsonLdItem(json, context);
                }
            } catch (e) {
                schemas.push({
                    type: 'JSON-LD (Error)',
                    valid: false,
                    details: 'Syntax Error: ' + e.message,
                    data: { raw: script.innerText.substring(0, 500) }
                });
            }
        });

        // 2. Microdata (Recursive extraction)
        const extractMicrodata = (element) => {
            const item = {};
            const type = element.getAttribute('itemtype');
            if (type) item['@type'] = type;

            // Get properties
            const props = element.querySelectorAll('[itemprop]');
            props.forEach(prop => {
                // Only direct children or those not nested in another itemscope
                if (prop.closest('[itemscope]') === element) {
                    const name = prop.getAttribute('itemprop');
                    let value;

                    if (prop.hasAttribute('itemscope')) {
                        value = extractMicrodata(prop); // Recurse
                    } else if (prop.tagName === 'META') {
                        value = prop.getAttribute('content');
                    } else if (prop.tagName === 'IMG') {
                        value = prop.getAttribute('src');
                    } else if (prop.tagName === 'A') {
                        value = prop.getAttribute('href');
                    } else if (prop.tagName === 'TIME') {
                        value = prop.getAttribute('datetime') || prop.innerText;
                    } else {
                        value = prop.innerText.trim();
                    }

                    if (item[name]) {
                        if (!Array.isArray(item[name])) item[name] = [item[name]];
                        item[name].push(value);
                    } else {
                        item[name] = value;
                    }
                }
            });
            return item;
        };

        const microdataItems = document.querySelectorAll('[itemscope]');
        microdataItems.forEach(item => {
            // Only top-level items
            if (!item.parentElement.closest('[itemscope]')) {
                const data = extractMicrodata(item);
                const type = data['@type'] || 'Unknown Microdata';
                schemas.push({
                    type: `Microdata (${type.split('/').pop()})`, // Clean up URL types
                    valid: true, // Basic validation only
                    details: 'Extracted from Microdata attributes',
                    data: data
                });
            }
        });

        // 3. RDFa (Basic detection)
        const rdfaItems = document.querySelectorAll('[vocab], [typeof]');
        rdfaItems.forEach(item => {
            if (!item.parentElement.closest('[vocab], [typeof]')) {
                const type = item.getAttribute('typeof') || item.getAttribute('vocab') || 'Unknown';
                schemas.push({
                    type: `RDFa (${type})`,
                    valid: true,
                    details: 'Detected RDFa container',
                    data: {
                        type: type,
                        html: item.outerHTML.substring(0, 200) + '...'
                    }
                });
            }
        });

        return schemas;
    }

    function getSEOPlugins() {
        const plugins = [];
        const html = document.documentElement.outerHTML;

        // 1. Yoast SEO
        if (html.includes('This site is optimized with the Yoast SEO plugin') || document.querySelector('script[type="application/ld+json"].yoast-schema-graph')) {
            plugins.push('Yoast SEO');
        }

        // 2. RankMath
        if (html.includes('Rank Math') || document.querySelector('meta[name="generator"][content*="Rank Math"]')) {
            plugins.push('RankMath');
        }

        // 3. All in One SEO (AIOSEO)
        if (html.includes('All in One SEO') || document.querySelector('meta[name="generator"][content*="All in One SEO"]')) {
            plugins.push('All in One SEO');
        }

        // 4. SEOPress
        if (html.includes('SEOPress') || document.querySelector('meta[name="generator"][content*="SEOPress"]')) {
            plugins.push('SEOPress');
        }

        // 5. The SEO Framework
        if (html.includes('The SEO Framework')) {
            plugins.push('The SEO Framework');
        }

        // 6. CMS/Platform Detection
        if (document.querySelector('meta[name="generator"][content*="WordPress"]')) plugins.push('WordPress');
        if (html.includes('shopify.com')) plugins.push('Shopify');
        if (html.includes('wix.com')) plugins.push('Wix');
        if (html.includes('squarespace.com')) plugins.push('Squarespace');

        return [...new Set(plugins)]; // Remove duplicates
    }

    function safeExtract(fn, fallback = null) {
        try {
            return fn();
        } catch (e) {
            console.error("Extraction Error:", e);
            return fallback;
        }
    }

    function extractSEOData() {
        return {
            title: document.title,
            description: safeExtract(() => getMetaContent('description')),
            keywords: safeExtract(() => getMetaContent('keywords')),
            canonical: safeExtract(() => document.querySelector('link[rel="canonical"]')?.href),
            robots: safeExtract(() => getMetaContent('robots')),
            headings: safeExtract(getHeadings, []),
            images: safeExtract(getImages, []),
            links: safeExtract(getLinks, { internal: [], external: [] }),
            emails: safeExtract(getEmails, []),
            phones: safeExtract(getPhoneNumbers, []),
            og: safeExtract(getOGTags, {}),
            twitter: safeExtract(getTwitterTags, {}),
            hreflang: safeExtract(getHreflangs, []),
            paa: safeExtract(getPAA, []),
            schema: safeExtract(getSchema, []),
            plugins: safeExtract(getSEOPlugins, []),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
    }

    // Inject CSS styles for link highlighting into the page
    function injectHighlightStyles() {
        if (document.getElementById('seo-analyzer-styles')) return; // Already injected

        const style = document.createElement('style');
        style.id = 'seo-analyzer-styles';
        style.textContent = `
            .seo-highlight-nofollow {
                background-color: rgba(255, 68, 68, 0.2) !important;
                outline: 1px solid rgba(255, 68, 68, 0.5) !important;
            }
            .seo-highlight-follow {
                background-color: rgba(68, 255, 68, 0.2) !important;
                outline: 1px solid rgba(68, 255, 68, 0.5) !important;
            }
            .seo-highlight-external {
                background-color: rgba(68, 68, 255, 0.2) !important;
                outline: 1px solid rgba(68, 68, 255, 0.5) !important;
            }
            .seo-highlight-internal {
                background-color: rgba(255, 221, 68, 0.2) !important;
                outline: 1px solid rgba(255, 221, 68, 0.5) !important;
            }
            .seo-highlight-mailto {
                background-color: rgba(255, 68, 255, 0.2) !important;
                outline: 1px solid rgba(255, 68, 255, 0.5) !important;
            }
            .seo-highlight-tel {
                background-color: rgba(255, 136, 68, 0.2) !important;
                outline: 1px solid rgba(255, 136, 68, 0.5) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Get links by type
    function getLinksByType(type) {
        const currentHost = window.location.hostname;
        const links = document.querySelectorAll('a[href]');
        const filtered = [];

        links.forEach(link => {
            const href = link.href;

            switch (type) {
                case 'nofollow':
                    if (link.rel && link.rel.includes('nofollow')) filtered.push(link);
                    break;
                case 'follow':
                    if (!link.rel || !link.rel.includes('nofollow')) {
                        // Exclude special links
                        if (!href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
                            filtered.push(link);
                        }
                    }
                    break;
                case 'external':
                    try {
                        const url = new URL(href);
                        if (url.hostname !== currentHost && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                            filtered.push(link);
                        }
                    } catch (e) { }
                    break;
                case 'internal':
                    try {
                        const url = new URL(href);
                        if (url.hostname === currentHost) {
                            filtered.push(link);
                        }
                    } catch (e) { }
                    break;
                case 'mailto':
                    if (href.startsWith('mailto:')) filtered.push(link);
                    break;
                case 'tel':
                    if (href.startsWith('tel:')) filtered.push(link);
                    break;
            }
        });

        return filtered;
    }

    // Toggle link highlighting
    function toggleLinkHighlight(type, enabled) {
        const className = `seo-highlight-${type}`;
        const links = getLinksByType(type);

        console.log(`[SEO Analyzer] ${enabled ? 'Enabling' : 'Disabling'} ${type} highlights (${links.length} links)`);

        links.forEach(link => {
            if (enabled) {
                link.classList.add(className);
            } else {
                link.classList.remove(className);
            }
        });
    }

    // Inject styles on page load
    injectHighlightStyles();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getSEOData") {
            const data = extractSEOData();
            sendResponse(data);
            // If extractSEOData were async, we would return true here. 
            // Since it's synchronous, we don't strictly need to, but it doesn't hurt for this specific case if we sendResponse immediately.
            // However, to be safe and consistent:
            return false;
        } else if (request.action === "toggleNofollow") {
            // Legacy support - convert to new format
            toggleLinkHighlight('nofollow', request.enabled !== false);
        } else if (request.action === "toggleHighlight") {
            // New unified toggle action
            toggleLinkHighlight(request.linkType, request.enabled);
        }
        // return true; // REMOVED: This caused the "channel closed" error for sync actions that didn't sendResponse
    });
})();
