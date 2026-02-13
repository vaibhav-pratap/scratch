/**
 * Score calculators module
 * Functions for calculating SEO and performance scores
 */

/**
 * Calculate SEO score based on data
 */
/**
 * Calculate Best Practices score
 */
export function calculateBestPracticesScore(data) {
    let score = 100;
    const issues = [];

    // 1. HTTPS
    if (!data.url.startsWith('https://')) {
        score -= 30;
        issues.push({ type: 'error', msg: 'Does not use HTTPS.' });
    }

    // 2. Doctype
    if (!data.doctype) {
        score -= 20;
        issues.push({ type: 'error', msg: 'Missing HTML Doctype.' });
    }

    // 3. Viewport (Mobile Friendly)
    if (!data.viewport) {
        score -= 20;
        issues.push({ type: 'error', msg: 'Missing Viewport tag (not mobile friendly).' });
    }

    // 4. No Mixed Content (Simple check based on iframes/scripts/images src)
    // This is hard to check accurately on just 'data', skipping for now or adding basic check
    
    return { score: Math.max(0, score), issues };
}

/**
 * Calculate SEO score (Refined)
 * Focuses on Content and Meta, excluding Accessibility and Tech specs
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

    // Canonical
    if (!data.canonical) {
         score -= 5;
         suggestions.push({ type: 'error', msg: 'Missing Canonical tag.' });
    }

    // Robots
    if (data.robots && data.robots.toLowerCase().includes('noindex')) {
        score -= 10;
        suggestions.push({ type: 'warning', msg: 'Page is blocked from indexing (noindex).' });
    }

    // Social (OG / Twitter)
    const ogCount = data.og ? Object.keys(data.og).length : 0;
    if (ogCount < 3) {
         suggestions.push({ type: 'info', msg: 'Incomplete Open Graph tags.' });
    }
    
    const twitterCount = data.twitter ? Object.keys(data.twitter).length : 0;
    if (twitterCount === 0) {
        suggestions.push({ type: 'info', msg: 'Missing Twitter Card tags.' });
    }

    // Content Structure (Headings hierarchy)
    let previousLevel = 0;
    let hierarchyIssues = 0;
    data.headings.forEach(h => {
        const level = parseInt(h.tag.replace('h', ''));
        if (!isNaN(level)) {
            if (level > previousLevel + 1 && previousLevel !== 0) {
                hierarchyIssues++;
            }
            previousLevel = level;
        }
    });

    if (hierarchyIssues > 0) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Heading levels are skipped (e.g., H1 to H3).' });
    }

    // Word Count
    const wordCount = data.readability?.wordCount || 0;
    if (wordCount > 0 && wordCount < 300) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Content is short (< 300 words).' });
    }

    // Links
    if (data.links) {
        const internalCount = data.links.internal?.length || 0;
        const externalCount = data.links.external?.length || 0;
        if (internalCount === 0 && externalCount === 0) {
             score -= 5;
             suggestions.push({ type: 'warning', msg: 'No internal or external links found.' });
        }
    }

    return { score: Math.max(0, score), suggestions };
}

/**
 * Calculate performance score based on CWV
 */
export function calculatePerformanceScore(cwv) {
    if (!cwv) return 0;

    let score = 100;

    // LCP thresholds
    if (cwv.lcp > 4000) score -= 30;
    else if (cwv.lcp > 2500) score -= 15;

    // CLS thresholds
    if (cwv.cls > 0.25) score -= 30;
    else if (cwv.cls > 0.1) score -= 15;

    // INP thresholds
    if (cwv.inp > 500) score -= 30;
    else if (cwv.inp > 200) score -= 15;

    // TTFB (optional penalty)
    if (cwv.ttfb > 1800) score -= 10;
    else if (cwv.ttfb > 800) score -= 5;

    return Math.max(0, score);
}

/**
 * Main calculate function called by renderer
 * Returns object with all 4 metrics
 */
export function calculateAllScores(data) {
    const seo = calculateSEOScore(data);
    const bestPractices = calculateBestPracticesScore(data);
    const performance = calculatePerformanceScore(data.cwv);
    const accessibility = data.accessibility?.score || 0;

    return {
        seo: seo.score,
        bestPractices: bestPractices.score,
        performance: performance,
        accessibility: accessibility,
        suggestions: [...seo.suggestions, ...bestPractices.issues]
    };
}

/**
 * Legacy support for generateSuggestions
 */
export function generateSuggestions(data) {
    const { suggestions } = calculateAllScores(data);
    return suggestions;
}
