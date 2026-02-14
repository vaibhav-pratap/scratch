/**
 * Layout Module
 * Dynamically renders the application structure (Header, Tabs, Content, Footer)
 * This ensures a modular HTML approach without build steps.
 */

// import { renderNotes } from './notes.js'; // Removed stale import

// Helper function to create AI insights card HTML
function createAIInsightsCard(tabId) {
    return `
        <div class="card ai-insights-card" id="ai-insights-${tabId}" style="margin-top: 16px;">
            <div class="data-group" style="margin-bottom: 0;">
                <div class="label-row" style="justify-content: space-between; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        AI Insights
                    </label>
                    <button class="btn-ai-insights action-btn secondary small" data-tab="${tabId}" style="display: flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Get Insights
                    </button>
                </div>
                <div class="ai-insights-content" id="ai-insights-content-${tabId}" style="margin-top: 12px; display: none;">
                    <div class="ai-insights-text" id="ai-insights-text-${tabId}" style="white-space: pre-wrap; line-height: 1.6; padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; font-size: 13px;"></div>
                    <div class="ai-insights-loading" id="ai-insights-loading-${tabId}" style="display: none; text-align: center; padding: 20px;">
                        <div style="display: inline-block; width: 18px; height: 18px; border: 3px solid var(--md-sys-color-primary-container); border-top-color: var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin-top: 12px; color: var(--md-sys-color-on-surface-variant); font-size: 12px;">Generating insights...</p>
                    </div>
                    <div class="ai-insights-error" id="ai-insights-error-${tabId}" style="display: none; color: var(--md-sys-color-error); padding: 12px; background: var(--md-sys-color-error-container); border-radius: 4px; margin-top: 8px; font-size: 12px;"></div>
                </div>
            </div>
        </div>
    `;
}

export function renderStaticLayout() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <!-- Header -->
        <header class="app-header">
            <div class="header-top">
                <div class="logo-area">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="assets/logo/logo.png" width="24" height="24" alt="SEO Analyzer Pro Logo">
                        <h1 style="margin: 0;">SEO Analyzer Pro <span class="beta-tag">RC</span></h1>
                    </div>
                </div>
                <div class="header-actions">
                    <button id="btn-header-donate" class="icon-btn" title="Buy me a coffee" style="color: var(--md-sys-color-warning);">
                        <i class="fa-solid fa-mug-hot" style="font-size: 18px;"></i>
                    </button>
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
                <button class="tab-btn active" data-tab="notes">
                    <i class="fa-solid fa-clipboard-list"></i>
                    <span>Notes</span>
                </button>
                <button class="tab-btn" data-tab="overview">
                    <i class="fa-solid fa-chart-pie"></i>
                    <span>Overview</span>
                </button>
                <button class="tab-btn" data-tab="meta">
                    <i class="fa-solid fa-code"></i>
                    <span>Meta</span>
                </button>
                <button class="tab-btn" data-tab="headings">
                    <i class="fa-solid fa-heading"></i>
                    <span>Headings</span>
                </button>
                <button class="tab-btn" data-tab="images">
                    <i class="fa-solid fa-images"></i>
                    <span>Images</span>
                </button>
                <button class="tab-btn" data-tab="links">
                    <i class="fa-solid fa-link"></i>
                    <span>Links</span>
                </button>
                <button class="tab-btn" data-tab="accessibility">
                    <i class="fa-solid fa-universal-access"></i>
                    <span>Accessibility</span>
                </button>
                <button class="tab-btn" data-tab="content-quality">
                    <i class="fa-solid fa-file-contract"></i>
                    <span>Content</span>
                </button>
                <button class="tab-btn" data-tab="schema">
                    <i class="fa-solid fa-file-signature"></i>
                    <span>Schema Explorer</span>
                </button>
                <button class="tab-btn" data-tab="schema-builder">
                    <i class="fa-solid fa-project-diagram"></i>
                    <span>Schema Builder</span>
                </button>
                <button class="tab-btn" data-tab="ai-analysis">
                    <i class="fa-solid fa-robot"></i>
                    <span>AI Analysis</span>
                </button>
                <button class="tab-btn" data-tab="keywords-insights">
                    <i class="fa-solid fa-magnifying-glass-chart"></i>
                    <span>Keywords</span>
                </button>
                <button class="tab-btn" data-tab="ad-transparency">
                    <i class="fa-solid fa-rectangle-ad"></i>
                    <span>Ads</span>
                </button>
                <button class="tab-btn" data-tab="tag-detector">
                    <i class="fa-solid fa-tags"></i>
                    <span>Tags</span>
                </button>
                <button class="tab-btn" data-tab="tracking-builder">
                    <i class="fa-solid fa-route"></i>
                    <span>Tracking</span>
                </button>
                <button class="tab-btn" data-tab="settings">
                    <i class="fa-solid fa-gear"></i>
                    <span>Settings</span>
                </button>
                <button class="tab-btn" data-tab="profile" style="display: none;">
                    <i class="fa-solid fa-user"></i>
                    <span>Profile</span>
                </button>
                <button class="tab-btn" data-tab="terms" style="display: none;"></button>
                <button class="tab-btn" data-tab="contact" style="display: none;"></button>
                <button class="tab-btn" data-tab="support" style="display: none;"></button>
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
            ${renderContentQualityTab()}
            ${renderSchemaTab()}
            ${renderSchemaBuilderTab()}
            ${renderAIAnalysisTab()}
            ${renderKeywordsInsightsTab()}
            ${renderAdTransparencyTab()}
            ${renderTagDetectorTab()}
            ${renderTrackingBuilderTab()}
            ${renderSettingsTab()}
            ${renderNotesTab()}
            ${renderProfileTab()}
            ${renderTermsTab()}
            ${renderContactTab()}
            ${renderSupportTab()}
        </main>

        <!-- Sticky Donation Bar -->
        <div id="donation-bar" class="donation-bar">
            <div class="donation-bar-content">
                <i class="fa-solid fa-gift"></i>
                <span>Buy me a coffee, tea or maybe wine? ☕</span>
            </div>
            <button id="btn-close-donation" class="close-bar-btn">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <!-- MD3 Bottom Navigation Footer -->
        <footer class="app-footer">
            <button id="btn-notes-footer" class="nav-item" title="Notes & To-Do">
                <div class="nav-icon-container">
                    <i class="fa-solid fa-clipboard-list"></i>
                </div>
            </button>            <button id="btn-profile" class="nav-item" title="Profile">
                <div class="nav-icon-container">
                    <i class="fa-solid fa-user"></i>
                </div>
            </button>
            <button id="btn-tracking" class="nav-item" title="UTM Builder">
                <div class="nav-icon-container">
                    <i class="fa-solid fa-route"></i>
                </div>
            </button>
            <button id="btn-export" class="nav-item" title="Export Data">
                <div class="nav-icon-container">
                    <i class="fa-solid fa-file-export"></i>
                </div>
            </button>
            <button id="btn-menu" class="nav-item" title="More Menu">
                <div class="nav-icon-container">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </div>
            </button>
        </footer>

        <!-- Bottom Sheet Menu Modal -->
        <div id="menu-modal" class="modal-backdrop" style="display: none;">
            <div class="bottom-sheet">
                <div class="sheet-handle"></div>
                <div class="sheet-content">
                    <button class="menu-item" id="menu-settings">
                        <i class="fa-solid fa-gear"></i>
                        <span>Settings</span>
                    </button>
                    <button class="menu-item" id="menu-support">
                        <i class="fa-solid fa-circle-question"></i>
                        <span>Help & Support</span>
                    </button>
                    <button class="menu-item" id="menu-contact">
                        <i class="fa-solid fa-envelope"></i>
                        <span>Contact Us</span>
                    </button>
                    <button class="menu-item" id="menu-terms">
                        <i class="fa-solid fa-file-shield"></i>
                        <span>Terms & Privacy</span>
                    </button>
                    <div class="menu-divider"></div>
                    <div class="menu-version">
                        <span>SEO Analyzer Pro</span>
                        <small>v1.6.0</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Sheet Export Modal -->
        <div id="export-modal" class="modal-backdrop" style="display: none;">
            <div class="bottom-sheet">
                <div class="sheet-handle"></div>
                <div class="sheet-content">
                    <h3 style="margin: 0 0 16px 16px; font-size: 16px;">Export Data</h3>
                    <button class="menu-item" id="btn-download-csv">
                        <i class="fa-solid fa-file-excel" style="color: #1e8e3e;"></i>
                        <span>Export to Excel</span>
                    </button>
                    <button class="menu-item" id="btn-download-pdf">
                        <i class="fa-solid fa-file-pdf" style="color: #d93025;"></i>
                        <span>Export PDF Report</span>
                    </button>
                    <button class="menu-item" id="btn-download">
                        <i class="fa-solid fa-file-code" style="color: #f9ab00;"></i>
                        <span>Export JSON Data</span>
                    </button>
                    <button class="menu-item" id="btn-copy">
                        <i class="fa-solid fa-copy"></i>
                        <span>Copy JSON to Clipboard</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Donation Modal -->
        <div id="donate-modal" class="modal-backdrop" style="display: none;">
            <div class="bottom-sheet" style="max-height: 90vh; position: relative;">
                <button id="btn-close-donate-modal" class="icon-btn" style="position: absolute; right: 12px; top: 12px; z-index: 10;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="sheet-handle"></div>
                <div class="sheet-content" style="padding: 24px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="width: 56px; height: 56px; background: var(--md-sys-color-warning-container); color: var(--md-sys-color-on-warning-container); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
                            <i class="fa-solid fa-mug-hot" style="font-size: 24px;"></i>
                        </div>
                        <h2 style="margin: 0 0 8px 0; font-size: 20px;">Buy me a coffee</h2>
                        <p style="color: var(--md-sys-color-on-surface-variant); font-size: 13px; line-height: 1.5;">Your support helps me keep this extension free and updated!</p>
                    </div>



                    <div id="donation-options" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                        <button class="donation-preset-btn" data-amount="5">$5</button>
                        <button class="donation-preset-btn" data-amount="25">$25</button>
                        <button class="donation-preset-btn" data-amount="50">$50</button>
                        <button class="donation-preset-btn" data-amount="100">$100</button>
                        <button class="donation-preset-btn" data-amount="250">$250</button>
                        <button class="donation-preset-btn" data-amount="500">$500</button>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--md-sys-color-on-surface-variant); margin-bottom: 8px;">Custom Amount (USD)</label>
                        <div style="position: relative;">
                            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--md-sys-color-on-surface-variant);">$</span>
                            <input type="number" id="custom-donation-amount" placeholder="Enter amount" min="1" step="1" style="width: 100%; padding: 12px 12px 12px 28px; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 8px; outline: none; font-size: 14px; background: var(--md-sys-color-surface);">
                        </div>
                    </div>

                    <div id="paypal-button-container" style="min-height: 45px;"></div>
                    
                    <p style="text-align: center; font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-top: 16px;">
                        Secure payment via PayPal
                    </p>
                </div>
            </div>
        </div>
    `;
}

function renderNotesTab() {
    return `
    <div id="notes" class="tab-content active">
        <div id="notes-container"></div>
    </div>`;
}

function renderProfileTab() {
    return `
    <div id="profile" class="tab-content">
        <div id="profile-container"></div>
    </div>`;
}

function renderOverviewTab() {
    return `
    <div id="overview" class="tab-content">
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
                        <div class="flex-between">
                            <small>Element:</small>
                            <button id="btn-highlight-lcp" class="icon-btn small highlight-trigger" title="Highlight on page" style="display: none;">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
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
                        <div class="flex-between">
                            <small>Element:</small>
                            <button id="btn-highlight-cls" class="icon-btn small highlight-trigger" title="Highlight on page" style="display: none;">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
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
                        <div class="flex-between">
                            <small>Element:</small>
                            <button id="btn-highlight-inp" class="icon-btn small highlight-trigger" title="Highlight on page" style="display: none;">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
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
            <div class="flex-between">
                <label>Readability</label>
                <button id="btn-highlight-readability" class="icon-btn small highlight-trigger" title="Highlight issues on page">
                    <i class="fa-solid fa-highlighter"></i>
                </button>
            </div>
            <div id="readability-score" class="data-value highlight">--</div>
            <div id="readability-details" style="margin-top: 12px; display: none;"></div>
        </div>

        <div class="data-group">
            <label>Tech Stack</label>
            <div id="tech-stack" class="data-value">--</div>
        </div>

        <div class="suggestions-section">
            <h3>Suggestions</h3>
            <div id="suggestions-list" class="suggestions-list"></div>
        </div>

        <!-- AI Summary Card -->
        <div class="card" id="ai-summary-card" style="margin-top: 24px;">
            <div class="data-group" style="margin-bottom: 0;">
                <div class="label-row" style="justify-content: space-between; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        AI Summary
                    </label>
                    <button id="btn-generate-ai-summary" class="action-btn secondary small" style="display: flex; align-items: center; gap: 6px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Generate
                    </button>
                </div>
                <div id="ai-summary-content" class="data-value" style="margin-top: 12px; min-height: 40px; padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 8px; display: none;">
                    <div id="ai-summary-text" style="white-space: pre-wrap; line-height: 1.6;"></div>
                    <div id="ai-summary-loading" style="display: none; text-align: center; padding: 20px;">
                        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid var(--md-sys-color-primary-container); border-top-color: var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin-top: 12px; color: var(--md-sys-color-on-surface-variant);">Generating AI summary...</p>
                    </div>
                    <div id="ai-summary-error" style="display: none; color: var(--md-sys-color-error); padding: 12px; background: var(--md-sys-color-error-container); border-radius: 4px; margin-top: 8px;"></div>
                </div>
            </div>
        </div>
    </div>`;
}

function renderMetaTab() {
    return `
    <div id="meta" class="tab-content">
        <div id="meta-grouped-content"></div>
        ${createAIInsightsCard('meta')}
    </div>`;
}

function renderHeadingsTab() {
    return `
    <div id="headings" class="tab-content">

        <div id="headings-list" class="headings-tree"></div>
        ${createAIInsightsCard('headings')}
    </div>`;
}

function renderImagesTab() {
    return `
    <div id="images" class="tab-content">
        <div id="images-grouped-content" style="max-width: 1200px; margin: 0 auto;"></div>
        
        <!-- Legacy fallback (hidden by default) -->
        <div id="images-legacy" style="display: none;">
            <div class="flex-between mb-2">
                <span>Total: <b id="img-total">0</b></span>
                <span>Missing Alt: <b id="img-missing-alt">0</b></span>
            </div>
            <div id="images-list" class="images-grid"></div>
        </div>
        ${createAIInsightsCard('images')}
    </div>`;
}

function renderLinksTab() {
    return `
    <div id="links" class="tab-content">
        <div id="links-list-container"></div>
        ${createAIInsightsCard('links')}
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
            <div style="position: relative; width: 100px; height: 100px; margin: 0 auto;">
                <canvas id="a11y-score-chart" width="100" height="100"></canvas>
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
                    <div id="a11y-score-value" style="font-size: 32px; font-weight: 700; line-height: 1; margin: 0; color: var(--md-sys-color-on-surface);">--</div>
                    <small style="font-size: 10px; font-weight: 500; text-transform: uppercase; color: var(--md-sys-color-on-surface-variant); letter-spacing: 0.5px; margin-top: 2px;">A11Y</small>
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
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h3 style="margin: 0;">All Issues</h3>
                </div>
                <div id="a11y-filters" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
                    <button class="filter-chip active" data-filter="all" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--md-sys-color-outline); background: transparent; font-size: 12px; cursor: pointer; flex-shrink: 0;">All</button>
                    <button class="filter-chip" data-filter="critical" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--md-sys-color-outline); background: transparent; font-size: 12px; cursor: pointer; flex-shrink: 0;">Critical</button>
                    <button class="filter-chip" data-filter="warning" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--md-sys-color-outline); background: transparent; font-size: 12px; cursor: pointer; flex-shrink: 0;">Warning</button>
                    <button class="filter-chip" data-filter="contrast" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--md-sys-color-outline); background: transparent; font-size: 12px; cursor: pointer; flex-shrink: 0;">Contrast</button>
                </div>
            </div>
            <div id="a11y-issues-list"></div>
        </div>
        
        ${createAIInsightsCard('accessibility')}
    </div>
    `;
}

function renderContentQualityTab() {
    return `
    <div id="content-quality" class="tab-content">
        <div id="content-quality-grouped-content"></div>
        ${createAIInsightsCard('content-quality')}
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
        ${createAIInsightsCard('schema')}
    </div>`;
}

function renderSchemaBuilderTab() {
    return `
    <div id="schema-builder" class="tab-content">
        <div class="schema-builder-container">
            <!-- Glassmorphic Sticky Header with Toggles -->
            <div class="schema-header">
                <div class="mode-toggle">
                    <button class="toggle-btn active" data-view="builder">Builder</button>
                    <button class="toggle-btn" data-view="history">Saved Schema</button>
                </div>
            </div>

            <!-- Builder View -->
            <div id="schema-builder-view" class="view-pane active">
                <!-- Type Selection & Title Card -->
                <div class="builder-card">
                    <div class="flex-column gap-3">
                        <div class="form-group">
                            <label for="schema-title-input">Schema Title</label>
                            <input type="text" id="schema-title-input" class="md-input" placeholder="e.g. Homepage Organization">
                        </div>
                        <div class="builder-header">
                            <div class="form-group" style="flex: 1;">
                                <label for="schema-type-select">Schema Type</label>
                                <select id="schema-type-select" class="md-select">
                                    <option value="Organization">Organization</option>
                                    <option value="LocalBusiness">Local Business</option>
                                    <option value="Article">Article</option>
                                    <option value="FAQPage">FAQ Page</option>
                                    <option value="BreadcrumbList">Breadcrumb List</option>
                                    <option value="Product">Product</option>
                                    <option value="Recipe">Recipe</option>
                                    <option value="VideoObject">Video</option>
                                    <option value="Event">Event</option>
                                </select>
                            </div>
                            <div class="builder-actions" style="display: flex; gap: 8px; align-self: flex-end; margin-bottom: 2px;">
                                <button id="btn-save-schema" class="action-btn primary small" title="Save to Site Memory">
                                    <i class="fa-solid fa-floppy-disk"></i>
                                </button>
                                <button id="btn-download-schema" class="action-btn secondary small" title="Download JSON-LD">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                                <button id="btn-copy-schema" class="action-btn secondary small" title="Copy to Clipboard">
                                    <i class="fa-solid fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Form Area -->
                <div class="builder-card">
                    <h3><i class="fa-solid fa-pen-to-square"></i> Properties</h3>
                    <div id="schema-form-container" class="schema-form">
                        <p class="text-xs text-secondary">Loading properties...</p>
                    </div>
                </div>

                <!-- Preview Area -->
                <div class="builder-card">
                    <div class="schema-preview">
                        <div class="preview-header">
                            <h3><i class="fa-solid fa-code"></i> JSON-LD Preview</h3>
                            <span id="schema-validation-badge" class="badge valid">Valid</span>
                        </div>
                        <pre id="schema-json-preview" class="code-block">{}</pre>
                    </div>
                </div>
            </div>

            <!-- History View -->
            <div id="schema-history-view" class="view-pane">
                <div class="builder-card">
                    <div class="flex-between mb-3">
                        <h3><i class="fa-solid fa-history"></i> Site History</h3>
                        <div id="history-bulk-actions" class="flex-row gap-2" style="display: none;">
                            <button id="btn-bulk-delete-schema" class="action-btn error small">
                                <i class="fa-solid fa-trash"></i> Delete Selected
                            </button>
                        </div>
                    </div>
                    <div class="flex-row gap-2 mb-2 px-1">
                        <input type="checkbox" id="select-all-schemas" class="md-checkbox">
                        <label for="select-all-schemas" class="text-xs font-semibold">Select All</label>
                    </div>
                    <div id="saved-schemas-list" class="saved-list">
                        <p class="text-xs text-secondary">No saved schemas for this site.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function renderAIAnalysisTab() {
    return `
    <div id="ai-analysis" class="tab-content">
        <!-- API Key Check Message -->
        <div id="ai-analysis-api-warning" class="card" style="padding: 24px; text-align: center; background: var(--md-sys-color-surface-variant); border-radius: 8px; display: none;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="margin: 0 auto 16px; color: var(--md-sys-color-warning);">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h3 style="margin: 0 0 8px 0; font-size: 18px;">API Key Required</h3>
            <p style="margin: 0 0 16px 0; color: var(--md-sys-color-on-surface-variant);">
                Please configure your Gemini API key in Settings to use AI Content Analysis.
            </p>
            <button id="btn-go-to-settings" class="action-btn primary">Go to Settings</button>
        </div>
        
        <!-- Analysis Content -->
        <div id="ai-analysis-content" style="display: none;">
            <!-- Overall Score Card -->
            <div class="score-card" style="margin-bottom: 24px;">
                <div class="score-circle" style="width: 120px; height: 120px; margin: 0 auto;">
                    <span id="ai-overall-score" style="font-size: 48px; font-weight: 700;">--</span>
                    <small style="font-size: 12px; margin-top: 8px;">AI Score</small>
                </div>
                <div style="text-align: center; margin-top: 16px;">
                    <div id="ai-overall-rating" style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">--</div>
                    <div id="ai-overall-summary" style="font-size: 13px; color: var(--md-sys-color-on-surface-variant); max-width: 400px; margin: 0 auto;"></div>
                </div>
                <div style="text-align: center; margin-top: 16px;">
                    <button id="btn-generate-ai-analysis" class="action-btn primary">Generate Analysis</button>
                </div>
            </div>
            
            <!-- Loading State -->
            <div id="ai-analysis-loading" style="display: none; text-align: center; padding: 40px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--md-sys-color-primary-container); border-top-color: var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                <p style="color: var(--md-sys-color-on-surface-variant); font-size: 14px;">Analyzing content with AI...</p>
                <p style="color: var(--md-sys-color-on-surface-variant); font-size: 12px; margin-top: 8px;">This may take a few moments</p>
            </div>
            
            <!-- Error State -->
            <div id="ai-analysis-error" style="display: none; padding: 20px; background: var(--md-sys-color-error-container); border-radius: 8px; color: var(--md-sys-color-on-error-container);"></div>
            
            <!-- Metrics Chart -->
            <div id="ai-metrics-chart-container" style="margin-bottom: 24px; display: none;">
                <div class="card">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Content Quality Metrics</h3>
                    <div class="chart-container">
                        <canvas id="ai-metrics-chart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Detailed Metrics Grid -->
            <div id="ai-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;"></div>
            
            <!-- Detailed Analysis Sections -->
            <div id="ai-detailed-analysis"></div>
            
            <!-- Recommendations -->
            <div id="ai-recommendations" style="margin-top: 24px;"></div>
            
            <!-- Improvement Plan -->
            <div id="ai-improvement-plan" style="margin-top: 24px;"></div>
            
            <!-- Comparison Chart -->
            <div id="ai-comparison-chart-container" style="margin-top: 24px; display: none;">
                <div class="card">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Score Comparison</h3>
                    <div class="chart-container">
                        <canvas id="ai-comparison-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function renderKeywordsInsightsTab() {
    return `
    <div id="keywords-insights" class="tab-content">
        <h3>Keywords Insights</h3>
        <p class="text-xs text-secondary" style="margin-bottom: 16px;">Organic keyword performance data from Google Search Console for the current domain.</p>
        
        <!-- Performance data will be rendered here by keywords-performance.js -->
        <div id="keywords-performance-container"></div>
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

        <div class="data-group">
            <div class="label-row">
                <label>Open Notes & To-Do on Startup</label>
                <label class="switch">
                    <input type="checkbox" id="toggle-default-notes">
                    <span class="slider"></span>
                </label>
            </div>
            <p class="text-xs text-secondary" style="margin-top: 4px;">If enabled, the extension will open the Notes tab by default instead of Overview.</p>
        </div>
        
        <h3>Google Gemini AI</h3>
        <p class="text-xs text-secondary">Configure your Gemini API key to enable AI-powered SEO analysis.</p>
        <div class="data-group">
            <label>API Key</label>
            <div class="label-row">
                <input type="password" id="gemini-api-key" class="data-value" placeholder="Enter your Gemini API key" style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);">
                <button id="btn-save-api-key" class="action-btn secondary small">Save</button>
            </div>
            <p class="text-xs text-secondary" style="margin-top: 4px;">
                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: var(--md-sys-color-primary);">Google AI Studio</a>
            </p>
        </div>
        <div class="data-group">
            <label>Model</label>
            <select id="gemini-model" class="data-value" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);">
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</option>
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-pro-vision">Gemini Pro Vision</option>
                <option value="gemini-exp-1206">Gemini Experimental 1206</option>
            </select>
        </div>
        <div id="gemini-status" style="margin-top: 8px; padding: 8px; border-radius: 4px; display: none;"></div>
        

        <h3>Keywords Research APIs</h3>
        <p class="text-xs text-secondary">Configure Google Search Console and Google Ads API access for keyword insights.</p>
        <div id="keywords-api-settings"></div>
        
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

/**
 * Render Ad Transparency Tab
 */
function renderAdTransparencyTab() {
    return `
    <div id="ad-transparency" class="tab-content">
        <div class="data-group">
            <div class="label-row" style="justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Google Ads Lookup
                </label>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 500; color: var(--md-sys-color-on-surface-variant); margin-bottom: 6px; text-transform: uppercase;">Region</label>
                    <select id="ads-region-selector" style="width: 100%; padding: 10px 12px; border: 1px solid var(--md-sys-color-surface-variant); border-radius: var(--radius-sm); background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); font-size: 14px; cursor: pointer;">
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="EU">European Union</option>
                        <option value="anywhere">Worldwide</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="IN">India</option>
                        <option value="JP">Japan</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="BR">Brazil</option>
                        <option value="MX">Mexico</option>
                    </select>
                </div>
                <button id="btn-view-ads" class="action-btn primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                    View Ads in Transparency Center
                </button>
            </div>
        </div>

        <div class="data-group">
            <div class="label-row" style="justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Meta Ads Lookup
                </label>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 500; color: var(--md-sys-color-on-surface-variant); margin-bottom: 6px; text-transform: uppercase;">Country</label>
                    <select id="meta-ads-country-selector" style="width: 100%; padding: 10px 12px; border: 1px solid var(--md-sys-color-surface-variant); border-radius: var(--radius-sm); background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); font-size: 14px; cursor: pointer;">
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="ALL">All Countries</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="IN">India</option>
                        <option value="JP">Japan</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="BR">Brazil</option>
                        <option value="MX">Mexico</option>
                    </select>
                </div>
                <button id="btn-view-meta-ads" class="action-btn primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                    View Ads in Meta Library
                </button>
            </div>
        </div>

        <div class="card" style="margin-top: 24px;">
            <div class="data-group" style="margin-bottom: 0;">
                <div class="label-row">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        About Ad Transparency
                    </label>
                </div>
                <p style="margin-top: 12px; line-height: 1.6; color: var(--md-sys-color-on-surface-variant); font-size: 13px;">
                    View advertising campaigns from major ad platforms. These tools help you research competitor strategies and understand ad messaging across different platforms.
                </p>
                <ul style="margin-top: 12px; line-height: 1.8; color: var(--md-sys-color-on-surface-variant); font-size: 13px; padding-left: 20px;">
                    <li><strong>Google Ads Transparency:</strong> Search and political ads running on Google platforms</li>
                    <li><strong>Meta Ads Library:</strong> All ads currently running on Facebook and Instagram</li>
                </ul>
            </div>
        </div>
    </div>`;
}

/**
 * Render Tag Detector Tab
 */
function renderTagDetectorTab() {
    return `
    <div id="tag-detector" class="tab-content">
        <div class="card">
            <h3 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
                </svg>
                Analytics & Tag Managers
            </h3>
            <div id="tags-analytics" class="data-value">--</div>
        </div>

        <div class="card">
            <h3 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
                Advertising Pixels
            </h3>
            <div id="tags-pixels" class="data-value">--</div>
        </div>

        <div class="card">
            <h3 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/>
                </svg>
                Privacy & Compliance
            </h3>
            <div id="tags-privacy" class="data-value">--</div>
        </div>

        <div class="card">
            <h3 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
                </svg>
                Other Marketing Tools
            </h3>
            <div id="tags-other" class="data-value">--</div>
        </div>

        <div class="card" style="background: var(--md-sys-color-surface-variant); border-left: 4px solid var(--md-sys-color-primary);">
            <div class="data-group" style="margin-bottom: 0;">
                <div class="label-row">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        About Tag Detection
                    </label>
                </div>
                <p style="margin-top: 12px; line-height: 1.6; color: var(--md-sys-color-on-surface-variant); font-size: 13px;">
                    This tool scans the page to detect marketing tags, analytics scripts, advertising pixels, and privacy compliance tools. Understanding which tags are present helps you:
                </p>
                <ul style="margin-top: 8px; line-height: 1.8; color: var(--md-sys-color-on-surface-variant); font-size: 13px; padding-left: 20px;">
                    <li>Verify proper tag implementation</li>
                    <li>Identify competitor tracking strategies</li>
                    <li>Ensure privacy compliance</li>
                    <li>Debug analytics issues</li>
                </ul>
            </div>
        </div>
    </div>`;
}

function renderTrackingBuilderTab() {
    return `
    <div id="tracking-builder" class="tab-content">
        <div id="tracking-builder-content"></div>
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

/**
 * Render Terms & Privacy Tab
 */
function renderTermsTab() {
    return `
    <div id="terms" class="tab-content">
        <div class="card" style="padding: 24px;">
            <h2 style="margin-bottom: 20px; font-size: 20px; color: var(--md-sys-color-primary);">Terms of Use & Privacy Policy</h2>
            
            <div class="data-group">
                <label style="font-size: 14px; color: var(--md-sys-color-primary); margin-bottom: 8px; display: block;">Privacy Commitment</label>
                <p style="font-size: 13px; line-height: 1.6; color: var(--md-sys-color-on-surface-variant);">
                    Your privacy is our priority. SEO Analyzer Pro operates entirely locally on your device. We do not collect, store, or transmit any of your browsing data, analyzed URLs, or credentials to any external servers. All data remains in your browser's local storage and PouchDB database.
                </p>
            </div>

            <div class="data-group" style="margin-top: 24px;">
                <label style="font-size: 14px; color: var(--md-sys-color-primary); margin-bottom: 8px; display: block;">Usage Terms</label>
                <p style="font-size: 13px; line-height: 1.6; color: var(--md-sys-color-on-surface-variant);">
                    This extension is provided "as is" without warranty of any kind. While we strive for accuracy in SEO analysis, users should verify critical information independently. The extension is designed for professional SEO research and audit purposes.
                </p>
            </div>

            <div class="data-group" style="margin-top: 24px;">
                <label style="font-size: 14px; color: var(--md-sys-color-primary); margin-bottom: 8px; display: block;">AI Features</label>
                <p style="font-size: 13px; line-height: 1.6; color: var(--md-sys-color-on-surface-variant);">
                    If you enable AI features by providing a Gemini API key, please note that your page content will be sent directly to Google's Gemini API for analysis. This interaction is direct between your browser and Google; SEO Analyzer Pro does not proxy or store these requests.
                </p>
            </div>
            
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--md-sys-color-surface-variant); text-align: center;">
                <p style="font-size: 12px; color: var(--md-sys-color-on-surface-variant);">© 2026 SEO Analyzer Pro. All rights reserved.</p>
            </div>
        </div>
    </div>`;
}

/**
 * Render Contact Us Tab
 */
function renderContactTab() {
    return `
    <div id="contact" class="tab-content">
        <div class="card" style="padding: 24px; text-align: center;">
            <div style="width: 64px; height: 64px; background: var(--md-sys-color-primary-container); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <i class="fa-solid fa-envelope" style="font-size: 28px; color: var(--md-sys-color-on-primary-container);"></i>
            </div>
            <h2 style="margin-bottom: 8px; font-size: 20px;">Get in Touch</h2>
            <p style="color: var(--md-sys-color-on-surface-variant); font-size: 14px; margin-bottom: 24px;">
                Have a question, feedback, or need help? We'd love to hear from you.
            </p>
            
            <div style="background: var(--md-sys-color-surface-variant); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
                <div style="text-align: left;">
                    <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); text-transform: uppercase; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px;">Email Support</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--md-sys-color-on-surface); word-break: break-all;">isitstrange@outlook.com</div>
                </div>
                <button class="action-btn secondary small" onclick="copyToClipboard('isitstrange@outlook.com', this)" style="width: 100%; justify-content: center; padding: 10px;">
                    <i class="fa-solid fa-copy" style="margin-right: 8px;"></i> Copy Email Address
                </button>
            </div>
            
            <p style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); line-height: 1.5;">
                We typically respond to all inquiries within 24-48 hours. Thank you for your patience!
            </p>
        </div>
    </div>`;
}

/**
 * Render Help & Support Tab
 */
function renderSupportTab() {
    return `
    <div id="support" class="tab-content">
        <div class="card" style="padding: 24px;">
            <h2 style="margin-bottom: 16px; font-size: 20px;">Help & Support</h2>
            <p style="color: var(--md-sys-color-on-surface-variant); font-size: 14px; margin-bottom: 24px; line-height: 1.6;">
                Need help getting started or found a bug? Check out our GitHub repository for documentation and issue reporting.
            </p>
            
            <div class="data-group">
                <a href="https://github.com/vaibhav-pratap/" target="_blank" class="card" style="display: flex; align-items: center; gap: 16px; padding: 16px; text-decoration: none; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-surface-variant); transition: background 0.2s;">
                    <div style="width: 48px; height: 48px; background: #24292e; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-brands fa-github" style="font-size: 24px; color: white;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 15px; font-weight: 700; color: var(--md-sys-color-on-surface);">GitHub Profile</div>
                        <div style="font-size: 13px; color: var(--md-sys-color-on-surface-variant);">github.com/vaibhav-pratap/</div>
                    </div>
                    <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 14px; color: var(--md-sys-color-on-surface-variant);"></i>
                </a>
            </div>

            <div style="margin-top: 24px;">
                <h3 style="font-size: 15px; margin-bottom: 12px;">Quick Guides</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="data-value" style="padding: 12px; font-size: 13px; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-circle-info" style="color: var(--md-sys-color-primary);"></i>
                        Using CWV Core Web Vitals Chart
                    </div>
                    <div class="data-value" style="padding: 12px; font-size: 13px; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-circle-info" style="color: var(--md-sys-color-primary);"></i>
                        Generating AI SEO Insights
                    </div>
                    <div class="data-value" style="padding: 12px; font-size: 13px; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-circle-info" style="color: var(--md-sys-color-primary);"></i>
                        Exporting SEO Reports (PDF/Excel)
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 24px; text-align: center;">
                <p style="font-size: 12px; color: var(--md-sys-color-on-surface-variant);">Version 1.6.0 (Latest)</p>
            </div>
        </div>
    </div>`;
}
