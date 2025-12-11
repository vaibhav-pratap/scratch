/**
 * Google Ads API Service
 * Handles Keyword Planner, Forecasts, and Historical Metrics
 */

import { getSettings } from '../core/storage.js';
import { getToken } from './auth.js';

const GOOGLE_ADS_API_VERSION = 'v16';
const BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

/**
 * Get Keyword Ideas
 * @param {Object} params - { keywords, url, location, language }
 * @returns {Promise<Array>} Keyword ideas with metrics
 */
export async function getKeywordIdeas(params) {
    const { devToken, customerId } = await getSettings(['googleAdsDevToken', 'googleAdsCustomerId']);

    if (!devToken || !customerId) {
        throw new Error('Google Ads credentials not configured. Please add Developer Token and Customer ID in Settings.');
    }

    const token = await getToken();
    if (!token) {
        throw new Error('Not authenticated. Please sign in via Profile.');
    }

    const { keywords = [], url = '', location = '2840', language = '1000' } = params;

    const requestBody = {
        customerId,
        keywordSeed: keywords.length > 0 ? { keywords } : undefined,
        urlSeed: url ? { url } : undefined,
        geoTargetConstants: [`geoTargetConstants/${location}`],
        languageConstant: `languageConstants/${language}`,
        keywordPlanNetwork: 'GOOGLE_SEARCH'
    };

    try {
        const response = await fetch(
            `${BASE_URL}/customers/${customerId}/googleAdsService:generateKeywordIdeas`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'developer-token': devToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch keyword ideas');
        }

        const data = await response.json();
        return parseKeywordIdeas(data);

    } catch (error) {
        console.error('[Google Ads] Error fetching keyword ideas:', error);
        throw error;
    }
}

/**
 * Get Keyword Forecasts
 * @param {Object} params - { keywords, location, budget, dateRange }
 * @returns {Promise<Object>} Forecast metrics
 */
export async function getKeywordForecasts(params) {
    const { devToken, customerId } = await getSettings(['googleAdsDevToken', 'googleAdsCustomerId']);

    if (!devToken || !customerId) {
        throw new Error('Google Ads credentials not configured.');
    }

    const token = await getToken();
    if (!token) {
        throw new Error('Not authenticated.');
    }

    // Implementation: GenerateKeywordForecastMetrics
    // This requires campaign structure and is more complex
    // Placeholder for now
    throw new Error('Forecast functionality coming soon - requires campaign setup');
}

/**
 * Parse keyword ideas response
 */
function parseKeywordIdeas(data) {
    if (!data.results) return [];

    return data.results.map(result => {
        const metrics = result.keywordIdeaMetrics || {};

        return {
            keyword: metrics.text || '',
            searchVolume: metrics.avgMonthlySearches || 0,
            competition: metrics.competition || 'UNKNOWN',
            competitionIndex: metrics.competitionIndex || 0,
            lowTopOfPageBid: metrics.lowTopOfPageBidMicros ?
                (metrics.lowTopOfPageBidMicros / 1000000).toFixed(2) : '0.00',
            highTopOfPageBid: metrics.highTopOfPageBidMicros ?
                (metrics.highTopOfPageBidMicros / 1000000).toFixed(2) : '0.00',

            // Historical metrics (last 12 months)
            monthlySearchVolumes: (metrics.monthlySearchVolumes || []).map(m => ({
                year: m.year,
                month: m.month,
                searches: m.monthlySearches || 0
            })),

            // Keyword difficulty (derived from competition index and CPC)
            difficulty: calculateKeywordDifficulty(
                metrics.competitionIndex || 0,
                metrics.highTopOfPageBidMicros || 0
            ),

            // Trend analysis
            yearOverYearChange: metrics.yearOverYearGrowth || null,

            // Additional metrics
            avgCpc: metrics.avgMonthlySearches && metrics.highTopOfPageBidMicros ?
                ((metrics.highTopOfPageBidMicros + (metrics.lowTopOfPageBidMicros || 0)) / 2000000).toFixed(2) : '0.00'
        };
    });
}

/**
 * Calculate keyword difficulty score (0-100)
 * Based on competition index and CPC
 */
function calculateKeywordDifficulty(competitionIndex, highBidMicros) {
    // Base difficulty from competition index (0-100)
    let difficulty = competitionIndex;

    // Adjust based on CPC (higher CPC = more competitive)
    const cpc = highBidMicros / 1000000;
    if (cpc > 10) difficulty = Math.min(100, difficulty + 20);
    else if (cpc > 5) difficulty = Math.min(100, difficulty + 10);
    else if (cpc > 2) difficulty = Math.min(100, difficulty + 5);

    return Math.round(difficulty);
}

/**
 * Test API Connection
 */
export async function testGoogleAdsConnection() {
    try {
        await getKeywordIdeas({ keywords: ['test'] });
        return { success: true, message: 'Connected successfully!' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}
