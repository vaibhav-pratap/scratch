/**
 * Keyword Density Heatmap Module
 * Visualizes the distribution of target keywords (or auto-detected top keywords) across the content.
 */

import { segmentText } from './readability-utils.js';

const STOPWORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
    'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
    'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
    'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
    'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had'
]);

/**
 * Auto-detect top keywords from text
 * @param {Array} words - Array of words
 * @returns {Array} - Top 3 frequent keywords
 */
function extractTopKeywords(words) {
    const frequency = {};
    words.forEach(word => {
        const lower = word.toLowerCase();
        if (lower.length > 3 && !STOPWORDS.has(lower) && !/^\d+$/.test(lower)) {
            frequency[lower] = (frequency[lower] || 0) + 1;
        }
    });

    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
}

/**
 * Generate Keyword Density Heatmap Data
 * @param {string} content - Full text content
 * @param {Array} targetKeywords - Optional array of target keywords
 * @returns {object} - Heatmap data and used keywords
 */
export function generateKeywordHeatmap(content, targetKeywords = []) {
    if (!content) return null;

    // Split paragraphs (reuse logic from readability-heatmap logic implicitly or re-implement)
    // We re-implement simple split here to be self-contained or consistent
    const paragraphs = content.split(/\n\s*\n|<\/p>\s*<p>/)
        .map(p => p.trim())
        .filter(p => p.length > 50);

    const { words: allWords } = segmentText(content);
    
    // Determine keywords to track
    let activeKeywords = targetKeywords;
    if (!activeKeywords || activeKeywords.length === 0) {
        activeKeywords = extractTopKeywords(allWords);
    }
    
    // Normalize keywords for matching
    const normalizedKeywords = activeKeywords.map(k => k.toLowerCase());

    const heatmap = paragraphs.map((text, index) => {
        const { words: paraWords } = segmentText(text);
        let matchCount = 0;
        
        paraWords.forEach(word => {
            if (normalizedKeywords.includes(word.toLowerCase())) {
                matchCount++;
            }
        });

        // Calculate density (matches per 100 words roughly, or raw count)
        // Simple density: (matches / total_words) * 100
        const density = paraWords.length > 0 ? (matchCount / paraWords.length) * 100 : 0;
        
        const snippet = text.length > 100 ? text.substring(0, 100) + '...' : text;

        return {
            id: index,
            density: parseFloat(density.toFixed(1)),
            matches: matchCount,
            wordCount: paraWords.length,
            snippet
        };
    });

    return {
        heatmap,
        keywords: activeKeywords
    };
}
