/**
 * Enhanced Modular Content Script Entry Point
 * Coordinates all content.js modules with full CWV and highlighting support
 */

// Import extractors
import { getMetaContent, getOGTags, getTwitterTags } from './extractors/meta.js';
import { getHeadings } from './extractors/headings.js';
import { getImages } from './extractors/images.js';
import { getLinks, getHreflangs } from './extractors/links.js';
import { getEmails, getPhoneNumbers } from './extractors/contact.js';
import { getSchema } from './extractors/schema.js';
import { getSEOPlugins } from './extractors/plugins.js';
import { getPAA } from './extractors/paa.js';

// Import performance
import { calculateReadability } from './performance/readability.js';
import { initCWV, getCWV, onCWVUpdate } from './performance/cwv.js';

// Import highlighting
import { injectHighlightStyles } from './highlighting/styles.js';
import { toggleLinkHighlight } from './highlighting/links.js';

// Import messaging
import { sendUpdate, sendCWVUpdate } from './messaging/updates.js';
import { setupMessageListener } from './messaging/handlers.js';

// Import utils
import { safeExtract, debounce } from './utils/helpers.js';

/**
 * Extract all SEO data from the page
 */
function extractSEOData() {
    return {
        url: window.location.href,
        title: document.title,
        description: safeExtract(() => getMetaContent('description')),
        keywords: safeExtract(() => getMetaContent('keywords')),
        canonical: safeExtract(() => document.querySelector('link[rel="canonical"]')?.href),
        robots: safeExtract(() => getMetaContent('robots')),
        og: safeExtract(() => getOGTags(), {}),
        twitter: safeExtract(() => getTwitterTags(), {}),
        headings: safeExtract(() => getHeadings(), []),
        images: safeExtract(() => getImages(), []),
        links: safeExtract(() => getLinks(), { internal: [], external: [] }),
        hreflang: safeExtract(() => getHreflangs(), []),
        emails: safeExtract(() => getEmails(), []),
        phones: safeExtract(() => getPhoneNumbers(), []),
        schema: safeExtract(() => getSchema(), []),
        plugins: safeExtract(() => getSEOPlugins(), []),
        paa: safeExtract(() => getPAA(), []),
        readability: safeExtract(() => calculateReadability(), { score: 0, level: 'N/A' }),
        cwv: getCWV()
    };
}

/**
 * Initialize content script
 */
function init() {
    console.log('[SEO Analyzer] Initializing modular content script...');

    // 1. Initialize Core Web Vitals tracking
    initCWV();

    // Set up CWV update callback
    onCWVUpdate((cwvData) => {
        sendCWVUpdate();
    });

    // 2. Inject highlight styles
    injectHighlightStyles();

    // 3. Setup message listener
    setupMessageListener(extractSEOData);

    // 4. Observer for DOM changes (SPA navigation, dynamic content)
    const observer = new MutationObserver(debounce(() => {
        const data = extractSEOData();
        sendUpdate(data);
    }, 1000)); // 1 second debounce

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // 5. Initial send on load
    if (document.readyState === 'complete') {
        const data = extractSEOData();
        sendUpdate(data);
    } else {
        window.addEventListener('load', () => {
            const data = extractSEOData();
            sendUpdate(data);
        });
    }

    console.log('[SEO Analyzer] Content script initialized successfully');
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
