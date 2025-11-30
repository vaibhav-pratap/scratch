/**
 * Keywords Insights Service
 * Handles API calls to Google Search Console and Google Ads APIs
 */

import { getSettings, saveSettings } from '../core/storage.js';

// API Base URLs
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v14';

/**
 * Get Google Search Console API credentials
 */
export async function getGSCCredentials() {
    const settings = await getSettings(['gscApiKey', 'gscPropertyUrl']);
    return {
        apiKey: settings.gscApiKey || null,
        propertyUrl: settings.gscPropertyUrl || null
    };
}

/**
 * Save Google Search Console API credentials
 */
export async function saveGSCCredentials(apiKey, propertyUrl) {
    await saveSettings({
        gscApiKey: apiKey,
        gscPropertyUrl: propertyUrl
    });
}

/**
 * Get Google Ads API credentials
 */
export async function getGoogleAdsCredentials() {
    const settings = await getSettings(['googleAdsApiKey', 'googleAdsCustomerId']);
    return {
        apiKey: settings.googleAdsApiKey || null,
        customerId: settings.googleAdsCustomerId || null
    };
}

/**
 * Save Google Ads API credentials
 */
export async function saveGoogleAdsCredentials(apiKey, customerId) {
    await saveSettings({
        googleAdsApiKey: apiKey,
        googleAdsCustomerId: customerId
    });
}

/**
 * Fetch Search Console Performance Data
 * @param {Object} params - Query parameters (startDate, endDate, dimensions, filters)
 * @returns {Promise<Object>} Search Console data
 */
export async function getSearchConsoleData(params = {}) {
    try {
        const { apiKey, propertyUrl } = await getGSCCredentials();

        if (!apiKey || !propertyUrl) {
            throw new Error('Google Search Console credentials not configured. Please add them in Settings.');
        }

        // Default to last 28 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 28);

        const requestBody = {
            startDate: params.startDate || startDate.toISOString().split('T')[0],
            endDate: params.endDate || endDate.toISOString().split('T')[0],
            dimensions: params.dimensions || ['query'],
            rowLimit: params.rowLimit || 1000,
            ...(params.dimensionFilterGroups && { dimensionFilterGroups: params.dimensionFilterGroups })
        };

        console.log('[Keywords] Fetching Search Console data:', requestBody);

        const encodedUrl = encodeURIComponent(propertyUrl);
        const response = await fetch(
            `${GSC_API_BASE}/sites/${encodedUrl}/searchAnalytics/query?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Keywords] GSC API Error:', errorText);
            throw new Error(`Search Console API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Keywords] Search Console data received:', data);

        return {
            rows: data.rows || [],
            responseAggregationType: data.responseAggregationType
        };

    } catch (error) {
        console.error('[Keywords] Error fetching Search Console data:', error);
        throw error;
    }
}

/**
 * Generate Keyword Ideas using Google Ads Keyword Planner
 * @param {Object} params - { keywords, location, language }
 * @returns {Promise<Array>} Keyword ideas with metrics
 */
export async function getKeywordIdeas(params = {}) {
    try {
        const { apiKey, customerId } = await getGoogleAdsCredentials();

        if (!apiKey || !customerId) {
            throw new Error('Google Ads credentials not configured. Please add them in Settings.');
        }

        const requestBody = {
            customerId: customerId.replace(/-/g, ''), // Remove dashes
            keywordSeed: {
                keywords: params.keywords || []
            },
            geoTargetConstants: params.geoTargets || ['geoTargetConstants/2840'], // US default
            language: params.language || 'languageConstants/1000', // English default
            ...(params.pageUrl && {
                urlSeed: {
                    url: params.pageUrl
                }
            })
        };

        console.log('[Keywords] Fetching keyword ideas:', requestBody);

        const response = await fetch(
            `${GOOGLE_ADS_API_BASE}/customers/${customerId}/keywordPlanIdeas:generate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'developer-token': apiKey // May need separate dev token
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Keywords] Google Ads API Error:', errorText);
            throw new Error(`Google Ads API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Keywords] Keyword ideas received:', data);

        // Transform response to simpler format
        return (data.results || []).map(result => ({
            keyword: result.text,
            avgMonthlySearches: result.keywordIdeaMetrics?.avgMonthlySearches || 0,
            competition: result.keywordIdeaMetrics?.competition || 'UNKNOWN',
            competitionIndex: result.keywordIdeaMetrics?.competitionIndex || 0,
            lowTopOfPageBid: result.keywordIdeaMetrics?.lowTopOfPageBidMicros ?
                (result.keywordIdeaMetrics.lowTopOfPageBidMicros / 1000000).toFixed(2) : null,
            highTopOfPageBid: result.keywordIdeaMetrics?.highTopOfPageBidMicros ?
                (result.keywordIdeaMetrics.highTopOfPageBidMicros / 1000000).toFixed(2) : null
        }));

    } catch (error) {
        console.error('[Keywords] Error fetching keyword ideas:', error);
        throw error;
    }
}

/**
 * Get keyword metrics for specific keywords
 * @param {Array<string>} keywords - List of keywords to get metrics for
 * @returns {Promise<Object>} Keyword metrics data
 */
export async function getKeywordMetrics(keywords) {
    try {
        const { apiKey, customerId } = await getGoogleAdsCredentials();

        if (!apiKey || !customerId) {
            throw new Error('Google Ads credentials not configured.');
        }

        const requestBody = {
            customerId: customerId.replace(/-/g, ''),
            keywordSeed: {
                keywords: keywords
            }
        };

        const response = await fetch(
            `${GOOGLE_ADS_API_BASE}/customers/${customerId}/keywordPlanIdeas:generate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch keyword metrics: ${response.statusText}`);
        }

        const data = await response.json();

        return (data.results || []).reduce((acc, result) => {
            acc[result.text] = {
                volume: result.keywordIdeaMetrics?.avgMonthlySearches || 0,
                competition: result.keywordIdeaMetrics?.competition || 'UNKNOWN',
                cpcLow: result.keywordIdeaMetrics?.lowTopOfPageBidMicros ?
                    (result.keywordIdeaMetrics.lowTopOfPageBidMicros / 1000000).toFixed(2) : null,
                cpcHigh: result.keywordIdeaMetrics?.highTopOfPageBidMicros ?
                    (result.keywordIdeaMetrics.highTopOfPageBidMicros / 1000000).toFixed(2) : null
            };
            return acc;
        }, {});

    } catch (error) {
        console.error('[Keywords] Error fetching keyword metrics:', error);
        throw error;
    }
}

/**
 * Test Search Console API connection
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export async function testGSCConnection() {
    try {
        const { apiKey, propertyUrl } = await getGSCCredentials();

        if (!apiKey || !propertyUrl) {
            return {
                success: false,
                error: 'API credentials not configured'
            };
        }

        // Simple test query for last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const encodedUrl = encodeURIComponent(propertyUrl);
        const response = await fetch(
            `${GSC_API_BASE}/sites/${encodedUrl}/searchAnalytics/query?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                    dimensions: ['query'],
                    rowLimit: 1
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: `API Error: ${response.status}`
            };
        }

        return { success: true };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Test Google Ads API connection
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export async function testGoogleAdsConnection() {
    try {
        const { apiKey, customerId } = await getGoogleAdsCredentials();

        if (!apiKey || !customerId) {
            return {
                success: false,
                error: 'API credentials not configured'
            };
        }

        // Simple test query
        const response = await fetch(
            `${GOOGLE_ADS_API_BASE}/customers/${customerId}/keywordPlanIdeas:generate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    customerId: customerId.replace(/-/g, ''),
                    keywordSeed: {
                        keywords: ['test']
                    }
                })
            }
        );

        if (!response.ok) {
            return {
                success: false,
                error: `API Error: ${response.status}`
            };
        }

        return { success: true };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
