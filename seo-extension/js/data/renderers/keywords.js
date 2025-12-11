/**
 * Keywords Renderer Adapter
 * Bridges the generic renderer with specific keyword performance visualizers
 */

import { renderKeywordsPerformance } from './keywords-performance.js';

/**
 * Render Keywords Tab
 * @param {Object} data - SEO Data object containing URL
 */
export function renderKeywordsTab(data) {
    // 1. Render Keywords Insights (Search Console Performance)
    const insightsContainer = document.getElementById('keywords-insights');
    if (insightsContainer && data.url) {
        // This is async but we don't await it to avoid blocking main render
        renderKeywordsPerformance(insightsContainer, data.url).catch(err => {
            console.debug('Keywords performance render failed:', err);
            insightsContainer.innerHTML = '<div class="error-state">Could not load keyword data.</div>';
        });
    }

    // 2. Future: Render other keyword tabs if needed (Planner, Ideas)
}
