/**
 * Readability Heatmap Module
 * Analyzes individual paragraphs to create a readability heatmap
 */

import { calculateFleschScore } from './readability-utils.js';
import { getScoreStatus } from './readability-context.js';

/**
 * Generate heatmap data for paragraphs
 * @param {string} content - The full text content
 * @param {string} audience - The target audience context
 */
export function generateHeatmapData(content, audience = 'general') {
    // Split content into paragraphs
    // We use a regex that handles double newlines and HTML p tags
    const paragraphs = content.split(/\n\s*\n|<\/p>\s*<p>/)
        .map(p => p.trim())
        .filter(p => p.length > 50); // Filter out very short lines/headers

    return paragraphs.map((text, index) => {
        const score = calculateFleschScore(text);
        const status = getScoreStatus(score, 'flesch', audience);
        
        // Truncate text for display
        const snippet = text.length > 100 ? text.substring(0, 100) + '...' : text;

        return {
            id: index,
            score,
            status,
            snippet,
            length: text.length
        };
    });
}
