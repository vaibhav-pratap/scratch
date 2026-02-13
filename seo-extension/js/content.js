/**
 * Enhanced Modular Content Script Entry Point
 * Coordinates all content.js modules with full CWV and highlighting support
 */

// Import extractors
import { getMetaContent, getOGTags, getTwitterTags, getFavicon } from './content/extractors/meta.js';
import { getHeadings } from './content/extractors/headings.js';
import { getImages } from './content/extractors/images.js';
import { getLinks, getHreflangs } from './content/extractors/links.js';
import { getEmails, getPhoneNumbers } from './content/extractors/contact.js';
import { getSchema } from './content/extractors/schema.js';
import { detectTechStack } from './content/extractors/tech-stack.js';
import { getPAA } from './content/extractors/paa.js';
import { getAccessibilityData } from './content/extractors/accessibility.js';
import { detectTags, initTagDetector } from './content/extractors/tag-detector.js';

// Import performance
import { calculateReadability } from './content/performance/readability-advanced.js';
import { analyzeEEAT } from './content/performance/eeat-analyzer.js';
import { initCWV, getCWV, onCWVUpdate } from './content/performance/cwv.js';

// Import highlighting
import { injectHighlightStyles } from './content/highlighting/styles.js';
import { toggleLinkHighlight } from './content/highlighting/links.js';

// Import messaging
import { sendUpdate, sendCWVUpdate } from './content/messaging/updates.js';
import { setupMessageListener } from './content/messaging/handlers.js';

// Import utils
import { safeExtract, debounce } from './content/utils/helpers.js';

/**
 * Extract all SEO data from the page
 */
function extractSEOData() {
    return {
        url: window.location.href,
        doctype: document.doctype ? `<!DOCTYPE ${document.doctype.name}>` : null,
        title: document.title,
        description: safeExtract(() => getMetaContent('description')),
        keywords: safeExtract(() => getMetaContent('keywords')),
        canonical: safeExtract(() => document.querySelector('link[rel="canonical"]')?.href),
        robots: safeExtract(() => getMetaContent('robots')),
        viewport: safeExtract(() => getMetaContent('viewport')),
        charset: document.characterSet,
        lang: document.documentElement.lang,
        author: safeExtract(() => getMetaContent('author')),
        publisher: safeExtract(() => getMetaContent('publisher') || document.querySelector('link[rel="publisher"]')?.href),
        favicon: safeExtract(() => getFavicon()),
        og: safeExtract(() => getOGTags(), {}),
        twitter: safeExtract(() => getTwitterTags(), {}),
        headings: safeExtract(() => getHeadings(), []),
        images: safeExtract(() => getImages(), []),
        links: safeExtract(() => getLinks(), { internal: [], external: [] }),
        hreflang: safeExtract(() => getHreflangs(), []),
        emails: safeExtract(() => getEmails(), []),
        phones: safeExtract(() => getPhoneNumbers(), []),
        schema: safeExtract(() => getSchema(), []),
        techStack: safeExtract(() => detectTechStack(), {}),
        paa: safeExtract(() => getPAA(), []),
        readability: safeExtract(() => calculateReadability(), { score: 0, level: 'N/A' }),
        eeat: safeExtract(() => analyzeEEAT(), { score: 0, experience: {}, expertise: {}, authoritativeness: {}, trustworthiness: {} }),
        cwv: getCWV(),
        accessibility: safeExtract(() => getAccessibilityData(), { score: 0, issues: { critical: [], warnings: [], notices: [] }, checks: {} }),
        tags: safeExtract(() => detectTags(), { analytics: {}, pixels: {}, privacy: {}, other: {} })
    };
}

/**
 * Initialize content script
 */
function init() {
    console.log('[SEO Analyzer] Initializing DOM-dependent features...');

    // 1. Inject highlight styles
    injectHighlightStyles();

    // 2. Initialize Tag Detector (injects script for main world access)
    initTagDetector();

    // 3. Observer for DOM changes (SPA navigation, dynamic content)
    const observer = new MutationObserver(debounce(() => {
        const data = extractSEOData();
        sendUpdate(data);
    }, 1000)); // 1 second debounce

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }

    // 4. Listen for tag detection updates from the injected script
    window.addEventListener('seo-extension-tags-updated', () => {
        console.log('[SEO Analyzer] Tags detected, sending update...');
        const data = extractSEOData();
        sendUpdate(data);
    });

    // 5. Initial send on load
    const data = extractSEOData();
    sendUpdate(data);

    console.log('[SEO Analyzer] Content script initialized successfully');
}

// --- Initialize Core Features Immediately ---
console.log('[SEO Analyzer] Starting content script...');

// 1. Initialize Core Web Vitals tracking (needs to be early)
initCWV();

// Set up CWV update callback
onCWVUpdate((cwvData) => {
    sendCWVUpdate();
});

// 2. Setup message listener (MUST be ready for popup requests)
setupMessageListener(extractSEOData);

// 3. Initialize DOM-dependent features when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
