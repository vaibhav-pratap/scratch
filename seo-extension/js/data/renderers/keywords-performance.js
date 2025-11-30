/**
 * Keywords Performance Renderer
 * Google Search Console keyword performance data with Tracking Builder style UI
 */

import { getSearchConsoleData } from '../../services/keywords.js';
import { isAuthenticated } from '../../services/auth.js';

let currentData = [];
let currentDomain = '';
let currentDays = 28;

export async function renderKeywordsPerformance(container, url) {
    if (!container) return;

    const isAuth = await isAuthenticated();
    if (!isAuth) {
        container.innerHTML = createAuthNotice();
        return;
    }

    currentDomain = extractDomain(url);
    container.innerHTML = createMainLayout();

    attachEventListeners();
    loadData();
}

function createMainLayout() {
    return `
        <div style="max-width: 1400px; margin: 0 auto; padding: 0 0px;">
            <div class="card" style="padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 500; color: var(--md-sys-color-on-surface);">Performance</h2>
                        <p style="margin: 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                            Search Console data for <strong>${escapeHTML(currentDomain)}</strong>
                        </p>
                    </div>

                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div class="select-wrapper" style="position: relative;">
                            <select id="kp-date-range" style="appearance: none; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline-variant); border-radius: 8px; padding: 10px 36px 10px 16px; font-size: 14px; color: var(--md-sys-color-on-surface); cursor: pointer; min-width: 160px; transition: all 0.2s;">
                                <option value="7">Last 7 Days</option>
                                <option value="28" selected>Last 28 Days</option>
                                <option value="90">Last 3 Months</option>
                                <option value="180">Last 6 Months</option>
                            </select>
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); pointer-events: none;">
                                <path d="M1 1L5 5L9 1" stroke="var(--md-sys-color-on-surface-variant)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>

                        <button id="kp-refresh" class="icon-btn" title="Refresh" style="width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--md-sys-color-outline-variant); background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface-variant); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div id="kp-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px;">
                </div>

            <div style="display: flex; flex-direction: column; gap: 24px;">
                
                <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid var(--md-sys-color-surface-variant);">
                        <h3 style="margin: 0; font-size: 16px; font-weight: 500; color: var(--md-sys-color-on-surface);">Top 10 Keywords</h3>
                        <p style="margin: 4px 0 0; font-size: 12px; color: var(--md-sys-color-on-surface-variant);">By Average Position</p>
                    </div>
                    <div id="kp-top-keywords" style="flex: 1;">
                        ${createLoadingListState()}
                    </div>
                </div>

                <div id="kp-content" class="card" style="padding: 0; overflow: hidden;">
                    ${createLoadingState()}
                </div>
            </div>
        </div>
    `;
}

function attachEventListeners() {
    const dateRange = document.getElementById('kp-date-range');
    const refreshBtn = document.getElementById('kp-refresh');

    if (dateRange) {
        dateRange.addEventListener('change', (e) => {
            currentDays = parseInt(e.target.value);
            loadData();
        });
    }

    if (refreshBtn) refreshBtn.addEventListener('click', () => loadData());
}

async function loadData() {
    const content = document.getElementById('kp-content');
    const statsContainer = document.getElementById('kp-stats');
    const topKeywordsContainer = document.getElementById('kp-top-keywords');

    if (!content || !statsContainer) return;

    content.innerHTML = createLoadingState();
    statsContainer.innerHTML = createPlaceholderStats();
    if (topKeywordsContainer) topKeywordsContainer.innerHTML = createLoadingListState();

    try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - currentDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await getSearchConsoleData({
            domain: currentDomain,
            startDate,
            endDate,
            dimensions: ['query'],
            limit: 1000
        });

        currentData = (response.queries || []).map(row => ({
            query: row.keys ? row.keys[0] : (row.query || 'Unknown'),
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position
        }));

        renderStats(currentData);
        renderTopKeywords(currentData);
        renderTable(currentData);

    } catch (error) {
        console.error('[Keywords Performance] Error:', error);

        const errorHTML = error.message.includes('Access token expired') || error.message.includes('not connected')
            ? createAuthNotice()
            : createErrorState(error.message);

        content.innerHTML = errorHTML;
        statsContainer.innerHTML = '';
        if (topKeywordsContainer) topKeywordsContainer.innerHTML = '';
    }
}

function renderStats(data) {
    const statsContainer = document.getElementById('kp-stats');
    if (!statsContainer) return;

    const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
    const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = data.reduce((sum, item) => sum + item.position, 0) / (data.length || 1);

    statsContainer.innerHTML = `
        ${createStatCard('Total Clicks', formatNumber(totalClicks), '#1a73e8', '<path d="M7 10l5 5 5-5z"/>')}
        ${createStatCard('Total Impressions', formatNumber(totalImpressions), '#9334E6', '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>')}
        ${createStatCard('Average CTR', formatPercent(avgCtr), '#0F9D58', '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>')}
        ${createStatCard('Average Position', formatNumber(avgPosition, 1), '#F09300', '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>')}
    `;
}

function createStatCard(label, value, color, iconPath) {
    return `
        <div class="card" style="padding: 24px; border-top: 4px solid ${color}; display: flex; flex-direction: column; justify-content: space-between; height: 140px; margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span style="font-size: 13px; color: var(--md-sys-color-on-surface-variant); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>
                <div style="padding: 8px; border-radius: 8px; background: ${color}15; color: ${color};">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">${iconPath}</svg>
                </div>
            </div>
            <span style="font-size: 32px; font-weight: 400; color: var(--md-sys-color-on-surface); letter-spacing: -0.5px;">${value}</span>
        </div>
    `;
}

function renderTopKeywords(data) {
    const container = document.getElementById('kp-top-keywords');
    if (!container) return;

    // Sort by position (ascending) and take top 10
    const top10 = [...data]
        .sort((a, b) => a.position - b.position)
        .slice(0, 10);

    if (top10.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--md-sys-color-on-surface-variant); font-size: 13px;">No keywords found</div>';
        return;
    }

    container.innerHTML = `
        <div style="display: flex; flex-direction: column;">
            ${top10.map((item, index) => `
                <div style="padding: 12px 20px; border-bottom: 1px solid var(--md-sys-color-surface-variant); display: flex; align-items: center; gap: 12px; transition: background 0.1s;" onmouseover="this.style.background='var(--md-sys-color-surface-variant)'" onmouseout="this.style.background=''">
                    <div style="width: 24px; height: 24px; background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">
                        ${index + 1}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 14px; color: var(--md-sys-color-on-surface); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(item.query)}</div>
                        <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant);">Pos: ${formatNumber(item.position, 1)} • ${formatNumber(item.clicks)} clicks</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTable(data) {
    const content = document.getElementById('kp-content');
    if (!content) return;

    if (data.length === 0) {
        content.innerHTML = createEmptyState();
        return;
    }

    content.innerHTML = `
        <div style="padding: 16px 24px; border-bottom: 1px solid var(--md-sys-color-surface-variant); display: flex; align-items: center; gap: 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--md-sys-color-on-surface-variant)" style="margin-top: 2px;">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input type="text" id="kp-search" placeholder="Filter queries..." style="width: 100%; border: none; outline: none; font-size: 14px; color: var(--md-sys-color-on-surface); background: transparent;">
        </div>

        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead style="background: var(--md-sys-color-surface);">
                    <tr>
                        <th style="padding: 16px 24px; text-align: left; font-weight: 600; color: var(--md-sys-color-on-surface); border-bottom: 1px solid var(--md-sys-color-outline-variant);">Query</th>
                        <th style="padding: 16px 24px; text-align: right; font-weight: 600; color: var(--md-sys-color-on-surface); border-bottom: 1px solid var(--md-sys-color-outline-variant); width: 15%;">Clicks</th>
                        <th style="padding: 16px 24px; text-align: right; font-weight: 600; color: var(--md-sys-color-on-surface); border-bottom: 1px solid var(--md-sys-color-outline-variant); width: 15%;">Impressions</th>
                        <th style="padding: 16px 24px; text-align: right; font-weight: 600; color: var(--md-sys-color-on-surface); border-bottom: 1px solid var(--md-sys-color-outline-variant); width: 15%;">CTR</th>
                        <th style="padding: 16px 24px; text-align: right; font-weight: 600; color: var(--md-sys-color-on-surface); border-bottom: 1px solid var(--md-sys-color-outline-variant); width: 15%;">Position</th>
                    </tr>
                </thead>
                <tbody id="kp-table-body">
                    ${renderTableRows(data)}
                </tbody>
            </table>
        </div>
        
        <div style="padding: 12px 24px; border-top: 1px solid var(--md-sys-color-surface-variant); font-size: 12px; color: var(--md-sys-color-on-surface-variant); text-align: right; background: var(--md-sys-color-surface);">
            Showing ${data.length} queries
        </div>
    `;

    const searchInput = document.getElementById('kp-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = data.filter(item => item.query.toLowerCase().includes(query));
            document.getElementById('kp-table-body').innerHTML = renderTableRows(filtered);
        });
    }
}

function renderTableRows(data) {
    if (data.length === 0) {
        return '<tr><td colspan="5" style="padding: 40px; text-align: center; color: var(--md-sys-color-on-surface-variant);">No matching queries found</td></tr>';
    }

    return data.map(item => `
        <tr style="border-bottom: 1px solid var(--md-sys-color-surface-variant); transition: background 0.1s;" onmouseover="this.style.background='var(--md-sys-color-surface-variant)'" onmouseout="this.style.background=''">
            <td style="padding: 14px 24px; font-weight: 500; color: var(--md-sys-color-on-surface);">${escapeHTML(item.query)}</td>
            <td style="padding: 14px 24px; text-align: right; color: var(--md-sys-color-on-surface);">${formatNumber(item.clicks)}</td>
            <td style="padding: 14px 24px; text-align: right; color: var(--md-sys-color-on-surface);">${formatNumber(item.impressions)}</td>
            <td style="padding: 14px 24px; text-align: right; color: var(--md-sys-color-on-surface);">${formatPercent(item.ctr)}</td>
            <td style="padding: 14px 24px; text-align: right; color: var(--md-sys-color-on-surface);">${formatNumber(item.position, 1)}</td>
        </tr>
    `).join('');
}

function createPlaceholderStats() {
    return [1, 2, 3, 4].map(() => `
        <div class="card" style="height: 140px; background: var(--md-sys-color-surface-variant); opacity: 0.5; animation: pulse 1.5s infinite; margin-bottom: 0;"></div>
    `).join('');
}

function createLoadingListState() {
    return [1, 2, 3, 4, 5].map(() => `
        <div style="padding: 12px 20px; border-bottom: 1px solid var(--md-sys-color-surface-variant); display: flex; align-items: center; gap: 12px; opacity: 0.5;">
            <div style="width: 24px; height: 24px; background: var(--md-sys-color-surface-variant); border-radius: 50%;"></div>
            <div style="flex: 1; height: 14px; background: var(--md-sys-color-surface-variant); border-radius: 4px;"></div>
        </div>
    `).join('');
}

function createAuthNotice() {
    return `
        <div style="padding: 60px 20px; text-align: center;">
            <div class="score-circle" style="margin-bottom: 24px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--md-sys-color-warning)">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Authentication Required</h3>
            <p style="margin: 0 0 24px 0; font-size: 14px; color: var(--md-sys-color-on-surface-variant); max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                Sign in with Google to view Search Console performance data.
            </p>
            <button onclick="document.querySelector('[data-tab=profile]').click()" class="action-btn primary">
                Go to Profile
            </button>
        </div>
    `;
}

function createLoadingState() {
    return `
        <div style="padding: 60px 20px; text-align: center;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--md-sys-color-primary-container); border-top-color: var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 16px; font-size: 14px; color: var(--md-sys-color-on-surface-variant);">Loading performance data...</p>
        </div>
    `;
}

function createErrorState(message) {
    return `
        <div style="padding: 60px 20px; text-align: center;">
            <div style="width: 48px; height: 48px; background: var(--md-sys-color-error-container); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--md-sys-color-error)">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: var(--md-sys-color-error);">Unable to Load Data</h3>
            <p style="margin: 0; font-size: 14px; color: var(--md-sys-color-on-surface-variant); max-width: 400px; margin-left: auto; margin-right: auto;">
                ${escapeHTML(message)}
            </p>
        </div>
    `;
}

function createEmptyState() {
    return `
        <div style="padding: 60px 20px; text-align: center;">
            <div style="width: 64px; height: 64px; background: var(--md-sys-color-surface-variant); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--md-sys-color-on-surface-variant)">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
            </div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">No Data Available</h3>
            <p style="margin: 0; font-size: 14px; color: var(--md-sys-color-on-surface-variant);">
                No keyword performance data found for this period.
            </p>
        </div>
    `;
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

function formatNumber(num, decimals = 0) {
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPercent(num) {
    return num.toFixed(1) + '%';
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}