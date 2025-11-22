/**
 * Highlighting styles module
 * Injects CSS for link highlighting
 */

/**
 * Inject CSS styles for link highlighting
 */
export function injectHighlightStyles() {
    if (document.getElementById('seo-analyzer-highlight-styles')) return;

    const style = document.createElement('style');
    style.id = 'seo-analyzer-highlight-styles';
    style.textContent = `
        /* SEO Analyzer Link Highlighting */
        a.seo-highlight-nofollow {
            outline: 2px dashed #ff6b6b !important;
            outline-offset: 2px !important;
            background-color: rgba(255, 107, 107, 0.1) !important;
        }
        a.seo-highlight-follow {
            outline: 2px solid #51cf66 !important;
            outline-offset: 2px !important;
            background-color: rgba(81, 207, 102, 0.1) !important;
        }
        a.seo-highlight-external {
            outline: 2px solid #339af0 !important;
            outline-offset: 2px !important;
            background-color: rgba(51, 154, 240, 0.1) !important;
        }
        a.seo-highlight-internal {
            outline: 2px solid #ffd43b !important;
            outline-offset: 2px !important;
            background-color: rgba(255, 212, 59, 0.1) !important;
        }
        a.seo-highlight-mailto {
            outline: 2px solid #ff6b9d !important;
            outline-offset: 2px !important;
            background-color: rgba(255, 107, 157, 0.1) !important;
        }
        a.seo-highlight-tel {
            outline: 2px solid #9775fa !important;
            outline-offset: 2px !important;
            background-color: rgba(151, 117, 250, 0.1) !important;
        }
    `;
    document.head.appendChild(style);
}
