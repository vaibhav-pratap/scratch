/**
 * Simple helper to integrate accessibility renderer
 * Import and call this from renderer.js
 */

import { renderAccessibilityTab } from './renderers/accessibility.js';

export function renderAccessibility(data) {
    if (data && data.accessibility) {
        renderAccessibilityTab(data.accessibility);
    }
}
