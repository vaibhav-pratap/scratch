/**
 * Score calculators module
 * Functions for calculating SEO and performance scores
 */

/**
 * Calculate SEO score based on data
 */
export function calculateSEOScore(data) {
    let score = 100;
    const suggestions = [];

    // Title
    const titleLen = data.title ? data.title.length : 0;
    if (titleLen === 0) {
        score -= 20;
        suggestions.push({ type: 'error', msg: 'Missing Title tag.' });
    } else if (titleLen < 30 || titleLen > 60) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Title should be 30-60 chars.' });
    }

    // Description
    const descLen = data.description ? data.description.length : 0;
    if (descLen === 0) {
        score -= 20;
        suggestions.push({ type: 'error', msg: 'Missing Meta Description.' });
    } else if (descLen < 120 || descLen > 160) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Description should be 120-160 chars.' });
    }

    // H1
    const h1Count = data.headings.filter(h => h.tag === 'h1').length;
    if (h1Count === 0) {
        score -= 10;
        suggestions.push({ type: 'error', msg: 'Missing H1 tag.' });
    } else if (h1Count > 1) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Multiple H1 tags found.' });
    }

    // Images
    const missingAlt = data.images.filter(i => !i.alt).length;
    if (missingAlt > 0) {
        score -= 10;
        suggestions.push({ type: 'warning', msg: `${missingAlt} images missing Alt text.` });
    }

    return { score: Math.max(0, score), suggestions };
}

/**
 * Calculate performance score based on CWV
 */
export function calculatePerformanceScore(cwv) {
    if (!cwv) return 0;

    let score = 100;

    // LCP thresholds: Good < 2.5s, Needs Improvement < 4s, Poor >= 4s
    if (cwv.lcp > 4000) score -= 30;
    else if (cwv.lcp > 2500) score -= 15;

    // CLS thresholds: Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25
    if (cwv.cls > 0.25) score -= 30;
    else if (cwv.cls > 0.1) score -= 15;

    // INP thresholds: Good < 200ms, Needs Improvement < 500ms, Poor >= 500ms
    if (cwv.inp > 500) score -= 30;
    else if (cwv.inp > 200) score -= 15;

    return Math.max(0, score);
}

/**
 * Generate suggestions array from data
 */
export function generateSuggestions(data) {
    const { suggestions } = calculateSEOScore(data);
    return suggestions;
}
