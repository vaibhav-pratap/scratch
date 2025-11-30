/**
 * Keywords Research Settings UI
 * Manages API keys for Google Search Console and Google Ads
 */

import { getSettings, saveSettings } from '../core/storage.js';

/**
 * Render Keywords Research Settings Section
 */
export function renderKeywordsSettings(container) {
    // Simplified UI - auto-detect domain, no manual configuration needed
    container.innerHTML = `
        <!-- Google Search Console -->
        <div class="data-group">
            <label>Google Search Console API Key</label>
            <div class="label-row">
                <input type="password" id="gsc-api-key" class="data-value" placeholder="Enter your Search Console API key..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);">
                <button id="save-gsc-settings" class="action-btn secondary small">Save</button>
            </div>
            <p class="text-xs text-secondary" style="margin-top: 4px;">
                Used for organic keyword performance data. <a href="#" class="help-link" id="gsc-help-link" style="color: var(--md-sys-color-primary);">How to get this?</a>
            </p>
            
            <!-- Inline Help Section (Hidden by default) -->
            <div id="gsc-help-section" style="display: none; margin-top: 12px; padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid var(--md-sys-color-primary);">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">How to Get Your Search Console API Key</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" style="color: var(--md-sys-color-primary);">Google Cloud Console</a></li>
                    <li>Create a new project or select an existing one</li>
                    <li>Navigate to <strong>APIs & Services</strong> → <strong>Library</strong></li>
                    <li>Search for "<strong>Google Search Console API</strong>" and enable it</li>
                    <li>Go to <strong>Credentials</strong> → <strong>Create Credentials</strong> → <strong>API Key</strong></li>
                    <li>Copy your API key and paste it above</li>
                </ol>
                <p style="margin: 12px 0 0 0; padding: 12px; background: var(--md-sys-color-surface); border-radius: 4px; font-size: 12px;">
                    <strong>Note:</strong> The extension will automatically detect and use the current domain. You don't need to verify properties manually. The API is free but has rate limits.
                    <a href="https://developers.google.com/webmaster-tools/v1/quota" target="_blank" style="color: var(--md-sys-color-primary);">Learn more about quotas</a>
                </p>
            </div>
        </div>

        <!-- Google Ads API -->
        <div class="data-group">
            <label>Google Ads API Key (Keyword Planner)</label>
            <div class="label-row">
                <input type="password" id="google-ads-api-key" class="data-value" placeholder="Enter your Google Ads API key..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);">
                <button id="save-ads-settings" class="action-btn secondary small">Save</button>
            </div>
            <p class="text-xs text-secondary" style="margin-top: 4px;">
                Required for keyword suggestions and search volume data. <a href="#" class="help-link" id="ads-help-link" style="color: var(--md-sys-color-primary);">How to get this?</a>
            </p>
            
            <!-- Inline Help Section (Hidden by default) -->
            <div id="ads-help-section" style="display: none; margin-top: 12px; padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid var(--md-sys-color-primary);">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">How to Get Your Google Ads API Key</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" style="color: var(--md-sys-color-primary);">Google Cloud Console</a></li>
                    <li>Enable the "<strong>Google Ads API</strong>" in your project</li>
                    <li>Set up OAuth 2.0 credentials or API key</li>
                    <li>Copy your API credentials</li>
                </ol>
                <p style="margin: 12px 0 0 0; padding: 12px; background: var(--md-sys-color-surface); border-radius: 4px; font-size: 12px;">
                    <strong>Billing Note:</strong>
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 40px; font-size: 12px; line-height: 1.6;">
                    <li>Keyword Planner data requires a Google Ads account (free to create)</li>
                    <li>You don't need to run ads to access planning data</li>
                    <li>Free tier: Limited to 25,000 keyword ideas/day</li>
                    <li>Your usage is tied to your personal account quotas</li>
                </ul>
                <p style="margin: 8px 0 0 0; font-size: 12px;">
                    <a href="https://developers.google.com/google-ads/api/docs/start" target="_blank" style="color: var(--md-sys-color-primary);">View API Documentation</a>
                </p>
            </div>
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
    document.getElementById('gsc-help-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleHelpSection('gsc-help-section');
    });

    document.getElementById('ads-help-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleHelpSection('ads-help-section');
    });

    // Save settings
    document.getElementById('save-gsc-settings')?.addEventListener('click', saveGSCSettings);
    document.getElementById('save-ads-settings')?.addEventListener('click', saveAdsSettings);
}

/**
 * Toggle inline help section
 */
function toggleHelpSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    if (section.style.display === 'none') {
        section.style.display = 'block';
        // Smooth scroll to make it visible
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        section.style.display = 'none';
    }
}

/**
 * Load saved settings
 */
async function loadKeywordsSettings() {
    try {
        const settings = await getSettings(['gscApiKey', 'googleAdsApiKey']);

        // Load GSC API Key (masked)
        const gscInput = document.getElementById('gsc-api-key');
        if (gscInput && settings.gscApiKey) {
            // Show masked version as placeholder
            gscInput.placeholder = settings.gscApiKey.substring(0, 8) + '...' + settings.gscApiKey.substring(settings.gscApiKey.length - 4) + ' (click to change)';
            gscInput.value = '';

            // Add focus handler to clear placeholder when user starts typing
            gscInput.addEventListener('focus', () => {
                if (gscInput.value === '') {
                    gscInput.placeholder = 'Enter your Search Console API key...';
                }
            });
        }

        // Load Google Ads API Key (masked)
        const adsInput = document.getElementById('google-ads-api-key');
        if (adsInput && settings.googleAdsApiKey) {
            // Show masked version as placeholder
            adsInput.placeholder = settings.googleAdsApiKey.substring(0, 8) + '...' + settings.googleAdsApiKey.substring(settings.googleAdsApiKey.length - 4) + ' (click to change)';
            adsInput.value = '';

            // Add focus handler to clear placeholder when user starts typing
            adsInput.addEventListener('focus', () => {
                if (adsInput.value === '') {
                    adsInput.placeholder = 'Enter your Google Ads API key...';
                }
            });
        }

    } catch (error) {
        console.error('[Keywords Settings] Error loading settings:', error);
    }
}

/**
 * Save GSC Settings
 */
async function saveGSCSettings() {
    const apiKeyInput = document.getElementById('gsc-api-key');
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        // Check if there's a saved key
        const settings = await getSettings(['gscApiKey']);
        if (settings.gscApiKey) {
            showMessage('info', 'API key already saved. Enter a new key to update.');
            return;
        }
        showMessage('error', 'Please enter an API key.');
        return;
    }

    try {
        await saveSettings({ gscApiKey: apiKey });

        // Clear input and show masked placeholder
        apiKeyInput.value = '';
        apiKeyInput.placeholder = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) + ' (click to change)';

        showMessage('success', 'Search Console API key saved!');
    } catch (error) {
        console.error('[Keywords Settings] Error saving GSC settings:', error);
        showMessage('error', 'Failed to save settings.');
    }
}

/**
 * Save Google Ads Settings
 */
async function saveAdsSettings() {
    const apiKeyInput = document.getElementById('google-ads-api-key');
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        // Check if there's a saved key
        const settings = await getSettings(['googleAdsApiKey']);
        if (settings.googleAdsApiKey) {
            showMessage('info', 'API key already saved. Enter a new key to update.');
            return;
        }
        showMessage('error', 'Please enter an API key.');
        return;
    }

    try {
        await saveSettings({ googleAdsApiKey: apiKey });

        // Clear input and show masked placeholder
        apiKeyInput.value = '';
        apiKeyInput.placeholder = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) + ' (click to change)';

        showMessage('success', 'Google Ads API key saved!');
    } catch (error) {
        console.error('[Keywords Settings] Error saving Ads settings:', error);
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

    let bgColor = '#d93025'; // error
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

