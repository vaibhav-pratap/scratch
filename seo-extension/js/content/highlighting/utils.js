/**
 * Highlighting Utility Functions
 * Generic functions to highlight elements on the active page
 */

// Track active highlights: Map<selector, Array<overlayElement>>
const activeOverlays = new Map();

/**
 * Highlight an element by CSS selector
 */
export function highlightBySelector(selector, label = 'Element', type = 'info') {
    if (!selector) return;

    // 1. If already highlighted, remove it (Toggle behavior)
    if (activeOverlays.has(selector)) {
        clearHighlightsBySelector(selector);
        return false; // Return false to indicate it was toggled OFF
    }

    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            console.log('[SEO Extension] No elements found for selector:', selector);
            return false;
        }

        const overlays = [];

        elements.forEach(element => {
            // 2. Get exact position and dimensions
            // Use getBoundingClientRect for viewport-relative coords
            const rect = element.getBoundingClientRect();
            
            // Skip elements with zero dimensions (hidden)
            if (rect.width === 0 || rect.height === 0) return;

            // 3. Create overlay element
            const overlay = document.createElement('div');
            overlay.className = 'seo-ext-highlight-overlay';
            
            // Account for page scroll
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            overlay.style.top = `${rect.top + scrollTop}px`;
            overlay.style.left = `${rect.left + scrollLeft}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
            
            // 4. Add label
            const labelEl = document.createElement('div');
            labelEl.className = 'seo-ext-highlight-label';
            labelEl.textContent = label;
            overlay.appendChild(labelEl);
            
            // 5. Append to body (outside the element's hierarchy to avoid clipping)
            document.body.appendChild(overlay);
            overlays.push(overlay);

            // 6. Scroll into view (only for the first instance)
            if (overlays.length === 1) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        if (overlays.length > 0) {
            activeOverlays.set(selector, overlays);
            return true; // Return true to indicate it was toggled ON
        }

    } catch (error) {
        console.error('[SEO Extension] Error highlighting element:', error);
    }
    return false;
}

/**
 * Clear highlights for a specific selector
 */
export function clearHighlightsBySelector(selector) {
    if (activeOverlays.has(selector)) {
        const overlays = activeOverlays.get(selector);
        overlays.forEach(overlay => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        });
        activeOverlays.delete(selector);
        return true;
    }
    return false;
}

/**
 * Clear all highlights
 */
export function clearAllHighlights() {
    activeOverlays.forEach((overlays, selector) => {
        overlays.forEach(overlay => overlay.remove());
    });
    activeOverlays.clear();
}
