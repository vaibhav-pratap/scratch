/**
 * SEO Plugins detector module
 * Detects common SEO plugins and tools
 */

/**
 * Detect SEO plugins
 */
export function getSEOPlugins() {
    const plugins = [];

    // Yoast SEO
    if (document.querySelector('meta[name="generator"][content*="Yoast"]') ||
        document.querySelector('script[src*="yoast"]') ||
        document.querySelector('link[href*="yoast"]')) {
        plugins.push('Yoast SEO');
    }

    // Rank Math
    if (document.querySelector('meta[name="generator"][content*="Rank Math"]') ||
        document.querySelector('script[src*="rank-math"]')) {
        plugins.push('Rank Math');
    }

    // All in One SEO
    if (document.querySelector('meta[name="generator"][content*="All in One SEO"]') ||
        document.querySelector('script[src*="all-in-one-seo"]')) {
        plugins.push('All in One SEO');
    }

    // SEOPress
    if (document.querySelector('meta[name="generator"][content*="SEOPress"]') ||
        document.querySelector('script[src*="seopress"]')) {
        plugins.push('SEOPress');
    }

    // The SEO Framework
    if (document.querySelector('meta[name="generator"][content*="The SEO Framework"]')) {
        plugins.push('The SEO Framework');
    }

    return plugins;
}
