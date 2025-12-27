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
    `;

    initKeywordsSettings();
}

/**
 * Initialize Keywords Settings Event Listeners
 */
async function initKeywordsSettings() {
    // Load existing settings
    await loadKeywordsSettings();

    // Profile Link
    document.getElementById('btn-gsc-manage-profile')?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'profile' } }));
    });
}

/**
 * Load saved settings and refresh auth status
 */
async function loadKeywordsSettings() {
    try {
        // Check Global Auth Status
        const isAuth = await isAuthenticated();
        updateAuthStatus(isAuth);
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


