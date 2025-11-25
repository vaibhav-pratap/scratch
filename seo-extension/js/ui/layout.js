/**
 * Layout Module
 * Dynamically renders the application structure (Header, Tabs, Content, Footer)
 * This ensures a modular HTML approach without build steps.
 */

export function renderStaticLayout() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <!-- Header -->
        <header class="app-header">
            <div class="header-top">
                <div class="logo-area">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="var(--md-sys-color-primary)"/>
                        <path d="M7 12L12 7L17 12H14V16H10V12H7Z" fill="var(--md-sys-color-primary)"/>
                    </svg>
                    <h1>SEO Analyzer</h1>
                </div>
                <div class="header-actions">
                    <button id="theme-toggle" class="icon-btn" title="Toggle Dark Mode">
                        <!-- Sun Icon -->
                        <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>
                        <!-- Moon Icon (Hidden by default via CSS) -->
                        <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>
                    </button>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="tabs-container">
                <button class="tab-btn active" data-tab="overview">Overview</button>
                <button class="tab-btn" data-tab="meta">Meta</button>
                <button class="tab-btn" data-tab="headings">Headings</button>
                <button class="tab-btn" data-tab="images">Images</button>
                <button class="tab-btn" data-tab="links">Links</button>
                <button class="tab-btn" data-tab="accessibility">Accessibility</button>
                <button class="tab-btn" data-tab="schema">Schema</button>
                <button class="tab-btn" data-tab="settings">Settings</button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="content-area">
            ${renderOverviewTab()}
            ${renderMetaTab()}
            ${renderHeadingsTab()}
            ${renderImagesTab()}
            ${renderLinksTab()}
            ${renderAccessibilityTab()}
            ${renderSchemaTab()}
            ${renderSettingsTab()}
        </main>

        <!-- Footer -->
        <footer class="app-footer">
            <button id="btn-copy" class="action-btn secondary small">Copy JSON</button>
            <button id="btn-download-csv" class="action-btn secondary small">Sheet</button>
            <button id="btn-download-pdf" class="action-btn secondary small">PDF</button>
            <button id="btn-download" class="action-btn secondary small">JSON</button>
        </footer>
    `;
}

function renderOverviewTab() {
    return `
    <div id="overview" class="tab-content active">
        <div class="score-card">
            <div class="score-circle">
                <span id="seo-score">--</span>
                <small>Score</small>
            </div>
            <div class="flex-row" style="justify-content: center; gap: 24px;">
                <div class="text-center">
                    <div class="text-xs text-secondary">Title</div>
                    <div id="title-length" class="highlight">--</div>
                </div>
                <div class="text-center">
                    <div class="text-xs text-secondary">Desc</div>
                    <div id="desc-length" class="highlight">--</div>
                </div>
            </div>
        </div>

        <div class="data-group">
            <label>Core Web Vitals</label>
            <div class="chart-container">
                <canvas id="cwv-chart"></canvas>
            </div>
            
            <!-- Detailed CWV Cards -->
            <div class="cwv-details-grid">
                <!-- LCP Card -->
                <div class="cwv-card">
                    <div class="metric-header">
                        <div><span id="lcp-dot" class="metric-dot"></span>LCP</div>
                        <span id="lcp-value" class="metric-value">--</span>
                    </div>
                    <div id="lcp-rating" class="metric-rating">--</div>
                    <div class="metric-element">
                        <small>Element:</small>
                        <code id="lcp-element">--</code>
                    </div>
                </div>

                <!-- CLS Card -->
                <div class="cwv-card">
                    <div class="metric-header">
                        <div><span id="cls-dot" class="metric-dot"></span>CLS</div>
                        <span id="cls-value" class="metric-value">--</span>
                    </div>
                    <div id="cls-rating" class="metric-rating">--</div>
                    <div class="metric-element">
                        <small>Element:</small>
                        <code id="cls-element">--</code>
                    </div>
                </div>

                <!-- INP Card -->
                <div class="cwv-card">
                    <div class="metric-header">
                        <div><span id="inp-dot" class="metric-dot"></span>INP</div>
                        <span id="inp-value" class="metric-value">--</span>
                    </div>
                    <div id="inp-rating" class="metric-rating">--</div>
                    <div class="metric-element">
                        <small>Element:</small>
                        <code id="inp-element">--</code>
                    </div>
                </div>

                <!-- FCP Card -->
                <div class="cwv-card">
                    <div class="metric-header">
                        <div><span id="fcp-dot" class="metric-dot"></span>FCP</div>
                        <span id="fcp-value" class="metric-value">--</span>
                    </div>
                    <div id="fcp-rating" class="metric-rating">--</div>
                </div>

                <!-- TTFB Card -->
                <div class="cwv-card">
                    <div class="metric-header">
                        <div><span id="ttfb-dot" class="metric-dot"></span>TTFB</div>
                        <span id="ttfb-value" class="metric-value">--</span>
                    </div>
                    <div id="ttfb-rating" class="metric-rating">--</div>
                </div>
            </div>
        </div>

        <div class="data-group">
            <label>Readability</label>
            <div id="readability-score" class="data-value highlight">--</div>
        </div>

        <div class="data-group">
            <label>Tech Stack</label>
            <div id="tech-stack" class="data-value">--</div>
        </div>

        <div class="suggestions-section">
            <h3>Suggestions</h3>
            <div id="suggestions-list" class="suggestions-list"></div>
        </div>
    </div>`;
}

function renderMetaTab() {
    return `
    <div id="meta" class="tab-content">
        ${renderDataGroup('Title Tag', 'meta-title', 'btn-copy-title')}
        ${renderDataGroup('Meta Description', 'meta-desc', 'btn-copy-desc')}
        ${renderDataGroup('Meta Keywords', 'meta-keywords', 'btn-copy-keywords')}
        ${renderDataGroup('Canonical URL', 'meta-canonical', 'btn-copy-canonical')}
        ${renderDataGroup('Robots Tag', 'meta-robots', 'btn-copy-robots')}
        <div id="og-data"></div>
        <div id="twitter-data"></div>
    </div>`;
}

function renderHeadingsTab() {
    return `
    <div id="headings" class="tab-content">
        <div class="chart-container">
            <canvas id="headings-chart"></canvas>
        </div>
        <div id="headings-list" class="headings-tree"></div>
    </div>`;
}

function renderImagesTab() {
    return `
    <div id="images" class="tab-content">
        <div class="flex-between mb-2">
            <span>Total: <b id="img-total">0</b></span>
            <span>Missing Alt: <b id="img-missing-alt">0</b></span>
        </div>
        <div id="images-list" class="images-grid"></div>
    </div>`;
}

function renderLinksTab() {
    return `
    <div id="links" class="tab-content">
        <div class="flex-between mb-2">
            <span>Internal: <b id="link-internal-count">0</b></span>
            <span>External: <b id="link-external-count">0</b></span>
        </div>
        <div class="chart-container">
            <canvas id="links-chart"></canvas>
        </div>
        <h3>External Links</h3>
        <div id="external-links-list" class="scrollable-list"></div>
        <h3>Internal Links</h3>
        <div id="internal-links-list" class="scrollable-list"></div>
        <h3>Email Addresses</h3>
        <div id="emails-list"></div>
        <h3>Phone Numbers</h3>
        <div id="phones-list"></div>
    </div>`;
}

/**
 * Render Accessibility Tab
 */
function renderAccessibilityTab() {
    return `
    <div id="accessibility" class="tab-content">
        <h2>Accessibility Audit</h2>
        
        <!-- Overall Score Card with Doughnut Chart -->
        <div class="score-card">
            <div style="position: relative; width: 140px; height: 140px; margin: 0 auto;">
                <canvas id="a11y-score-chart" width="140" height="140"></canvas>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <div id="a11y-score-value" style="font-size: 32px; font-weight: 400; line-height: 1;">--</div>
                    <small style="font-size: 11px; text-transform: uppercase; color: var(--md-sys-color-on-surface-variant);">A11Y SCORE</small>
                </div>
            </div>
            <div style="text-align: center; margin-top: 12px;">
                <button id="btn-toggle-a11y-highlights" class="action-btn secondary small">Toggle Highlights</button>
            </div>
        </div>

        <!-- Issues Summary -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
            <div class="data-group" style="margin-bottom: 0;">
                <label style="color: var(--md-sys-color-error);">Critical</label>
                <div id="a11y-critical-count" class="data-value" style="font-size: 24px; font-weight: 700;">0</div>
            </div>
            <div class="data-group" style="margin-bottom: 0;">
                <label style="color: var(--md-sys-color-warning);">Warnings</label>
                <div id="a11y-warning-count" class="data-value" style="font-size: 24px; font-weight: 700;">0</div>
            </div>
            <div class="data-group" style="margin-bottom: 0;">
                <label style="color: var(--md-sys-color-primary);">Notices</label>
                <div id="a11y-notice-count" class="data-value" style="font-size: 24px; font-weight: 700;">0</div>
            </div>
        </div>

        <!-- Top Culprits -->
        <div class="card">
            <h3>Top Issues Affecting Score</h3>
            <div id="a11y-culprits-list"></div>
        </div>

        <!-- Detailed Checks -->
        <div class="card">
            <h3>Detailed Accessibility Checks</h3>
            <div id="a11y-checks-container"></div>
        </div>

        <!-- All Issues List -->
        <div class="card">
            <h3>All Issues</h3>
            <div id="a11y-issues-list"></div>
        </div>
    </div>
    `;
}

function renderSchemaTab() {
    return `
    <div id="schema" class="tab-content">
        <div class="data-group">
            <div class="label-row">
                <label>Sitemap</label>
                <button id="btn-sitemap" class="action-btn secondary small">Open Sitemap.xml</button>
            </div>
        </div>
        <div class="data-group">
            <label>Schema / Structured Data</label>
            <div id="schema-list"></div>
        </div>
        <div class="data-group">
            <label>Hreflang Tags</label>
            <div id="hreflang-list"></div>
        </div>
        <div class="data-group">
            <div class="label-row">
                <label>People Also Asked</label>
                <button id="btn-paa-chart" class="action-btn secondary small">View Chart</button>
                <button id="btn-paa-pdf" class="action-btn secondary small">Export PDF</button>
            </div>
            <div id="paa-list"></div>
            <div id="paa-chart-container" style="display: none;">
                <canvas id="paa-chart"></canvas>
            </div>
        </div>
    </div>`;
}

function renderSettingsTab() {
    return `
    <div id="settings" class="tab-content">
        <h3>Extension Settings</h3>
        <div class="data-group">
            <div class="label-row">
                <label>Open in Side Panel</label>
                <label class="switch">
                    <input type="checkbox" id="toggle-sidepanel">
                    <span class="slider"></span>
                </label>
            </div>
        </div>
        <h3>Link Highlighting</h3>
        <p class="text-xs text-secondary">Toggle highlighting for different link types.</p>
        ${renderToggle('Nofollow Links', 'toggle-nofollow')}
        ${renderToggle('Follow Links', 'toggle-follow')}
        ${renderToggle('External Links', 'toggle-external')}
        ${renderToggle('Internal Links', 'toggle-internal')}
        ${renderToggle('mailto Links', 'toggle-mailto')}
        ${renderToggle('tel Links', 'toggle-tel')}
    </div>`;
}

// Helper to render standard data group with copy button
function renderDataGroup(label, valueId, copyBtnId) {
    return `
    <div class="data-group">
        <label>${label}</label>
        <div class="label-row">
            <div id="${valueId}" class="data-value"></div>
            <button id="${copyBtnId}" class="copy-icon-btn" title="Copy">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
        </div>
    </div>`;
}

function renderToggle(label, id) {
    return `
    <div class="data-group">
        <div class="label-row">
            <label>${label}</label>
            <label class="switch">
                <input type="checkbox" id="${id}">
                <span class="slider"></span>
            </label>
        </div>
    </div>`;
}
