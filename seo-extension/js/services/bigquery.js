/**
 * BigQuery Service - International Google Trends Dataset
 * Handles interactions with Google BigQuery API using OAuth2
 * Uses international_top_terms for ~50 countries of data
 * * **UPDATED to use real BigQuery API methods and imports.**
 */

import { getSettings } from '../core/storage.js';

// --- BigQuery API Constants ---
const BIGQUERY_API_BASE = 'https://bigquery.googleapis.com/bigquery/v2';
const INTERNATIONAL_TABLE = 'bigquery-public-data.google_trends.international_top_terms';

// --- Utility Functions (Provided by User for inclusion) ---

/**
 * Get BigQuery Settings
 */
export async function getBigQuerySettings() {
    const settings = await getSettings(['bigqueryProjectId']);
    return {
        projectId: settings.bigqueryProjectId
    };
}

/**
 * Execute a SQL Query using OAuth2
 * @param {string} query - SQL query string
 * @param {Object} options - Optional parameters (projectId)
 * @returns {Promise<Object>} Query results
 */
export async function executeQuery(query, options = {}) {
    try {
        const settings = await getBigQuerySettings();
        const projectId = options.projectId || settings.projectId;

        if (!projectId) {
            throw new Error('BigQuery Project ID is required. Please configure it in Settings > Keywords.');
        }

        // Get OAuth2 token from auth service (Assumes './auth.js' exists)
        const { getToken } = await import('./auth.js');
        const token = await getToken();

        if (!token) {
            throw new Error('Please sign in to use BigQuery. Go to Profile tab and sign in with Google.');
        }

        const url = `${BIGQUERY_API_BASE}/projects/${projectId}/queries`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                useLegacySql: false,
                timeoutMs: 30000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `BigQuery Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.jobComplete) {
            throw new Error('Query timed out or is still running.');
        }

        return processQueryResults(data);

    } catch (error) {
        console.error('[BigQuery] Query execution failed:', error);
        throw error;
    }
}

/**
 * Process BigQuery API response into a usable format
 */
function processQueryResults(data) {
    if (!data.rows || data.rows.length === 0) {
        return [];
    }

    const schema = data.schema.fields;

    return data.rows.map(row => {
        const rowData = {};
        row.f.forEach((cell, index) => {
            const field = schema[index];
            rowData[field.name] = cell.v;
        });
        return rowData;
    });
}

/**
 * Generate an advanced query to find keyword ideas with metrics
 * @param {Array<string>} keywords - Array of seed keywords
 * @param {Object} options - Query options (limit, countryCode)
 */
export function generateAdvancedKeywordIdeasQuery(keywords, options = {}) {
    const limit = options.limit || 30; // Increased limit for combination
    const countryCode = options.countryCode || null;
    const sanitizedKeywords = keywords.map(k => k.replace(/'/g, "\\'").toLowerCase());

    // Create flexible patterns that match any word from the keyword
    const words = [...new Set(sanitizedKeywords.flatMap(k => k.split(' ')))];
    const wordPatterns = words.map(w => `LOWER(term) LIKE '%${w}%'`).join(' OR ');

    // Country filter SQL
    const countryFilter = countryCode ? `AND country_code = '${countryCode.toUpperCase()}'` : '';

    return `
        WITH keyword_data AS (
            SELECT 
                term as keyword,
                country_code,
                country_name,
                week,
                score,
                rank,
                refresh_date,
                CAST(score * 1000 AS INT64) as monthly_searches,
                CASE 
                    WHEN rank <= 10 THEN 85 + (score / 10)
                    WHEN rank <= 25 THEN 70 + (score / 15)
                    WHEN rank <= 50 THEN 50 + (score / 20)
                    ELSE 30 + (score / 25)
                END as difficulty,
                CASE 
                    WHEN rank <= 15 THEN 'HIGH'
                    WHEN rank <= 40 THEN 'MEDIUM'
                    ELSE 'LOW'
                END as competition,
                ARRAY_LENGTH(SPLIT(term, ' ')) as word_count
            FROM \`${INTERNATIONAL_TABLE}\`
            WHERE refresh_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 180 DAY)
            AND (${wordPatterns})
            AND score > 0
            ${countryFilter}
        ),
        aggregated_data AS (
            SELECT 
                keyword,
                AVG(monthly_searches) as avg_monthly_searches,
                AVG(difficulty) as avg_difficulty,
                MAX(competition) as competition,
                word_count,
                COUNT(*) as data_points,
                STRING_AGG(DISTINCT country_code, ', ' ORDER BY country_code LIMIT 5) as countries
            FROM keyword_data
            GROUP BY keyword, word_count
        )
        SELECT 
            keyword,
            CAST(avg_monthly_searches AS INT64) as monthly_searches,
            CAST(avg_difficulty AS INT64) as difficulty,
            competition,
            word_count,
            data_points,
            countries,
            CASE 
                WHEN competition = 'HIGH' THEN ROUND(1.50 + (RAND() * 3.50), 2)
                WHEN competition = 'MEDIUM' THEN ROUND(0.75 + (RAND() * 1.75), 2)
                ELSE ROUND(0.25 + (RAND() * 1.00), 2)
            END as estimated_cpc,
            CASE 
                WHEN avg_difficulty > 70 THEN 'Top Query'
                WHEN avg_difficulty > 40 THEN 'Topic'
                ELSE 'Related Query'
            END as query_type_raw -- Using query_type_raw for internal mapping
        FROM aggregated_data
        WHERE avg_monthly_searches > 50
        ORDER BY avg_monthly_searches DESC, avg_difficulty ASC
        LIMIT ${limit}
    `;
}

/**
 * Generate phrase match keyword suggestions
 * @param {Array<string>} keywords - Array of seed keywords
 * @param {Object} options - Query options (limit, offset, countryCode)
 */
export function generatePhraseMatchQuery(keywords, options = {}) {
    const limit = options.limit || 30; // Increased limit for combination
    const offset = options.offset || 0;
    const countryCode = options.countryCode || null;
    const sanitizedKeywords = keywords.map(k => k.replace(/'/g, "\\'").toLowerCase());

    // Create patterns for each word in the keywords
    const words = [...new Set(sanitizedKeywords.flatMap(k => k.split(' ')))];
    const wordConditions = words.map(w => `LOWER(term) LIKE '%${w}%'`).join(' AND ');

    // Country filter SQL
    const countryFilter = countryCode ? `AND country_code = '${countryCode.toUpperCase()}'` : '';

    return `
        WITH phrase_matches AS (
            SELECT DISTINCT
                term as keyword,
                week,
                score,
                rank
            FROM \`${INTERNATIONAL_TABLE}\`
            WHERE refresh_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
            AND (${wordConditions})
            AND LOWER(term) NOT IN (${sanitizedKeywords.map(k => `'${k}'`).join(', ')})
            AND score > 0
            ${countryFilter}
        )
        SELECT 
            keyword,
            CAST(AVG(score) * 1000 AS INT64) as monthly_searches,
            CAST(50 + (AVG(rank) / 2) AS INT64) as difficulty,
            CASE 
                WHEN AVG(rank) <= 20 THEN 'HIGH'
                WHEN AVG(rank) <= 45 THEN 'MEDIUM'
                ELSE 'LOW'
            END as competition,
            ARRAY_LENGTH(SPLIT(keyword, ' ')) as word_count,
            'Phrase Match' as query_type_raw
        FROM phrase_matches
        GROUP BY keyword
        HAVING monthly_searches > 50
        ORDER BY monthly_searches DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
}

/**
 * Generate related keywords using word associations
 * @param {Array<string>} keywords - Array of seed keywords
 * @param {Object} options - Query options (limit, offset, countryCode)
 */
export function generateRelatedKeywordsQuery(keywords, options = {}) {
    const limit = options.limit || 30; // Increased limit for combination
    const offset = options.offset || 0;
    const countryCode = options.countryCode || null;
    const sanitizedKeywords = keywords.map(k => k.replace(/'/g, "\\'").toLowerCase());

    const words = [...new Set(sanitizedKeywords.flatMap(k => k.split(' ')))];
    const wordPatterns = words.map(w => `LOWER(term) LIKE '%${w}%'`).join(' OR ');

    // Country filter SQL
    const countryFilter = countryCode ? `AND country_code = '${countryCode.toUpperCase()}'` : '';

    return `
        WITH related_terms AS (
            SELECT DISTINCT
                term as keyword,
                week,
                score,
                rank,
                refresh_date
            FROM \`${INTERNATIONAL_TABLE}\`
            WHERE refresh_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 120 DAY)
            AND (${wordPatterns})
            AND LOWER(term) NOT IN (${sanitizedKeywords.map(k => `'${k}'`).join(', ')})
            AND ARRAY_LENGTH(SPLIT(term, ' ')) >= 1
            AND score > 0
            ${countryFilter}
        )
        SELECT 
            keyword,
            CAST(AVG(score) * 1200 AS INT64) as monthly_searches,
            CAST(40 + (AVG(rank) / 3) AS INT64) as difficulty,
            CASE 
                WHEN AVG(rank) <= 25 THEN 'HIGH'
                WHEN AVG(rank) <= 50 THEN 'MEDIUM'
                ELSE 'LOW'
            END as competition,
            ARRAY_LENGTH(SPLIT(keyword, ' ')) as word_count,
            'Related' as query_type_raw,
            COUNT(*) as relevance_score
        FROM related_terms
        GROUP BY keyword
        HAVING monthly_searches > 50
        ORDER BY relevance_score DESC, monthly_searches DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
}

// --- Main Service Function ---

/**
 * Get comprehensive keyword data (combines all query types)
 * @param {Array<string>} keywords - Array of seed keywords
 * @param {Object} options - Query options (offset, countryCode)
 * @returns {Promise<{results: object[], noDataKeywords: string[], stats: object}>}
 */
export async function getComprehensiveKeywordData(keywords, options = {}) {
    const offset = options.offset || 0;
    const countryCode = options.countryCode || null;
    // Map internal query types to the public-facing UI types (Topic, Top Query, Related Query)
    const typeMap = {
        'exact': 'Topic', // Highly relevant match is treated as a Top Topic
        'phrase': 'Top Query',
        'related': 'Related Query'
    };
    const originalKeywords = keywords.map(k => k.toLowerCase());

    // NOTE: Time period and Category filters are currently handled only in the UI/mock logic.
    // The provided SQL queries focus on country, keyword text, and time intervals (180/90/120 days).

    const queries = [
        // Exact/Advanced (maps to 'Topic' in UI)
        { type: 'exact', query: generateAdvancedKeywordIdeasQuery(keywords, { limit: 30, countryCode }) },
        // Phrase Match (maps to 'Top Query' in UI)
        { type: 'phrase', query: generatePhraseMatchQuery(keywords, { limit: 30, offset, countryCode }) },
        // Related (maps to 'Related Query' in UI)
        { type: 'related', query: generateRelatedKeywordsQuery(keywords, { limit: 30, offset, countryCode }) }
    ];

    const results = await Promise.all(
        queries.map(async ({ type, query }) => {
            try {
                const data = await executeQuery(query);
                return data.map(item => ({
                    ...item,
                    // Use the UI-friendly type
                    query_type: typeMap[type] || 'Related Query',
                    // Clean up internal property
                    query_type_raw: undefined
                }));
            } catch (error) {
                console.warn(`[BigQuery] ${type} query failed:`, error);
                return [];
            }
        })
    );

    // Combine and deduplicate results
    const allResults = results.flat();
    const uniqueKeywords = new Map();

    allResults.forEach(item => {
        const key = item.keyword.toLowerCase();
        // Keep the result with the higher monthly searches (score) if duplicates exist
        if (!uniqueKeywords.has(key) ||
            (uniqueKeywords.get(key).monthly_searches < item.monthly_searches)) {
            uniqueKeywords.set(key, item);
        }
    });

    const foundResults = Array.from(uniqueKeywords.values());

    // Track which original keywords had no data
    const foundKeywordTerms = foundResults.map(r => r.keyword.toLowerCase());
    const keywordsWithNoData = originalKeywords.filter(kw => {
        // A keyword has data if any result either contains the keyword or contains all words of the keyword
        return !foundKeywordTerms.some(found =>
            found.includes(kw) || kw.split(' ').every(word => found.includes(word))
        );
    });

    return {
        results: foundResults,
        noDataKeywords: keywordsWithNoData,
        stats: {
            total: foundResults.length,
            // Stats counted by the new UI query types
            exact: foundResults.filter(r => r.query_type === 'Topic').length,
            phrase: foundResults.filter(r => r.query_type === 'Top Query').length,
            related: foundResults.filter(r => r.query_type === 'Related Query').length,
            noData: keywordsWithNoData.length
        }
    };
}