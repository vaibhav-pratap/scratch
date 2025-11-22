/**
 * DOM utilities module
 * Helper functions for DOM manipulation
 */

/**
 * Set text content of an element by ID
 */
export function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/**
 * Create an HTML element with classes and content
 */
export function createElement(tag, classes = [], content = '') {
    const el = document.createElement(tag);
    if (classes.length) {
        el.className = classes.join(' ');
    }
    if (content) {
        el.innerHTML = content;
    }
    return el;
}

/**
 * Clear all children of a container
 */
export function clearContainer(id) {
    const container = document.getElementById(id);
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Get element by ID safely
 */
export function getElement(id) {
    return document.getElementById(id);
}

/**
 * Show or hide an element
 */
export function toggleElement(id, show) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = show ? '' : 'none';
    }
}
