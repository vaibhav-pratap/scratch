/**
 * AI Content Analysis Service
 * Comprehensive content analysis using Gemini AI
 */

import { getGeminiApiKey, getGeminiModel } from './gemini.js';

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Perform comprehensive AI content analysis
 */
export async function analyzeContentWithAI(seoData, readabilityData) {
    try {
        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
            throw new Error('API_KEY_REQUIRED');
        }

        const model = await getGeminiModel();
        
        // Get content from page via content script
        let content = '';
        try {
            // Try to get content from the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id) {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        const mainSelectors = [
                            'main',
                            'article',
                            '[role="main"]',
                            '.content',
                            '.main-content',
                            '#content',
                            '#main'
                        ];
                        
                        let content = '';
                        
                        for (const selector of mainSelectors) {
                            const element = document.querySelector(selector);
                            if (element) {
                                content = element.innerText || element.textContent || '';
                                if (content.length > 200) break;
                            }
                        }
                        
                        if (!content || content.length < 200) {
                            const bodyClone = document.body.cloneNode(true);
                            const elementsToRemove = bodyClone.querySelectorAll('nav, footer, header, script, style, noscript, iframe, .nav, .footer, .header, .sidebar, .menu');
                            elementsToRemove.forEach(el => el.remove());
                            content = bodyClone.innerText || bodyClone.textContent || '';
                        }
                        
                        return content.trim();
                    }
                });
                if (results && results[0] && results[0].result) {
                    content = results[0].result;
                }
            }
        } catch (error) {
            console.warn('[AI Content Analysis] Could not extract content from page:', error);
            // Fallback: use a basic content string from headings and description
            if (seoData.headings && seoData.headings.length > 0) {
                content = seoData.headings.map(h => h.text).join(' ');
            }
            if (seoData.description) {
                content += ' ' + seoData.description;
            }
        }
        
        const text = content.substring(0, 50000); // Limit to 50k chars for API
        
        // Build comprehensive prompt
        const prompt = createContentAnalysisPrompt(seoData, readabilityData, text);
        
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
                maxOutputTokens: 4096,
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

        const analysisText = data.candidates[0].content.parts[0].text;
        
        // Parse the structured response
        return parseAnalysisResponse(analysisText, readabilityData);
    } catch (error) {
        console.error('[AI Content Analysis] Error:', error);
        throw error;
    }
}


/**
 * Create comprehensive content analysis prompt
 */
function createContentAnalysisPrompt(seoData, readabilityData, content) {
    const {
        title, description, headings, images, links, url
    } = seoData;
    
    const headingsText = headings?.map(h => `${h.tag}: ${h.text.substring(0, 100)}`).join('\n') || 'None';
    const contentPreview = content.substring(0, 3000); // First 3000 chars
    
    return `You are an expert SEO and content analyst. Analyze this webpage content and provide a comprehensive analysis in JSON format.

# Page Information
URL: ${url || 'N/A'}
Title: ${title || 'Missing'}
Description: ${description || 'Missing'}

# Content Preview (first 3000 characters)
${contentPreview}

# Headings Structure
${headingsText}

# Readability Metrics
- Flesch Score: ${readabilityData?.fleschScore || 0}
- Word Count: ${readabilityData?.wordCount || 0}
- Sentence Count: ${readabilityData?.sentenceCount || 0}
- Passive Voice: ${readabilityData?.passiveVoice?.percentage || 0}%
- Average Sentence Length: ${readabilityData?.sentences?.averageLength || 0} words
- Transitional Words: ${readabilityData?.transitionalWords?.percentage || 0}%

# Analysis Requirements

Provide a comprehensive analysis in the following JSON structure (respond ONLY with valid JSON, no markdown):

{
  "overallScore": 85,
  "overallRating": "Good",
  "summary": "Brief 2-3 sentence summary of content quality",
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "metrics": {
    "contentQuality": {
      "score": 85,
      "rating": "Good",
      "analysis": "Detailed analysis of content quality, depth, and value"
    },
    "seoOptimization": {
      "score": 80,
      "rating": "Good",
      "analysis": "Analysis of SEO optimization including keyword usage, semantic relevance"
    },
    "readability": {
      "score": 90,
      "rating": "Excellent",
      "analysis": "Analysis of readability, clarity, and user-friendliness"
    },
    "engagement": {
      "score": 75,
      "rating": "Fair",
      "analysis": "Analysis of content engagement potential, structure, and flow"
    },
    "technicalWriting": {
      "score": 82,
      "rating": "Good",
      "analysis": "Analysis of writing quality, grammar, style, and professionalism"
    }
  },
  "detailedAnalysis": {
    "keywordOptimization": {
      "status": "good",
      "score": 85,
      "analysis": "Detailed analysis of keyword usage and optimization",
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    },
    "contentStructure": {
      "status": "good",
      "score": 80,
      "analysis": "Analysis of content structure, headings, and organization",
      "recommendations": ["Recommendation 1"]
    },
    "toneAndStyle": {
      "status": "good",
      "score": 88,
      "analysis": "Analysis of tone, style, and voice consistency",
      "recommendations": []
    },
    "contentDepth": {
      "status": "warning",
      "score": 70,
      "analysis": "Analysis of content depth, comprehensiveness, and detail",
      "recommendations": ["Add more detailed explanations", "Include examples"]
    },
    "userIntent": {
      "status": "good",
      "score": 85,
      "analysis": "Analysis of how well content matches user intent and search queries",
      "recommendations": []
    },
    "contentFreshness": {
      "status": "good",
      "score": 80,
      "analysis": "Analysis of content freshness, relevance, and timeliness",
      "recommendations": []
    }
  },
  "recommendations": {
    "critical": [
      "Critical issue 1 that must be fixed immediately",
      "Critical issue 2"
    ],
    "high": [
      "High priority improvement 1",
      "High priority improvement 2"
    ],
    "medium": [
      "Medium priority suggestion 1",
      "Medium priority suggestion 2"
    ],
    "low": [
      "Low priority enhancement 1"
    ]
  },
  "improvementPlan": {
    "quickWins": [
      "Quick win 1 that can be implemented immediately",
      "Quick win 2"
    ],
    "longTerm": [
      "Long-term improvement 1",
      "Long-term improvement 2"
    ]
  },
  "comparison": {
    "industryAverage": 75,
    "bestPractice": 90,
    "yourScore": 85,
    "gap": 5
  }
}

IMPORTANT: 
- Return ONLY valid JSON, no markdown formatting, no code blocks
- All scores should be 0-100
- Ratings: "Excellent" (90-100), "Good" (70-89), "Fair" (50-69), "Poor" (0-49)
- Status: "good", "warning", "poor"
- Be specific and actionable in all recommendations
- Base analysis on actual content provided, not assumptions`;
}

/**
 * Parse AI response and structure it
 */
function parseAnalysisResponse(analysisText, readabilityData) {
    try {
        // Try to extract JSON from response (might have markdown or extra text)
        let jsonText = analysisText.trim();
        
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Find JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }
        
        const parsed = JSON.parse(jsonText);
        
        // Enhance with readability data
        return {
            ...parsed,
            readabilityMetrics: readabilityData,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('[AI Content Analysis] Error parsing response:', error);
        // Fallback: return structured error response
        return {
            overallScore: 0,
            overallRating: 'Error',
            summary: 'Failed to parse AI analysis. Please try again.',
            error: error.message,
            rawResponse: analysisText.substring(0, 500)
        };
    }
}

/**
 * Check if API key is configured
 */
export async function isApiKeyConfigured() {
    const apiKey = await getGeminiApiKey();
    return !!apiKey;
}

