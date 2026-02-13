/**
 * AI Prompts Service
 * Provides focused AI insights for each tab
 * Now supports multi-provider AI (Gemini, ChatGPT, Grok)
 */

import { sendChatMessage } from './ai-router.js';
import { getSettings } from '../core/storage.js';
import { DEFAULT_MODEL } from './ai-models.js';

/**
 * Generate concise overview summary (shorter, more focused)
 */
export async function generateOverviewSummary(seoData) {
    const prompt = `Analyze this SEO audit in 3-4 sentences. Focus on:
1. Overall health score (${seoData.score || 0}/100)
2. Top 2 critical issues
3. Top 2 quick wins

Data: Title: ${seoData.title || 'Missing'} (${seoData.title?.length || 0} chars), Description: ${seoData.description || 'Missing'} (${seoData.description?.length || 0} chars), H1: ${seoData.headings?.filter(h => h.tag === 'h1').length || 0}, Missing Alt: ${seoData.images?.filter(i => !i.alt).length || 0}, CWV: LCP ${seoData.cwv?.lcp || 0}ms, CLS ${seoData.cwv?.cls || 0}, A11Y Score: ${seoData.accessibility?.score || 0}/100.

Keep response under 150 words.`;

    return await callAI(prompt, 500); // Limit to 500 tokens
}

/**
 * Generate Meta tab insights - ENHANCED
 */
export async function generateMetaInsights(seoData) {
    const { title, description, keywords, canonical, robots, og, twitter } = seoData;

    const prompt = `You are an expert SEO consultant analyzing meta tags. Provide a comprehensive, actionable analysis.

**CURRENT META TAGS:**
Title: "${title || 'MISSING'}" (${title?.length || 0} characters)
Description: "${description || 'MISSING'}" (${description?.length || 0} characters)
Keywords Meta: ${keywords || 'Not set'}
Canonical URL: ${canonical || 'Not set'}
Robots Directive: ${robots || 'Not set'}
Open Graph Tags: ${Object.keys(og || {}).length > 0 ? 'Present (' + Object.keys(og || {}).length + ' tags)' : 'MISSING'}
Twitter Card Tags: ${Object.keys(twitter || {}).length > 0 ? 'Present (' + Object.keys(twitter || {}).length + ' tags)' : 'MISSING'}

**REQUIRED ANALYSIS:**

1. **Title Tag Assessment:**
   - Length optimization (ideal: 50-60 chars, max: 70)
   - Keyword placement (front-loaded recommended)
   - Brand inclusion strategy
   - CTR potential score (1-10)
   - Provide 2 optimized alternatives

2. **Meta Description:**
   - Length check (ideal: 150-160 chars, max: 165)
   - Call-to-action presence
   - Keyword integration
   - Emotional triggers/power words
   - Provide 2 compelling rewrites

3. **Social Media Optimization:**
   - Open Graph completeness (og:title, og:description, og:image, og:url)
   - Twitter Card setup (twitter:card, twitter:title, twitter:description, twitter:image)
   - Image dimension recommendations (1200x630 for OG)
   - Missing critical tags

4. **Technical SEO:**
   - Canonical tag implementation
   - Robots meta directives
   - Duplicate content risks
   - Index/noindex recommendations

**OUTPUT FORMAT:**
✅ Strengths: (1-2 points)
🚨 Critical Issues: (Priority: High/Medium/Low)
💡 Recommendations: (Specific, actionable)
📊 Optimization Score: X/100

Keep response under 300 words. Be specific and actionable.`;

    return await callAI(prompt, 800);
}

/**
 * Generate Headings structure insights - ENHANCED
 */
export async function generateHeadingsInsights(seoData) {
    const headings = seoData.headings || [];
    const h1Count = headings.filter(h => h.tag === 'h1').length;
    const h2Count = headings.filter(h => h.tag === 'h2').length;
    const h3Count = headings.filter(h => h.tag === 'h3').length;
    const structure = headings.slice(0, 15).map(h => `${h.tag}: ${h.text.substring(0, 60)}`).join('\n');

    const prompt = `Analyze heading structure as an SEO expert. Provide detailed, actionable insights.

**HEADING STRUCTURE:**
H1 Tags: ${h1Count} ${h1Count !== 1 ? '⚠️' : '✓'}
H2 Tags: ${h2Count}
H3 Tags: ${h3Count}
Total Headings: ${headings.length}

First 15 Headings:
${structure || 'No headings found'}

**ANALYSIS REQUIRED:**

1. **Hierarchy Assessment:**
   - H1 uniqueness (must be exactly 1)
   - Logical heading progression (no skipped levels)
   - Semantic structure quality
   - Heading depth appropriateness

2. **SEO Optimization:**
   - Keyword placement in H1/H2
   - Heading length (ideal: 20-70 chars)
   - Descriptive vs generic headings
   - Search intent alignment

3. **Content Organization:**
   - Scanability score (1-10)
   - Content outline clarity
   - User experience impact
   - Accessibility compliance

4. **Recommendations:**
   - Critical fixes (Priority: High/Medium/Low)
   - H1 optimization suggestions
   - Subheading improvements
   - Quick wins

**OUTPUT:**
✅ Strengths
🚨 Issues (with priority)
💡 Specific improvements
📊 Structure Score: X/100

Limit: 250 words.`;

    return await callAI(prompt, 700);
}

/**
 * Generate Images insights - ENHANCED
 */
export async function generateImagesInsights(seoData) {
    const images = seoData.images || [];
    const missingAlt = images.filter(i => !i.alt).length;
    const total = images.length;
    const coverage = total > 0 ? Math.round(((total - missingAlt) / total) * 100) : 0;

    const prompt = `Analyze image SEO as an expert. Provide comprehensive optimization guidance.

**IMAGE SEO DATA:**
Total Images: ${total}
Missing Alt Text: ${missingAlt} ${missingAlt > 0 ? '⚠️' : '✓'}
Alt Text Coverage: ${coverage}%
Coverage Status: ${coverage >= 90 ? 'Excellent' : coverage >= 70 ? 'Good' : coverage >= 50 ? 'Fair' : 'Poor'}

**REQUIRED ANALYSIS:**

1. **Alt Text Optimization:**
   - Current coverage assessment
   - SEO impact of missing alt text
   - Accessibility implications (WCAG 2.1)
   - Alt text best practices
   - Keyword integration strategy

2. **Image Optimization:**
   - File format recommendations (WebP, AVIF)
   - Lazy loading implementation
   - Responsive images (srcset)
   - Image compression opportunities
   - Next-gen format adoption

3. **Technical SEO:**
   - Image sitemap recommendations
   - Structured data for images
   - CDN usage suggestions
   - Core Web Vitals impact

4. **Actionable Steps:**
   - Priority fixes (High/Medium/Low)
   - Alt text writing guidelines
   - Performance improvements
   - Quick wins

**OUTPUT:**
✅ Current strengths
🚨 Critical issues
💡 Optimization roadmap
📊 Image SEO Score: X/100

Limit: 250 words.`;

    return await callAI(prompt, 700);
}

/**
 * Generate Links insights - ENHANCED
 */
export async function generateLinksInsights(seoData) {
    const links = seoData.links || {};
    const internal = links.internal?.length || 0;
    const external = links.external?.length || 0;
    const ratio = external > 0 ? (internal / external).toFixed(2) : 'N/A';

    const prompt = `Analyze link structure as an SEO strategist. Provide actionable link building insights.

**LINK PROFILE:**
Internal Links: ${internal}
External Links: ${external}
Total Links: ${internal + external}
Internal/External Ratio: ${ratio}:1 ${ratio === 'N/A' ? '⚠️ No external links' : ratio < 2 ? '⚠️ Low internal linking' : '✓'}

**ANALYSIS REQUIRED:**

1. **Internal Linking Strategy:**
   - Link distribution assessment
   - Deep linking opportunities
   - Orphan page risks
   - Link equity flow
   - Anchor text optimization
   - Contextual linking quality

2. **External Link Quality:**
   - Outbound link value
   - Authority site linking
   - Nofollow/Dofollow balance
   - Broken link detection
   - Link relevance scoring

3. **Technical SEO:**
   - Crawl depth optimization
   - Link juice distribution
   - Redirect chains
   - Canonical link issues
   - JavaScript link handling

4. **Recommendations:**
   - Priority fixes (High/Medium/Low)
   - Internal linking improvements
   - External link strategy
   - Anchor text guidelines
   - Quick wins

**OUTPUT:**
✅ Strengths
🚨 Critical issues
💡 Link strategy improvements
📊 Link Profile Score: X/100

Limit: 250 words.`;

    return await callAI(prompt, 700);
}

/**
 * Generate Accessibility insights - ENHANCED
 */
export async function generateAccessibilityInsights(seoData) {
    const a11y = seoData.accessibility || {};
    const score = a11y.score || 0;
    const critical = a11y.issues?.critical?.length || 0;
    const warnings = a11y.issues?.warnings?.length || 0;

    const prompt = `Analyze accessibility as a WCAG 2.1 expert. Provide comprehensive a11y and SEO insights.

**ACCESSIBILITY AUDIT:**
Accessibility Score: ${score}/100 ${score >= 90 ? '✓ Excellent' : score >= 70 ? '⚠️ Good' : score >= 50 ? '⚠️ Fair' : '🚨 Poor'}
Critical Issues: ${critical} ${critical > 0 ? '🚨' : '✓'}
Warnings: ${warnings}

**REQUIRED ANALYSIS:**

1. **WCAG Compliance:**
   - Level A compliance status
   - Level AA compliance status
   - Level AAA opportunities
   - Critical violations
   - Legal compliance risks

2. **Core Accessibility:**
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast (4.5:1 minimum)
   - Focus indicators
   - ARIA implementation
   - Form accessibility

3. **SEO Impact:**
   - Alt text for images
   - Semantic HTML structure
   - Heading hierarchy
   - Link descriptiveness
   - Mobile accessibility

4. **Actionable Fixes:**
   - Critical issues (Priority: High)
   - Quick accessibility wins
   - Long-term improvements
   - Testing recommendations
   - Tool suggestions

**OUTPUT:**
✅ Compliant areas
🚨 Critical violations
💡 Improvement roadmap
📊 WCAG Score: X/100

Limit: 250 words.`;

    return await callAI(prompt, 700);
}

/**
 * Generate Schema insights - ENHANCED
 */
export async function generateSchemaInsights(seoData) {
    const schema = seoData.schema || [];
    const valid = schema.filter(s => s.valid).length;
    const invalid = schema.filter(s => !s.valid).length;
    const types = schema.map(s => s.type).join(', ') || 'None';

    const prompt = `Analyze structured data as a schema.org expert. Provide rich snippet optimization guidance.

**STRUCTURED DATA:**
Schema Types: ${types || 'None found'} ${schema.length === 0 ? '🚨' : '✓'}
Valid Schemas: ${valid}
Invalid Schemas: ${invalid} ${invalid > 0 ? '⚠️' : '✓'}
Total Implementations: ${schema.length}

**ANALYSIS REQUIRED:**

1. **Current Implementation:**
   - Schema types assessment
   - Validation status
   - Implementation quality
   - Coverage completeness
   - JSON-LD vs Microdata

2. **Rich Snippet Opportunities:**
   - Article schema
   - Product schema
   - FAQ schema
   - HowTo schema
   - Review schema
   - Breadcrumb schema
   - Local Business schema
   - Organization schema

3. **Technical SEO:**
   - Google Rich Results eligibility
   - Schema nesting
   - Required vs recommended properties
   - Validation errors
   - Testing recommendations

4. **Recommendations:**
   - Missing schema types (Priority: High/Medium/Low)
   - Validation fixes
   - Enhancement opportunities
   - Quick wins
   - Testing tools

**OUTPUT:**
✅ Implemented schemas
🚨 Critical issues
💡 Schema opportunities
📊 Rich Snippet Potential: X/100

Limit: 250 words.`;

    return await callAI(prompt, 700);
}

/**
 * Core API call function - now provider-agnostic
 */
async function callAI(prompt, maxTokens = 1000) {
    try {
        // Get selected model
        const settings = await getSettings(['selectedModel']);
        const modelId = settings.selectedModel || DEFAULT_MODEL;

        // Create message history in Gemini format (AI router will convert if needed)
        const history = [{
            role: 'user',
            parts: [{ text: prompt }]
        }];

        // Call AI router which handles provider selection
        const response = await sendChatMessage(history, modelId);
        return response;

    } catch (error) {
        console.error('[AI Prompts] Error:', error);
        throw error;
    }
}
