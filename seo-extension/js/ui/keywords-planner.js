/**
 * Keywords Planner UI - Complete Implementation
 * Google Ads Keyword Planner with Ideas, Historical Data, and Difficulty Analysis
 */

import { getKeywordIdeas } from '../services/google-ads.js';
import { getSettings } from '../core/storage.js';
import { isAuthenticated } from '../services/auth.js';

let currentResults = [];

export async function renderKeywordsPlanner(container) {
    const isAuth = await isAuthenticated();
    const settings = await getSettings(['googleAdsDevToken', 'googleAdsCustomerId']);
    const hasCredentials = !!(settings.googleAdsDevToken && settings.googleAdsCustomerId);

    container.innerHTML = createHTML(isAuth, hasCredentials);
    initializeEventListeners();
}

function createHTML(isAuth, hasCredentials) {
    if (!isAuth || !hasCredentials) {
        return createSetupNotice(isAuth);
    }

    return `
        <div class="keywords-planner-wrapper" style="padding: 20px; max-width: 1400px; margin: 0 auto;">
            ${createHeader()}
            ${createInputForm()}
            ${createResultsTabs()}
            ${createLoadingState()}
            ${createErrorState()}
        </div>
    `;
}

function createSetupNotice(isAuth) {
    const message = isAuth ? 'Please add your Google Ads credentials in Settings.' : 'Please sign in via the Profile tab first.';
    const buttonText = isAuth ? 'Go to Settings' : 'Go to Profile';

    return `
        <div class="keywords-planner-wrapper" style="max-width: 1400px; margin: 0 auto;">
            <div class="planner-header" style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 8px 0; font-size: 24px;">Keywords Planner</h2>
                <p class="text-xs text-secondary">Research keyword ideas, trends, and difficulty using Google Ads API</p>
            </div>
            <div class="setup-notice" style="padding: 24px; background: var(--md-sys-color-surface-variant); border-radius: 12px; text-align: center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="margin: 0 auto 16px; color: var(--md-sys-color-warning);">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <h3 style="margin: 0 0 8px 0;">Setup Required</h3>
                <p style="margin: 0 0 16px 0; color: var(--md-sys-color-on-surface-variant);">${message}</p>
                <button id="btn-goto-setup" class="action-btn primary">${buttonText}</button>
            </div>
        </div>
    `;
}

function createHeader() {
    return `
        <div class="planner-header" style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; font-size: 24px;">Keywords Planner</h2>
            <p class="text-xs text-secondary">Research keyword ideas, search trends, and competition analysis</p>
        </div>
    `;
}

function createInputForm() {
    return `
        <div class="planner-input card" style="margin-bottom: 24px; padding: 20px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Get Keyword Data</h3>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Seed Keywords *</label>
                <textarea id="keyword-seeds" class="data-value" placeholder="Enter keywords, one per line...
Example:
seo tools
keyword research
content marketing" style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; resize: vertical;"></textarea>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Website URL (Optional)</label>
                <input type="url" id="keyword-url" class="data-value" placeholder="https://example.com" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px;">
                <p class="text-xs text-secondary" style="margin-top: 4px;">Get related keywords from this website</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Location</label>
                    <select id="keyword-location" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--md-sys-color-surface);">
                        <option value="2840">United States</option>
                        <option value="2826">United Kingdom</option>
                        <option value="2124">Canada</option>
                        <option value="2036">Australia</option>
                        <option value="2356">India</option>
                        <option value="2276">Germany</option>
                        <option value="2250">France</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Language</label>
                    <select id="keyword-language" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--md-sys-color-surface);">
                        <option value="1000">English</option>
                        <option value="1003">Spanish</option>
                        <option value="1002">French</option>
                        <option value="1001">German</option>
                        <option value="1023">Chinese (Simplified)</option>
                        <option value="1009">Hindi</option>
                    </select>
                </div>
            </div>

            <div style="display: flex; gap: 12px;">
                <button id="btn-get-keywords" class="action-btn primary" style="flex: 1;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px; vertical-align: middle;">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    Get Keyword Data
                </button>
                <button id="btn-clear-form" class="action-btn secondary">Clear</button>
            </div>
        </div>
    `;
}

function createResultsTabs() {
    return `
        <div id="results-section" style="display: none;">
            <div class="results-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 0;">
                <button class="result-tab active" data-tab="ideas" style="padding: 12px 24px; background: none; border: none; border-bottom: 3px solid var(--md-sys-color-primary); font-weight: 600; color: var(--md-sys-color-primary); cursor: pointer; margin-bottom: -2px;">
                    Keyword Ideas
                </button>
                <button class="result-tab" data-tab="historical" style="padding: 12px 24px; background: none; border: none; border-bottom: 3px solid transparent; font-weight: 500; color: var(--md-sys-color-on-surface-variant); cursor: pointer; margin-bottom: -2px;">
                    Historical Data
                </button>
                <button class="result-tab" data-tab="difficulty" style="padding: 12px 24px; background: none; border: none; border-bottom: 3px solid transparent; font-weight: 500; color: var(--md-sys-color-on-surface-variant); cursor: pointer; margin-bottom: -2px;">
                    Difficulty Analysis
                </button>
            </div>

            <div id="tab-ideas" class="tab-content active">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 18px;">Keyword Ideas (<span id="results-count">0</span>)</h3>
                    <button id="btn-export-ideas" class="action-btn secondary small">Export CSV</button>
                </div>
                <div id="ideas-content" style="overflow-x: auto;"></div>
            </div>

            <div id="tab-historical" class="tab-content" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 18px;">Historical Search Trends</h3>
                    <button id="btn-export-historical" class="action-btn secondary small">Export CSV</button>
                </div>
                <div id="historical-content"></div>
            </div>

            <div id="tab-difficulty" class="tab-content" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 18px;">Keyword Difficulty & Competition</h3>
                    <button id="btn-export-difficulty" class="action-btn secondary small">Export CSV</button>
                </div>
                <div id="difficulty-content" style="overflow-x: auto;"></div>
            </div>
        </div>
    `;
}

function createLoadingState() {
    return `
        <div id="loading-state" style="display: none; text-align: center; padding: 60px 20px;">
            <div style="display: inline-block; width: 48px; height: 48px; border: 4px solid var(--md-sys-color-primary-container); border-top-color: var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px; font-size: 16px; color: var(--md-sys-color-on-surface-variant);">Fetching keyword data from Google Ads...</p>
        </div>
    `;
}

function createErrorState() {
    return `
        <div id="error-state" class="card" style="display: none; padding: 20px; background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);"></div>
    `;
}

function initializeEventListeners() {
    const gotoBtn = document.getElementById('btn-goto-setup');
    if (gotoBtn) {
        gotoBtn.addEventListener('click', handleGotoSetup);
    }

    const getBtn = document.getElementById('btn-get-keywords');
    if (getBtn) {
        getBtn.addEventListener('click', handleGetKeywords);
    }

    const clearBtn = document.getElementById('btn-clear-form');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearForm);
    }

    document.querySelectorAll('.result-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    const exportIdeasBtn = document.getElementById('btn-export-ideas');
    if (exportIdeasBtn) {
        exportIdeasBtn.addEventListener('click', () => exportToCSV('ideas'));
    }

    const exportHistoricalBtn = document.getElementById('btn-export-historical');
    if (exportHistoricalBtn) {
        exportHistoricalBtn.addEventListener('click', () => exportToCSV('historical'));
    }

    const exportDifficultyBtn = document.getElementById('btn-export-difficulty');
    if (exportDifficultyBtn) {
        exportDifficultyBtn.addEventListener('click', () => exportToCSV('difficulty'));
    }
}

function handleGotoSetup() {
    isAuthenticated().then(isAuth => {
        const tab = isAuth ? 'settings' : 'profile';
        document.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab } }));
    });
}

function handleClearForm() {
    const seedsInput = document.getElementById('keyword-seeds');
    const urlInput = document.getElementById('keyword-url');
    const resultsSection = document.getElementById('results-section');

    if (seedsInput) seedsInput.value = '';
    if (urlInput) urlInput.value = '';
    if (resultsSection) resultsSection.style.display = 'none';
}

async function handleGetKeywords() {
    const seedsInput = document.getElementById('keyword-seeds');
    const urlInput = document.getElementById('keyword-url');
    const locationSelect = document.getElementById('keyword-location');
    const languageSelect = document.getElementById('keyword-language');

    const seeds = seedsInput.value.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    const url = urlInput.value.trim();
    const location = locationSelect.value;
    const language = languageSelect.value;

    if (seeds.length === 0 && !url) {
        showError('Please enter at least one seed keyword or a URL');
        return;
    }

    showLoading(true);
    hideError();

    try {
        const results = await getKeywordIdeas({ keywords: seeds, url, location, language });
        currentResults = results;
        displayAllResults(results);
        document.getElementById('results-section').style.display = 'block';
        showLoading(false);
    } catch (error) {
        console.error('[Keywords Planner] Error:', error);
        showError(error.message);
        showLoading(false);
    }
}

function displayAllResults(results) {
    document.getElementById('results-count').textContent = results.length;
    renderIdeasTab(results);
    renderHistoricalTab(results);
    renderDifficultyTab(results);
}

function renderIdeasTab(results) {
    const container = document.getElementById('ideas-content');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--md-sys-color-on-surface-variant);">No keywords found. Try different seeds or locations.</p>';
        return;
    }

    const rows = results.map(kw => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 14px; font-weight: 500;">${escapeHTML(kw.keyword)}</td>
            <td style="padding: 14px; text-align: right;">${formatNumber(kw.searchVolume)}</td>
            <td style="padding: 14px; text-align: center;">${createCompetitionBadge(kw.competition)}</td>
            <td style="padding: 14px; text-align: right;">$${kw.avgCpc || '0.00'}</td>
            <td style="padding: 14px; text-align: right;">${createDifficultyBadge(kw.difficulty)}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; background: var(--md-sys-color-surface); border-radius: 8px; overflow: hidden;">
            <thead style="background: var(--md-sys-color-surface-variant);">
                <tr>
                    <th style="padding: 14px; text-align: left; font-weight: 600; font-size: 13px;">Keyword</th>
                    <th style="padding: 14px; text-align: right; font-weight: 600; font-size: 13px;">Avg. Monthly Searches</th>
                    <th style="padding: 14px; text-align: center; font-weight: 600; font-size: 13px;">Competition</th>
                    <th style="padding: 14px; text-align: right; font-weight: 600; font-size: 13px;">Avg. CPC</th>
                    <th style="padding: 14px; text-align: right; font-weight: 600; font-size: 13px;">Difficulty</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function renderHistoricalTab(results) {
    const container = document.getElementById('historical-content');
    if (!container) return;

    const keywordsWithHistory = results.filter(kw => kw.monthlySearchVolumes && kw.monthlySearchVolumes.length > 0);

    if (keywordsWithHistory.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--md-sys-color-on-surface-variant);">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.3; margin-bottom: 16px;">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
                <p style="font-size: 16px;">No historical data available for these keywords.</p>
            </div>
        `;
        return;
    }

    const charts = keywordsWithHistory.slice(0, 10).map(kw => createHistoricalChart(kw)).join('');
    container.innerHTML = charts;
}

function createHistoricalChart(keyword) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = keyword.monthlySearchVolumes.slice(-12).reverse();
    const maxSearches = Math.max(...chartData.map(m => m.searches), 1);
    const avgSearches = chartData.reduce((sum, m) => sum + m.searches, 0) / chartData.length;

    const bars = chartData.map(m => {
        const height = (m.searches / maxSearches) * 100;
        return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="background: var(--md-sys-color-primary); width: 100%; height: ${height}%; min-height: 2px; border-radius: 4px 4px 0 0;" title="${formatNumber(m.searches)} searches"></div>
                <span style="font-size: 10px; margin-top: 4px; color: var(--md-sys-color-on-surface-variant);">${monthNames[m.month - 1]}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="card" style="margin-bottom: 20px; padding: 20px;">
            <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">${escapeHTML(keyword.keyword)}</h4>
            <div style="display: flex; align-items: flex-end; height: 120px; gap: 4px;">${bars}</div>
            <div style="margin-top: 12px; font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                Avg: <strong>${formatNumber(Math.round(avgSearches))}</strong> searches/month
            </div>
        </div>
    `;
}

function renderDifficultyTab(results) {
    const container = document.getElementById('difficulty-content');
    if (!container) return;

    const sorted = results.slice().sort((a, b) => b.difficulty - a.difficulty);

    const rows = sorted.map(kw => {
        const recommendation = getRecommendation(kw.difficulty, kw.searchVolume);
        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 14px; font-weight: 500;">${escapeHTML(kw.keyword)}</td>
                <td style="padding: 14px; text-align: right;">${createDifficultyBar(kw.difficulty)}</td>
                <td style="padding: 14px; text-align: right;">${formatNumber(kw.searchVolume)}</td>
                <td style="padding: 14px; text-align: center;">${createCompetitionBadge(kw.competition)}</td>
                <td style="padding: 14px; text-align: right;">${kw.competitionIndex}/100</td>
                <td style="padding: 14px; text-align: right;">$${kw.avgCpc || '0.00'}</td>
                <td style="padding: 14px; font-size: 12px; color: var(--md-sys-color-on-surface-variant);">${recommendation}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; background: var(--md-sys-color-surface); border-radius: 8px; overflow: hidden;">
            <thead style="background: var(--md-sys-color-surface-variant);">
                <tr>
                    <th style="padding: 14px; text-align: left; font-weight: 600; font-size: 13px;">Keyword</th>
                    <th style="padding: 14px; text-align: right; font-weight: 600; font-size: 13px;">Difficulty Score</th>
                    <th style="padding: 14px; text-align: right; font-weight: 600; font-size: 13px;">Search Volume</th>
                    <th style="padding: 14px; text-align: center; font-weight: 600; font-size: 13px;">Competition</th>
                    <th style="padding: 14px; text-align: right; font-weight: 600; font-size: 13px;">Comp. Index</th>
                    <th style="padding: 14px; text-align: right; font-weight: 600; font-size: 13px;">Avg. CPC</th>
                    <th style="padding: 14px; text-align: left; font-weight: 600; font-size: 13px;">Recommendation</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
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

function createDifficultyBadge(difficulty) {
    const color = getDifficultyColor(difficulty);
    return `<span style="padding: 6px 12px; border-radius: 8px; font-weight: 600; background: ${color}; color: white;">${difficulty}/100</span>`;
}

function createDifficultyBar(difficulty) {
    const color = getDifficultyColor(difficulty);
    return `
        <div style="display: inline-flex; align-items: center; gap: 8px;">
            <div style="width: 80px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                <div style="width: ${difficulty}%; height: 100%; background: ${color};"></div>
            </div>
            <span style="font-weight: 600; color: ${color};">${difficulty}</span>
        </div>
    `;
}

function getDifficultyColor(difficulty) {
    if (difficulty >= 75) return '#ea4335';
    if (difficulty >= 50) return '#fbbc04';
    if (difficulty >= 25) return '#34a853';
    return '#1a73e8';
}

function getRecommendation(difficulty, volume) {
    if (difficulty < 30 && volume > 1000) return '✓ Great opportunity - Low competition, good volume';
    if (difficulty < 30) return '✓ Easy to rank - Low competition';
    if (difficulty < 50 && volume > 5000) return '~ Moderate effort - Worth targeting';
    if (difficulty < 50) return '~ Medium difficulty - Consider long-tail';
    if (difficulty < 75) return '⚠ High competition - Needs strong SEO';
    return '✗ Very competitive - Difficult to rank';
}

function switchTab(tabName) {
    document.querySelectorAll('.result-tab').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isActive);
        btn.style.borderBottomColor = isActive ? 'var(--md-sys-color-primary)' : 'transparent';
        btn.style.color = isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)';
        btn.style.fontWeight = isActive ? '600' : '500';
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = content.id === `tab-${tabName}` ? 'block' : 'none';
    });
}

function exportToCSV(type) {
    if (currentResults.length === 0) return;

    let csv = '';
    let filename = '';

    if (type === 'ideas') {
        csv = 'Keyword,Avg Monthly Searches,Competition,Avg CPC,Difficulty\n';
        csv += currentResults.map(kw =>
            `"${kw.keyword}",${kw.searchVolume},${kw.competition},${kw.avgCpc || 0},${kw.difficulty}`
        ).join('\n');
        filename = 'keyword-ideas';
    } else if (type === 'difficulty') {
        csv = 'Keyword,Difficulty,Search Volume,Competition,Competition Index,Avg CPC\n';
        csv += currentResults.map(kw =>
            `"${kw.keyword}",${kw.difficulty},${kw.searchVolume},${kw.competition},${kw.competitionIndex},${kw.avgCpc || 0}`
        ).join('\n');
        filename = 'keyword-difficulty';
    } else if (type === 'historical') {
        csv = 'Keyword,Month,Year,Searches\n';
        csv += currentResults.flatMap(kw =>
            (kw.monthlySearchVolumes || []).map(m => `"${kw.keyword}",${m.month},${m.year},${m.searches}`)
        ).join('\n');
        filename = 'keyword-historical';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loading-state');
    const resultsDiv = document.getElementById('results-section');
    if (loadingDiv) loadingDiv.style.display = show ? 'block' : 'none';
    if (resultsDiv && show) resultsDiv.style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error-state');
    if (!errorDiv) return;

    errorDiv.innerHTML = `
        <div style="display: flex; align-items: start; gap: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink: 0;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div>
                <strong style="display: block; margin-bottom: 4px;">Error</strong>
                ${escapeHTML(message)}
            </div>
        </div>
    `;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.getElementById('error-state');
    if (errorDiv) errorDiv.style.display = 'none';
}

function formatNumber(num) {
    return num.toLocaleString();
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
