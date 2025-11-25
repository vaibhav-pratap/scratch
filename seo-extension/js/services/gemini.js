/**
 * Google Gemini API Service Module
 * Handles API calls to Google Gemini for AI-powered SEO analysis
 */

import { getSettings, saveSettings } from '../core/storage.js';

// Available Gemini models (comprehensive list)
export const GEMINI_MODELS = [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (Latest)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Latest)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
    { value: 'gemini-exp-1206', label: 'Gemini Experimental 1206' }
];

const DEFAULT_MODEL = 'gemini-2.0-flash';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Get Gemini API key from storage
 */
export async function getGeminiApiKey() {
    const settings = await getSettings(['geminiApiKey']);
    return settings.geminiApiKey || null;
}

/**
 * Save Gemini API key to storage
 */
export async function saveGeminiApiKey(apiKey) {
    await saveSettings({ geminiApiKey: apiKey });
}

/**
 * Get selected Gemini model from storage
 */
export async function getGeminiModel() {
    const settings = await getSettings(['geminiModel']);
    return settings.geminiModel || DEFAULT_MODEL;
}

/**
 * Save selected Gemini model to storage
 */
export async function saveGeminiModel(model) {
    await saveSettings({ geminiModel: model });
}

/**
 * Generate AI summary for SEO data
 */
export async function generateAISummary(seoData) {
    try {
        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key not configured. Please add your API key in Settings.');
        }

        const model = await getGeminiModel();
        
        // Prepare the prompt
        const prompt = createSEOAuditPrompt(seoData);

        // Make API call using header for API key (more secure)
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
                maxOutputTokens: 2048,
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

        console.log('[Gemini] Making API request to:', `${API_BASE_URL}/models/${model}:generateContent`);
        console.log('[Gemini] Request body:', JSON.stringify(requestBody, null, 2));

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

        console.log('[Gemini] Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Gemini] Error response:', errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: { message: errorText || response.statusText } };
            }
            
            const errorMessage = errorData.error?.message || 
                                errorData.message || 
                                `API request failed: ${response.status} ${response.statusText}`;
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('[Gemini] Response data:', data);
        
        // Check for blocked content
        if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
            const finishReason = data.candidates[0].finishReason;
            if (finishReason !== 'STOP') {
                throw new Error(`Content generation stopped: ${finishReason}`);
            }
        }
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('[Gemini] Invalid response structure:', data);
            throw new Error('Invalid response format from Gemini API');
        }

        const text = data.candidates[0].content.parts[0].text;
        if (!text) {
            throw new Error('Empty response from Gemini API');
        }

        return text;
    } catch (error) {
        console.error('[Gemini] Error generating summary:', error);
        throw error;
    }
}

/**
 * Create comprehensive SEO audit prompt
 */
function createSEOAuditPrompt(data) {
    const {
        url, title, description, keywords, canonical, robots,
        og, twitter, headings, images, links, schema, 
        accessibility, cwv, readability, score, suggestions
    } = data;

    // Build comprehensive prompt
    let prompt = `You are an expert SEO analyst. Analyze the following SEO audit data and provide a comprehensive summary with actionable recommendations.

# SEO Audit Report

## Basic Information
- URL: ${url || 'N/A'}
- SEO Score: ${score || 0}/100

## Meta Tags
- Title: ${title || 'Missing'} (${title?.length || 0} characters)
- Description: ${description || 'Missing'} (${description?.length || 0} characters)
- Keywords: ${keywords || 'Missing'}
- Canonical: ${canonical || 'Missing'}
- Robots: ${robots || 'Missing'}

## Open Graph Tags
${Object.keys(og || {}).length > 0 ? Object.entries(og).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'None found'}

## Twitter Card Tags
${Object.keys(twitter || {}).length > 0 ? Object.entries(twitter).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'None found'}

## Headings Structure
${headings && headings.length > 0 ? headings.map(h => `- ${h.tag.toUpperCase()}: ${h.text.substring(0, 100)}`).join('\n') : 'No headings found'}

## Images
- Total Images: ${images?.length || 0}
- Missing Alt Text: ${images?.filter(i => !i.alt).length || 0}

## Links
- Internal Links: ${links?.internal?.length || 0}
- External Links: ${links?.external?.length || 0}

## Schema/Structured Data
${schema && schema.length > 0 ? schema.map(s => `- ${s.type}: ${s.valid ? 'Valid' : 'Invalid'}`).join('\n') : 'No schema found'}

## Core Web Vitals
${cwv ? `
- LCP (Largest Contentful Paint): ${cwv.lcp || 0}ms
- CLS (Cumulative Layout Shift): ${cwv.cls || 0}
- INP (Interaction to Next Paint): ${cwv.inp || 0}ms
- FCP (First Contentful Paint): ${cwv.fcp || 0}ms
- TTFB (Time to First Byte): ${cwv.ttfb || 0}ms
` : 'Not available'}

## Readability
${readability ? `- Score: ${readability.score} (${readability.level})` : 'Not available'}

## Accessibility
${accessibility ? `
- Accessibility Score: ${accessibility.score}/100
- Critical Issues: ${accessibility.issues?.critical?.length || 0}
- Warnings: ${accessibility.issues?.warnings?.length || 0}
- Notices: ${accessibility.issues?.notices?.length || 0}
` : 'Not available'}

## Current Suggestions
${suggestions && suggestions.length > 0 ? suggestions.map(s => `- ${s.type.toUpperCase()}: ${s.msg}`).join('\n') : 'None'}

---

Please provide a comprehensive SEO audit summary that includes:

1. **Executive Summary**: A brief overview of the overall SEO health (2-3 sentences)

2. **Strengths**: What the website is doing well (3-5 points)

3. **Critical Issues**: The most important problems that need immediate attention (prioritized list)

4. **Recommendations**: Actionable, specific recommendations organized by priority:
   - High Priority (must fix)
   - Medium Priority (should fix)
   - Low Priority (nice to have)

5. **Performance Insights**: Analysis of Core Web Vitals and suggestions for improvement

6. **Accessibility Concerns**: Key accessibility issues and their impact

7. **Next Steps**: A clear action plan with the top 5 immediate actions

Format your response in clear, professional language with proper markdown formatting. Be specific and actionable in your recommendations.`;

    return prompt;
}

/**
 * Test API key validity
 * Returns { valid: boolean, error?: string }
 */
export async function testApiKey(apiKey, model = DEFAULT_MODEL) {
    try {
        const requestBody = {
            contents: [{
                parts: [{
                    text: 'Say "API key is valid" if you can read this.'
                }]
            }],
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

        console.log('[Gemini] Testing API key with model:', model);

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
            console.error('[Gemini] API key test error response:', errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: { message: errorText || response.statusText } };
            }
            
            const errorMessage = errorData.error?.message || 
                                errorData.message || 
                                `API request failed: ${response.status} ${response.statusText}`;
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const isValid = data.candidates && data.candidates[0] && data.candidates[0].content;
        
        if (!isValid) {
            throw new Error('Invalid response from API');
        }
        
        return { valid: true };
    } catch (error) {
        console.error('[Gemini] API key test failed:', error);
        return { 
            valid: false, 
            error: error.message || 'Failed to validate API key' 
        };
    }
}

