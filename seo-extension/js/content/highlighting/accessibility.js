/**
 * Accessibility Highlighting Module
 * Highlights accessibility issues on the page
 */

const HIGHLIGHT_CLASSES = {
    critical: 'a11y-highlight-critical',
    warning: 'a11y-highlight-warning',
    notice: 'a11y-highlight-notice'
};

let activeHighlights = new Map(); // Map<selector, {elements, severity}>

/**
 * Inject highlight styles into the page
 */
function injectHighlightStyles() {
    if (document.getElementById('a11y-highlight-styles')) {
        return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'a11y-highlight-styles';
    style.textContent = `
        .a11y-highlight-critical {
            outline: 3px solid #dc2626 !important;
            outline-offset: 2px !important;
            animation: a11y-pulse-error 2s infinite;
            position: relative;
            z-index: 10000;
        }

        .a11y-highlight-warning {
            outline: 3px solid #ea580c !important;
            outline-offset: 2px !important;
            position: relative;
            z-index: 10000;
        }

        .a11y-highlight-notice {
            outline: 3px solid #2563eb !important;
            outline-offset: 2px !important;
            position: relative;
            z-index: 10000;
        }

        @keyframes a11y-pulse-error {
            0%, 100% { outline-color: #dc2626; }
            50% { outline-color: #ef4444; }
        }

        .a11y-highlight-overlay {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 10001;
            max-width: 300px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .a11y-highlight-critical:hover + .a11y-highlight-overlay,
        .a11y-highlight-warning:hover + .a11y-highlight-overlay,
        .a11y-highlight-notice:hover + .a11y-highlight-overlay {
            opacity: 1;
        }
    `;

    document.head.appendChild(style);
}

/**
 * Highlight a specific accessibility issue
 */
export function highlightAccessibilityIssue(selector, severity = 'warning', message = '') {
    try {
        injectHighlightStyles();

        // Try to find elements
        let elements = [];
        try {
            elements = Array.from(document.querySelectorAll(selector));
        } catch (e) {
            console.warn('[A11y Highlight] Invalid selector:', selector, e);
            return;
        }

        if (elements.length === 0) {
            console.warn('[A11y Highlight] No elements found for selector:', selector);
            return;
        }

        const highlightClass = HIGHLIGHT_CLASSES[severity] || HIGHLIGHT_CLASSES.warning;

        elements.forEach(element => {
            // Add highlight class
            element.classList.add(highlightClass);

            // Scroll element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add hover tooltip if message provided
            if (message) {
                const overlay = document.createElement('div');
                overlay.className = 'a11y-highlight-overlay';
                overlay.textContent = message;
                overlay.style.opacity = '1'; // Show immediately

                // Position overlay near the element
                const rect = element.getBoundingClientRect();
                overlay.style.top = `${rect.bottom + window.scrollY + 5}px`;
                overlay.style.left = `${rect.left + window.scrollX}px`;

                document.body.appendChild(overlay);

                // Auto-hide after 3 seconds
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.remove(), 300);
                }, 3000);
            }
        });

        // Store for later removal
        activeHighlights.set(selector, { elements, severity, message });

        console.log(`[A11y Highlight] Highlighted ${elements.length} element(s) matching "${selector}"`);
    } catch (error) {
        console.error('[A11y Highlight] Error highlighting:', error);
    }
}

/**
 * Clear all accessibility highlights
 */
export function clearAccessibilityHighlights() {
    try {
        activeHighlights.forEach(({ elements }) => {
            elements.forEach(element => {
                Object.values(HIGHLIGHT_CLASSES).forEach(className => {
                    element.classList.remove(className);
                });

                // Remove overlay if exists
                const nextSibling = element.nextSibling;
                if (nextSibling && nextSibling.classList && nextSibling.classList.contains('a11y-highlight-overlay')) {
                    nextSibling.remove();
                }
            });
        });

        activeHighlights.clear();
        console.log('[A11y Highlight] Cleared all highlights');
    } catch (error) {
        console.error('[A11y Highlight] Error clearing highlights:', error);
    }
}

/**
 * Toggle all accessibility highlights on/off
 */
export function toggleAccessibilityHighlights(enabled, issues = []) {
    if (!enabled) {
        clearAccessibilityHighlights();
        return;
    }

    // Clear existing first
    clearAccessibilityHighlights();

    // Highlight all issues
    issues.forEach(issue => {
        if (issue.selector) {
            highlightAccessibilityIssue(issue.selector, issue.severity, issue.message);
        }
    });
}

/**
 * Highlight issues by category
 */
export function highlightIssuesByCategory(category, issues, enabled) {
    if (!enabled) {
        // Remove only this category's highlights
        issues.forEach(issue => {
            if (issue.selector && activeHighlights.has(issue.selector)) {
                const { elements } = activeHighlights.get(issue.selector);
                elements.forEach(element => {
                    Object.values(HIGHLIGHT_CLASSES).forEach(className => {
                        element.classList.remove(className);
                    });
                });
                activeHighlights.delete(issue.selector);
            }
        });
    } else {
        issues.forEach(issue => {
            if (issue.selector) {
                highlightAccessibilityIssue(issue.selector, issue.severity, issue.message);
            }
        });
    }
}
