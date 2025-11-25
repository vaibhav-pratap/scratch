/**
 * Tab-Specific Gemini AI Service
 * Provides focused AI insights for each tab
 */

import { getGeminiApiKey, getGeminiModel } from './gemini.js';

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

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

    return await callGeminiAPI(prompt, 500); // Limit to 500 tokens
}

/**
 * Generate Meta tab insights
 */
export async function generateMetaInsights(seoData) {
    const { title, description, keywords, canonical, robots, og, twitter } = seoData;
    
    const prompt = `As an SEO expert, analyze these meta tags and provide 3-5 specific, actionable recommendations:

Title: "${title || 'Missing'}" (${title?.length || 0} characters)
Description: "${description || 'Missing'}" (${description?.length || 0} characters)
Keywords: ${keywords || 'Missing'}
Canonical: ${canonical || 'Missing'}
Robots: ${robots || 'Missing'}
Open Graph tags: ${Object.keys(og || {}).length > 0 ? 'Present' : 'Missing'}
Twitter Card tags: ${Object.keys(twitter || {}).length > 0 ? 'Present' : 'Missing'}

Provide:
1. What's working well (1-2 points)
2. Critical issues to fix (prioritized)
3. Specific improvement suggestions with character count targets

Keep response concise, under 200 words.`;

    return await callGeminiAPI(prompt, 600);
}

/**
 * Generate Headings structure insights
 */
export async function generateHeadingsInsights(seoData) {
    const headings = seoData.headings || [];
    const h1Count = headings.filter(h => h.tag === 'h1').length;
    const structure = headings.map(h => `${h.tag}: ${h.text.substring(0, 50)}`).join('\n');
    
    const prompt = `Analyze this heading structure for SEO:

H1 count: ${h1Count}
Total headings: ${headings.length}
Structure:
${structure || 'No headings found'}

Provide:
1. Structure assessment (hierarchy, skips, etc.)
2. Top 3 issues or improvements
3. Best practice recommendations

Keep response under 150 words.`;

    return await callGeminiAPI(prompt, 500);
}

/**
 * Generate Images insights
 */
export async function generateImagesInsights(seoData) {
    const images = seoData.images || [];
    const missingAlt = images.filter(i => !i.alt).length;
    const total = images.length;
    
    const prompt = `Analyze image SEO:

Total images: ${total}
Missing alt text: ${missingAlt}
Alt text coverage: ${total > 0 ? Math.round(((total - missingAlt) / total) * 100) : 0}%

Provide:
1. Current status assessment
2. Impact of missing alt text
3. Top 3 recommendations for improvement

Keep response under 150 words.`;

    return await callGeminiAPI(prompt, 500);
}

/**
 * Generate Links insights
 */
export async function generateLinksInsights(seoData) {
    const links = seoData.links || {};
    const internal = links.internal?.length || 0;
    const external = links.external?.length || 0;
    
    const prompt = `Analyze link structure for SEO:

Internal links: ${internal}
External links: ${external}
Total links: ${internal + external}
Internal/External ratio: ${external > 0 ? (internal / external).toFixed(2) : 'N/A'}:1

Provide:
1. Link profile assessment
2. Top 3 recommendations for link strategy
3. Quick wins for improvement

Keep response under 150 words.`;

    return await callGeminiAPI(prompt, 500);
}

/**
 * Generate Accessibility insights
 */
export async function generateAccessibilityInsights(seoData) {
    const a11y = seoData.accessibility || {};
    const score = a11y.score || 0;
    const critical = a11y.issues?.critical?.length || 0;
    const warnings = a11y.issues?.warnings?.length || 0;
    
    const prompt = `Analyze accessibility audit:

Score: ${score}/100
Critical issues: ${critical}
Warnings: ${warnings}

Provide:
1. Overall accessibility health
2. Top 3 critical issues to fix first
3. Quick accessibility wins

Keep response under 150 words.`;

    return await callGeminiAPI(prompt, 500);
}

/**
 * Generate Schema insights
 */
export async function generateSchemaInsights(seoData) {
    const schema = seoData.schema || [];
    const valid = schema.filter(s => s.valid).length;
    const invalid = schema.filter(s => !s.valid).length;
    const types = schema.map(s => s.type).join(', ') || 'None';
    
    const prompt = `Analyze structured data:

Schema types found: ${types || 'None'}
Valid schemas: ${valid}
Invalid schemas: ${invalid}
Total: ${schema.length}

Provide:
1. Current structured data assessment
2. Missing schema opportunities
3. Top 3 recommendations for improvement

Keep response under 150 words.`;

    return await callGeminiAPI(prompt, 500);
}

/**
 * Core API call function
 */
async function callGeminiAPI(prompt, maxTokens = 1000) {
    try {
        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const model = await getGeminiModel();
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: maxTokens,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
            ]
        };

        const response = await fetch(
            `${API_BASE_URL}/models/${model}:generateContent`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': apiKey
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: { message: errorText } };
            }
            throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('[Gemini Tab-Specific] Error:', error);
        throw error;
    }
}

