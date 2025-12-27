/**
 * Keywords Insights Service
 * Handles API calls to Google Search Console and Google Ads APIs
 */

import { getSettings, saveSettings } from '../core/storage.js';
import { getToken, signOut } from './auth.js';

// API Base URLs
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';

let lastFetchedData = null;

/**
 * Get cached keywords data for export
 */
export function getKeywordsData() {
    return lastFetchedData;
}

/**
 * Fetch Search Console Performance Data
 * @param {Object} params - { domain, startDate, endDate, dimensions, limit }
 * @returns {Promise<Object>} Search Console data (queries, pages, totals)
 */
export async function getSearchConsoleData(params = {}) {
    try {
        const accessToken = await getToken();

        if (!accessToken) {
            throw new Error('Google Search Console not connected. Please sign in via Profile.');
        }

        if (!params.domain) {
            throw new Error('Domain not specified.');
        }

        // Format property URL (sc-domain:example.com for domain properties)
        // If it starts with http, use as is, otherwise assume domain property
        const propertyUrl = params.domain.startsWith('http') ?
            params.domain : `sc-domain:${params.domain}`;

        // Default to last 28 days
        const endDate = params.endDate || new Date().toISOString().split('T')[0];
        const startDate = params.startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const rowLimit = params.limit || 10;

        const encodedUrl = encodeURIComponent(propertyUrl);
        const baseUrl = `${GSC_API_BASE}/sites/${encodedUrl}/searchAnalytics/query`;

        // Helper to fetch specific dimensions
        const fetchData = async (dimensions) => {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    dimensions,
                    rowLimit
                })
            });

            if (!response.ok) {
                // Handle 401 (Token Expired)
                if (response.status === 401) {
                    await signOut(); // Clear expired token
                    throw new Error('Access token expired. Please sign in again in Profile.');
                }

                const errorText = await response.text();
                // Handle common errors
                if (response.status === 403) {
                    throw new Error('Access denied. Please ensure you have access to this property in Search Console.');
                } else if (response.status === 404) {
                    throw new Error('Property not found in Search Console. Please ensure you have verified this domain.');
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        };

        // Fetch Queries and Pages in parallel
        const [queriesData, pagesData] = await Promise.all([
            fetchData(['query']),
            fetchData(['page'])
        ]);

        const result = {
            domain: params.domain,
            dateRange: { startDate, endDate },
            queries: queriesData.rows || [],
            pages: pagesData.rows || [],
            totals: {
                // simple aggregation from queries data for now
                clicks: (queriesData.rows || []).reduce((sum, row) => sum + row.clicks, 0),
                impressions: (queriesData.rows || []).reduce((sum, row) => sum + row.impressions, 0),
                ctr: (queriesData.rows || []).reduce((sum, row) => sum + row.ctr, 0) / ((queriesData.rows || []).length || 1)
            }
        };

        lastFetchedData = result;
        return result;

    } catch (error) {
        console.error('[Keywords] Error fetching Search Console data:', error);
        throw error;
    }
}

/**
 * Test Search Console API connection
 * Uses sites.list to verify API key validity without needing a specific property
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export async function testGSCConnection() {
    try {
        const accessToken = await getToken();

        if (!accessToken) {
            return {
                success: false,
                error: 'Not signed in'
            };
        }

        // List sites to verify access
        const response = await fetch(
            `${GSC_API_BASE}/sites`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                return { success: false, error: 'Session expired. Please sign in again.' };
            }
            return { success: false, error: `API Error: ${response.status}` };
        }

        return { success: true };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
