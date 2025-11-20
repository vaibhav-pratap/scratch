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
        const imgs = document.querySelectorAll('img');
        imgs.forEach(img => {
            if (img.src && img.width > 10 && img.height > 10) { // Filter out tiny icons/pixels
                images.push({
                    src: img.src,
                    alt: img.alt || '',
                    width: img.width,
                    height: img.height
                });
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
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getSEOData") {
            const data = extractSEOData();
            sendResponse(data);
        }
        return true; // Keep channel open
    });
})();
