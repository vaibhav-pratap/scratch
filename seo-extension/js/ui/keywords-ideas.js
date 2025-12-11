/**
 * Keywords Ideas UI - Updated for Google Trends (BigQuery) Functionality
 * Queries BigQuery for Trends-based search terms, topics, and queries (relative popularity).
 * Retains original filename but implements "Keyword Trends" features.
 * **UPDATED to handle multi-keyword input.**
 */

import { getComprehensiveKeywordData } from '../services/bigquery.js';
import { getSettings, saveSettings } from '../core/storage.js';

let currentResults = [];
let filteredResults = [];
let allCachedResults = [];
let currentKeywords = [];
let currentPage = 0;
let currentCountryCode = null;
const RESULTS_PER_PAGE = 20;

export function renderKeywordsIdeas(container) {
    container.innerHTML = `
        <div class="keywords-ideas-wrapper" style="max-width: 1400px; margin: 0 auto;">
            <div class="planner-header" style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 8px 0; font-size: 24px;">📈 Keyword Trends (BigQuery - Google Trends)</h2>
                <p class="text-xs text-secondary">Discover trending terms and topics based on Google Trends Public Data. Results show relative popularity (Score 0-100), not absolute volume.</p>
            </div>

            <div class="card" style="margin-bottom: 24px; padding: 20px;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Trends Filters & Seed Term(s)</h3>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Seed Terms (Comma-Separated, Optional)</label>
                    <textarea id="bq-keywords-input" class="data-value" placeholder="e.g., iphone 17, cricket world cup, digital marketing" style="width: 100%; min-height: 50px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; resize: vertical;"></textarea>
                    <p class="text-xs text-secondary" style="margin-top: 4px;">Primary data source is Google Trends Top Terms, which focuses on popular, broad topics.</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Country</label>
                        <select id="bq-country-select" class="data-value" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--md-sys-color-surface); font-size: 14px;">
                            <option value="US">🇺🇸 United States</option>
                            <option value="IN" selected>🇮🇳 India</option>
                            <option value="GB">🇬🇧 United Kingdom</option>
                            <option value="CA">🇨🇦 Canada</option>
                            <option value="AU">🇦🇺 Australia</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Time Period</label>
                        <select id="bq-time-period-select" class="data-value" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--md-sys-color-surface); font-size: 14px;">
                            <option value="past_12_months" selected>Past 12 months</option>
                            <option value="past_90_days">Past 90 days</option>
                            <option value="past_7_days">Past 7 days</option>
                            <option value="past_hour">Past Hour</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Category</label>
                        <select id="bq-category-select" class="data-value" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--md-sys-color-surface); font-size: 14px;">
                            <option value="all" selected>All categories</option>
                            <option value="Business">Business & Industrial</option>
                            <option value="Tech">Computers & Electronics</option>
                            <option value="Sports">Sports</option>
                            <option value="News">News</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Search Type</label>
                        <select id="bq-search-type-select" class="data-value" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--md-sys-color-surface); font-size: 14px;">
                            <option value="web_search" selected>Web Search</option>
                            <option value="image_search">Image Search</option>
                            <option value="youtube_search">YouTube Search</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button id="btn-bq-get-ideas" class="action-btn primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px; vertical-align: middle;">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        Get Trending Data
                    </button>
                    <button id="btn-bq-clear" class="action-btn secondary">Clear</button>
                </div>
            </div>

            <div id="bq-filters-section" style="display: none; margin-bottom: 24px;">
                <div class="card" style="padding: 20px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Trends Result Filters</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">Min. Popularity Score (0-100)</label>
                            <input type="number" id="filter-min-searches" class="data-value" placeholder="50" min="0" max="100" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px;">
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">Max. Difficulty</label>
                            <input type="number" id="filter-max-difficulty" class="data-value" placeholder="100" min="0" max="100" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px;">
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">Competition (Mock)</label>
                            <select id="filter-competition" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--md-sys-color-surface);">
                                <option value="">All</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">Trend Type</label>
                            <select id="filter-query-type" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--md-sys-color-surface);">
                                <option value="">All</option>
                                <option value="Topic">Top Topic</option>
                                <option value="Top Query">Top Query</option>
                                <option value="Related Query">Related Query</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin-top: 16px; display: flex; gap: 12px;">
                        <button id="btn-apply-filters" class="action-btn primary small">Apply Filters</button>
                        <button id="btn-reset-filters" class="action-btn secondary small">Reset</button>
                    </div>
                </div>
            </div>

            <div id="bq-loading" style="display: none; text-align: center; padding: 40px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid var(--md-sys-color-primary-container); border-top-color: var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 16px; color: var(--md-sys-color-on-surface-variant);">Querying BigQuery for trending topics and popular queries...</p>
            </div>

            <div id="bq-error" class="card" style="display: none; padding: 16px; background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); margin-bottom: 24px;"></div>

            <div id="bq-results-section" style="display: none;">
                <div id="no-data-keywords" style="display: none;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px;">
                    <div class="card" style="padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--md-sys-color-primary);" id="stat-total">0</div>
                        <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px;">Total Trends Found</div>
                    </div>
                    <div class="card" style="padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--md-sys-color-secondary);" id="stat-exact">0</div>
                        <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px;">Top Topics</div>
                    </div>
                    <div class="card" style="padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--md-sys-color-tertiary);" id="stat-phrase">0</div>
                        <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px;">Top Queries</div>
                    </div>
                    <div class="card" style="padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #34a853;" id="stat-related">0</div>
                        <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px;">Related Queries</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 18px;">Trends Results (Showing <span id="results-count">0</span> of <span id="total-cached">0</span>)</h3>
                    <div style="display: flex; gap: 8px;">
                        <button id="btn-bq-export" class="action-btn secondary small">Export CSV</button>
                        <button id="btn-toggle-filters" class="action-btn secondary small">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px; vertical-align: middle;">
                                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                            </svg>
                            Filters
                        </button>
                    </div>
                </div>
                
                <div id="bq-results-content" style="overflow-x: auto;"></div>

                <div id="pagination-controls" style="margin-top: 20px; text-align: center; display: none;">
                    <button id="btn-load-more" class="action-btn primary" style="min-width: 200px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px; vertical-align: middle;">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        Load More Trends (20)
                    </button>
                    <p class="text-xs text-secondary" style="margin-top: 8px;">Cached results are shown first.</p>
                </div>
            </div>
        </div>
    `;

    initializeListeners();
    loadCachedResults();
}

function initializeListeners() {
    document.getElementById('btn-bq-get-ideas')?.addEventListener('click', handleGetIdeas);
    document.getElementById('btn-bq-clear')?.addEventListener('click', handleClear);
    document.getElementById('btn-bq-export')?.addEventListener('click', handleExport);
    document.getElementById('btn-apply-filters')?.addEventListener('click', applyFilters);
    document.getElementById('btn-reset-filters')?.addEventListener('click', resetFilters);
    document.getElementById('btn-toggle-filters')?.addEventListener('click', toggleFilters);
    document.getElementById('btn-load-more')?.addEventListener('click', handleLoadMore);
}

function getCountryCode() {
    return document.getElementById('bq-country-select')?.value || null;
}

function getTimePeriod() {
    return document.getElementById('bq-time-period-select')?.value || 'past_12_months';
}

function getCategory() {
    return document.getElementById('bq-category-select')?.value || 'all';
}

function getSearchType() {
    return document.getElementById('bq-search-type-select')?.value || 'web_search';
}


async function loadCachedResults() {
    try {
        const settings = await getSettings(['trendCache']);
        if (settings.trendCache) {
            allCachedResults = JSON.parse(settings.trendCache);
        }
    } catch (error) {
        console.error('[Keyword Trends] Error loading cache:', error);
    }
}

async function saveCachedResults() {
    try {
        await saveSettings({ trendCache: JSON.stringify(allCachedResults) });
    } catch (error) {
        console.error('[Keyword Trends] Error saving cache:', error);
    }
}

async function handleGetIdeas() {
    const input = document.getElementById('bq-keywords-input');
    const rawValue = input.value.trim();
    // Use all keywords to influence the Related Queries mock
    const keywords = rawValue.split(',').map(k => k.trim()).filter(k => k.length > 0);

    currentKeywords = keywords;
    currentPage = 0;
    currentResults = [];
    filteredResults = [];
    currentCountryCode = getCountryCode();

    showLoading(true);
    hideError();
    document.getElementById('bq-results-section').style.display = 'none';
    document.getElementById('bq-filters-section').style.display = 'none';

    try {
        // Cache key includes all keywords
        const cacheKey = [
            keywords.sort().join('|').toLowerCase(),
            currentCountryCode,
            getTimePeriod(),
            getCategory(),
            getSearchType()
        ].join('::');

        const cached = allCachedResults.filter(item => item.cache_key === cacheKey);

        let data;
        const queryOptions = {
            offset: 0,
            countryCode: currentCountryCode,
            timePeriod: getTimePeriod(),
            category: getCategory(),
            searchType: getSearchType()
        };

        if (cached.length > 0) {
            console.log('[Keyword Trends] Using cached results:', cached.length);
            data = {
                results: cached,
                noDataKeywords: [],
                stats: {
                    total: cached.length,
                    exact: cached.filter(r => r.query_type === 'Topic').length,
                    phrase: cached.filter(r => r.query_type === 'Top Query').length,
                    related: cached.filter(r => r.query_type === 'Related Query').length,
                    noData: 0
                }
            };
        } else {
            // Fetch new results with full filter set
            data = await getComprehensiveKeywordData(keywords, queryOptions);

            const taggedResults = data.results.map(r => ({
                ...r,
                seed_keywords: keywords,
                fetched_at: Date.now(),
                country_code: currentCountryCode,
                cache_key: cacheKey
            }));

            allCachedResults = [...allCachedResults, ...taggedResults];
            await saveCachedResults();

            data.results = taggedResults;
        }

        currentResults = data.results;
        filteredResults = data.results;

        displayNoDataKeywords(data.noDataKeywords);

        updateStats(data.stats);
        displayPaginatedResults();

        showLoading(false);
        document.getElementById('bq-results-section').style.display = 'block';

    } catch (error) {
        showLoading(false);
        showError(error.message);
    }
}

async function handleLoadMore() {
    if (!currentKeywords || currentKeywords.length === 0) return;

    showLoading(true);

    try {
        currentPage++;
        const offset = currentPage * RESULTS_PER_PAGE;

        const queryOptions = {
            offset,
            countryCode: currentCountryCode,
            timePeriod: getTimePeriod(),
            category: getCategory(),
            searchType: getSearchType()
        };

        const data = await getComprehensiveKeywordData(currentKeywords, queryOptions);

        if (data.results.length === 0) {
            showError('No more results available from BigQuery.');
            showLoading(false);
            currentPage--;
            return;
        }

        const cacheKey = [
            currentKeywords.sort().join('|').toLowerCase(),
            currentCountryCode,
            getTimePeriod(),
            getCategory(),
            getSearchType()
        ].join('::');

        const taggedResults = data.results.map(r => ({
            ...r,
            seed_keywords: currentKeywords,
            fetched_at: Date.now(),
            country_code: currentCountryCode,
            cache_key: cacheKey
        }));

        allCachedResults = [...allCachedResults, ...taggedResults];
        await saveCachedResults();

        currentResults = [...currentResults, ...taggedResults];

        applyFilters(false);
        displayPaginatedResults();

        showLoading(false);

    } catch (error) {
        showLoading(false);
        currentPage--;
        showError(error.message);
    }
}

function displayPaginatedResults() {
    const displayResults = filteredResults.slice(0, (currentPage + 1) * RESULTS_PER_PAGE);

    renderResults(displayResults);
    document.getElementById('total-cached').textContent = filteredResults.length;

    const paginationControls = document.getElementById('pagination-controls');
    if (displayResults.length < filteredResults.length) {
        paginationControls.style.display = 'block';
        document.getElementById('btn-load-more').textContent = `Load More Trends (${RESULTS_PER_PAGE})`;
    } else if (filteredResults.length > 0) {
        paginationControls.style.display = 'none';
    } else {
        paginationControls.style.display = 'none';
    }
}

function updateStats(stats) {
    document.getElementById('stat-total').textContent = stats.total || 0;
    // Update labels to reflect Topic/Query
    document.getElementById('stat-exact').textContent = stats.exact || 0; // Top Topics
    document.getElementById('stat-phrase').textContent = stats.phrase || 0; // Top Queries
    document.getElementById('stat-related').textContent = stats.related || 0; // Related Queries
}

function displayNoDataKeywords(keywords) {
    const container = document.getElementById('no-data-keywords');
    if (!container) return;

    if (!keywords || keywords.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = `
        <div class="card" style="padding: 16px; background: rgba(251, 188, 4, 0.1); border-left: 4px solid #fbbc04; margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #ea8600;">
                ⚠️ Terms with No Data (${keywords.length})
            </h4>
            <p style="margin: 0 0 12px 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                The following terms did not register as a Top or Rising Query in the Google Trends dataset for the selected filters.
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${keywords.map(kw => `
                    <span style="padding: 4px 12px; background: rgba(251, 188, 4, 0.2); border-radius: 12px; font-size: 12px; font-weight: 500; color: #ea8600;">
                        ${escapeHTML(kw)}
                    </span>
                `).join('')}
            </div>
        </div>
    `;
}

function renderResults(results) {
    const container = document.getElementById('bq-results-content');
    document.getElementById('results-count').textContent = results.length;

    if (results.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--md-sys-color-on-surface-variant);">No results found. Try adjusting filters.</p>';
        return;
    }

    const rows = results.map(kw => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 12px; font-weight: 500;">${escapeHTML(kw.keyword)}</td>
            <td style="padding: 12px; text-align: right;">${formatNumber(kw.monthly_searches || 0)}</td>
            <td style="padding: 12px; text-align: center;">${createDifficultyBadge(kw.difficulty || 0)}</td>
            <td style="padding: 12px; text-align: center;">${createCompetitionBadge(kw.competition || 'UNKNOWN')}</td>
            <td style="padding: 12px; text-align: center;">${kw.word_count || 1}</td>
            <td style="padding: 12px; text-align: center;">${createMatchTypeBadge(kw.query_type || 'Related Query')}</td>
            <td style="padding: 12px; text-align: right; color: var(--md-sys-color-tertiary);">$${formatNumber(kw.estimated_cpc || 0, 2)}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; background: var(--md-sys-color-surface); border-radius: 8px; overflow: hidden;">
            <thead style="background: var(--md-sys-color-surface-variant);">
                <tr>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 13px;">Search Term / Topic</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 13px;">Popularity Score (0-100)</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 13px;">Difficulty (Mock)</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 13px;">Competition (Mock)</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 13px;">Words</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 13px;">Trend Type</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 13px;">Est. CPC (Mock)</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function applyFilters(resetPage = true) {
    // Renamed min-searches to min-score for clarity
    const minScore = parseInt(document.getElementById('filter-min-searches').value) || 0;
    const maxDifficulty = parseInt(document.getElementById('filter-max-difficulty').value) || 100;
    const competition = document.getElementById('filter-competition').value;
    const queryType = document.getElementById('filter-query-type').value;

    filteredResults = currentResults.filter(item => {
        if (item.monthly_searches < minScore) return false;
        if (item.difficulty > maxDifficulty) return false;
        if (competition && item.competition !== competition) return false;
        if (queryType && item.query_type !== queryType) return false;
        return true;
    });

    if (resetPage) {
        currentPage = 0;
    }
    displayPaginatedResults();
}

function resetFilters() {
    document.getElementById('filter-min-searches').value = '';
    document.getElementById('filter-max-difficulty').value = '';
    document.getElementById('filter-competition').value = '';
    document.getElementById('filter-query-type').value = '';

    applyFilters();
}

function toggleFilters() {
    const filtersSection = document.getElementById('bq-filters-section');
    filtersSection.style.display = filtersSection.style.display === 'none' ? 'block' : 'none';
}

function handleClear() {
    document.getElementById('bq-keywords-input').value = '';
    document.getElementById('bq-results-section').style.display = 'none';
    document.getElementById('bq-filters-section').style.display = 'none';
    currentResults = [];
    filteredResults = [];
    currentKeywords = [];
    currentPage = 0;
    currentCountryCode = null;
    hideError();
}

function handleExport() {
    const data = filteredResults.length > 0 ? filteredResults : currentResults;
    if (!data || data.length === 0) return;

    const headers = ['Search Term / Topic', 'Popularity Score (0-100)', 'Difficulty (Mock)', 'Competition (Mock)', 'Words', 'Trend Type', 'Est. CPC (Mock)', 'Country Code', 'Seed Terms'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            `"${row.keyword}"`,
            row.monthly_searches || 0,
            row.difficulty || 0,
            row.competition || 'UNKNOWN',
            row.word_count || 1,
            row.query_type || 'Related Query',
            formatNumber(row.estimated_cpc || 0, 2),
            row.country_code || '',
            // Join multiple seed keywords with a semicolon for CSV safety
            `"${(row.seed_keywords || []).join(';')}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword-trends-bigquery-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function createDifficultyBadge(difficulty) {
    const color = difficulty >= 70 ? '#ea4335' : difficulty >= 40 ? '#fbbc04' : '#34a853';
    return `<span style="padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${color}20; color: ${color};">${difficulty}/100</span>`;
}

function createCompetitionBadge(level) {
    const colors = {
        LOW: { bg: 'rgba(52,168,83,0.2)', text: '#34a853' },
        MEDIUM: { bg: 'rgba(251,188,4,0.2)', text: '#fbbc04' },
        HIGH: { bg: 'rgba(234,67,53,0.2)', text: '#ea4335' },
        UNKNOWN: { bg: 'rgba(128,128,128,0.2)', text: '#5f6368' }
    };
    const color = colors[level] || colors.UNKNOWN;
    return `<span style="padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${color.bg}; color: ${color.text};">${level}</span>`;
}

function createMatchTypeBadge(type) {
    const colors = {
        'Topic': { bg: 'rgba(26,115,232,0.2)', text: '#1a73e8' }, // Top Topic
        'Top Query': { bg: 'rgba(138,43,226,0.2)', text: '#8a2be2' }, // Top Query
        'Related Query': { bg: 'rgba(52,168,83,0.2)', text: '#34a853' } // Related Query
    };
    const color = colors[type] || colors['Related Query'];
    return `<span style="padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${color.bg}; color: ${color.text};">${type}</span>`;
}

function showLoading(show) {
    document.getElementById('bq-loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const el = document.getElementById('bq-error');
    el.textContent = message;
    el.style.display = 'block';
}

function hideError() {
    document.getElementById('bq-error').style.display = 'none';
}

function formatNumber(num, decimals = 0) {
    if (typeof num !== 'number' || isNaN(num)) return decimals === 2 ? '0.00' : '0';
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}