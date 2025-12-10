/**
 * Keywords Research Settings UI
 * Manages API keys for Google Search Console and Google Ads
 */

import { getSettings, saveSettings } from '../core/storage.js';
import { isAuthenticated } from '../services/auth.js';

/**
 * Render Keywords Research Settings Section
 */
export function renderKeywordsSettings(container) {
    container.innerHTML = `
        <!-- Google Search Console -->
        <div class="data-group">
            <label>Google Search Console Access</label>
            <p class="text-xs text-secondary" style="margin-bottom: 12px;">
                Connect your Google account to view organic search performance data.
            </p>

            <!-- Authentication Status -->
            <div id="gsc-auth-status" class="auth-status-card" style="padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
                <div id="gsc-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: var(--md-sys-color-secondary);"></div>
                <div style="flex: 1;">
                    <div id="gsc-status-text" style="font-weight: 500; font-size: 13px;">Not Connected</div>
                    <div id="gsc-status-subtext" class="text-xs text-secondary">Sign in via Profile to access data</div>
                </div>
                <button id="btn-gsc-manage-profile" class="action-btn secondary small">Manage in Profile</button>
            </div>
        </div>

        <!-- Google Ads API Credentials -->
        <div class="data-group">
            <label>Google Ads API (Keyword Planner)</label>
            <p class="text-xs text-secondary" style="margin-bottom: 12px;">
                Uses your Google Sign-In for authentication. Only Developer Token and Customer ID required. <a href="#" class="help-link" id="ads-help-link" style="color: var(--md-sys-color-primary);">How to get these?</a>
            </p>

            <div id="ads-help-section" style="display: none; margin-bottom: 16px; padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid var(--md-sys-color-primary);">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">Setup Google Ads API Access</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                    <li><strong>Sign In:</strong> Use the Profile tab to sign in (already done! ✓)</li>
                    <li><strong>Developer Token:</strong> Apply at <a href="https://ads.google.com/aw/apicenter" target="_blank" style="color: var(--md-sys-color-primary);">Google Ads API Center</a> (takes 24-48 hours)</li>
                    <li><strong>Customer ID:</strong> Find your 10-digit number in Google Ads dashboard (top-right corner)</li>
                    <li><strong>Enable API:</strong> Make sure Google Ads API is enabled in <a href="https://console.cloud.google.com/apis/library/googleads.googleapis.com" target="_blank" style="color: var(--md-sys-color-primary);">Google Cloud</a></li>
                </ol>
                <p style="margin: 12px 0 0 0; padding: 8px; background: rgba(26, 115, 232, 0.1); border-radius: 4px; font-size: 12px;">
                    💡 <strong>Tip:</strong> No separate login needed! We use your existing Google Sign-In with added Google Ads permissions.
                </p>
            </div>

            <div style="margin-bottom: 12px;">
                <label class="text-xs" style="display: block; margin-bottom: 6px; font-weight: 500;">Developer Token</label>
                <div class="label-row">
                    <input type="password" id="google-ads-dev-token" class="data-value" placeholder="Enter Developer Token..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px;">
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <label class="text-xs" style="display: block; margin-bottom: 6px; font-weight: 500;">Customer ID</label>
                <div class="label-row">
                    <input type="text" id="google-ads-customer-id" class="data-value" placeholder="1234567890" style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px;">
                </div>
                <p class="text-xs text-secondary" style="margin-top: 4px;">Found in your Google Ads dashboard (format: 123-456-7890 or 1234567890)</p>
            </div>

            <button id="save-ads-settings" class="action-btn secondary small" style="width: 100%;">Save Google Ads Credentials</button>
        </div>

        <!-- BigQuery Settings -->
        <div class="data-group">
            <label>BigQuery Configuration</label>
            <p class="text-xs text-secondary" style="margin-bottom: 12px;">
                Configure access to Google BigQuery for advanced keyword analysis. <a href="#" class="help-link" id="bq-help-link" style="color: var(--md-sys-color-primary);">How to get these?</a>
            </p>

            <div id="bq-help-section" style="display: none; margin-bottom: 16px; padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid var(--md-sys-color-primary);">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">Setup Google BigQuery Access</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                    <li><strong>Sign In:</strong> Go to the Profile tab and sign in with your Google account</li>
                    <li><strong>Create a Project:</strong> Go to <a href="https://console.cloud.google.com/projectcreate" target="_blank" style="color: var(--md-sys-color-primary);">Google Cloud Console</a> and create a new project</li>
                    <li><strong>Enable BigQuery API:</strong> Navigate to <a href="https://console.cloud.google.com/apis/library/bigquery.googleapis.com" target="_blank" style="color: var(--md-sys-color-primary);">BigQuery API</a> and click "Enable"</li>
                    <li><strong>Get Project ID:</strong> Find your Project ID in the Cloud Console dashboard (usually in the format: project-name-123456)</li>
                    <li><strong>Add OAuth Consent:</strong> Add your Google account email to the OAuth consent screen test users if needed</li>
                </ol>
                <p style="margin: 12px 0 0 0; padding: 8px; background: rgba(26, 115, 232, 0.1); border-radius: 4px; font-size: 12px;">
                    💡 <strong>Note:</strong> BigQuery uses OAuth2 authentication (same as Google Search Console). You must be signed in to use this feature.
                </p>
            </div>

            <div style="margin-bottom: 12px;">
                <label class="text-xs" style="display: block; margin-bottom: 6px; font-weight: 500;">Project ID</label>
                <input type="text" id="bq-project-id" class="data-value" placeholder="e.g., my-seo-project-123" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px;">
                <p class="text-xs text-secondary" style="margin-top: 4px;">Authentication is handled via Google Sign-In (Profile tab)</p>
            </div>

            <button id="save-bq-settings" class="action-btn secondary small" style="width: 100%;">Save BigQuery Settings</button>
        </div>
    `;

    initKeywordsSettings();
}

/**
 * Initialize Keywords Settings Event Listeners
 */
async function initKeywordsSettings() {
    // Load existing settings
    await loadKeywordsSettings();

    // Help link toggles
    document.getElementById('ads-help-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleHelpSection('ads-help-section');
    });

    document.getElementById('bq-help-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleHelpSection('bq-help-section');
    });

    // Save Ads settings
    document.getElementById('save-ads-settings')?.addEventListener('click', saveAdsSettings);

    // Save BigQuery settings
    document.getElementById('save-bq-settings')?.addEventListener('click', saveBigQuerySettings);

    // Profile Link
    document.getElementById('btn-gsc-manage-profile')?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'profile' } }));
    });
}

/**
 * Toggle inline help section
 */
function toggleHelpSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

/**
 * Load saved settings and refresh auth status
 */
async function loadKeywordsSettings() {
    try {
        // Check Global Auth Status
        const isAuth = await isAuthenticated();
        updateAuthStatus(isAuth);

        // Load settings
        const settings = await getSettings(['googleAdsDevToken', 'googleAdsCustomerId', 'bigqueryProjectId']);

        // Load BigQuery Project ID
        const bqProjectInput = document.getElementById('bq-project-id');
        if (bqProjectInput && settings.bigqueryProjectId) {
            bqProjectInput.value = settings.bigqueryProjectId;
        }

        // Load Google Ads credentials
        const devTokenInput = document.getElementById('google-ads-dev-token');
        const customerIdInput = document.getElementById('google-ads-customer-id');

        if (devTokenInput && settings.googleAdsDevToken) {
            devTokenInput.placeholder = '•••••••• (click to change)';
            devTokenInput.value = '';
            devTokenInput.addEventListener('focus', () => {
                if (devTokenInput.value === '') devTokenInput.placeholder = 'Enter Developer Token...';
            });
        }

        if (customerIdInput && settings.googleAdsCustomerId) {
            customerIdInput.value = settings.googleAdsCustomerId;
        }

    } catch (error) {
        console.error('[Keywords Settings] Error loading settings:', error);
    }
}

/**
 * Update Authentication Status UI
 */
function updateAuthStatus(isConnected) {
    const dot = document.getElementById('gsc-status-dot');
    const text = document.getElementById('gsc-status-text');
    const subtext = document.getElementById('gsc-status-subtext');

    if (!dot || !text || !subtext) return;

    if (isConnected) {
        dot.style.background = '#1e8e3e';
        text.textContent = 'Connected';
        subtext.textContent = 'Access token active';
    } else {
        dot.style.background = 'var(--md-sys-color-secondary)';
        text.textContent = 'Not Connected';
        subtext.textContent = 'Sign in via Profile to access data';
    }
}

/**
 * Save Google Ads Settings
 */
async function saveAdsSettings() {
    const devTokenInput = document.getElementById('google-ads-dev-token');
    const customerIdInput = document.getElementById('google-ads-customer-id');

    const devToken = devTokenInput.value.trim();
    const customerId = customerIdInput.value.trim().replace(/-/g, '');

    if (!devToken && !customerId) {
        showMessage('error', 'Please enter at least one credential.');
        return;
    }

    try {
        const settingsToSave = {};
        if (devToken) settingsToSave.googleAdsDevToken = devToken;
        if (customerId) settingsToSave.googleAdsCustomerId = customerId;

        await saveSettings(settingsToSave);

        if (devToken) {
            devTokenInput.value = '';
            devTokenInput.placeholder = '•••••••• (click to change)';
        }

        showMessage('success', 'Google Ads credentials saved!');
    } catch (error) {
        console.error('[Keywords Settings] Error saving Ads settings:', error);
        showMessage('error', 'Failed to save settings.');
    }
}

/**
 * Save BigQuery Settings
 */
async function saveBigQuerySettings() {
    const projectInput = document.getElementById('bq-project-id');
    const projectId = projectInput.value.trim();

    if (!projectId) {
        showMessage('error', 'Please enter a BigQuery Project ID.');
        return;
    }

    try {
        await saveSettings({ bigqueryProjectId: projectId });
        showMessage('success', 'BigQuery settings saved!');
    } catch (error) {
        console.error('[Keywords Settings] Error saving BigQuery settings:', error);
        showMessage('error', 'Failed to save settings.');
    }
}

/**
 * Show toast message
 */
function showMessage(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    let bgColor = '#d93025';
    if (type === 'success') bgColor = '#1e8e3e';
    else if (type === 'info') bgColor = '#1967d2';

    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${bgColor};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
