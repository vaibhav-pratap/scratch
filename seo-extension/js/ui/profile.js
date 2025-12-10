/**
 * User Profile UI
 * Manages Global Authentication and User Settings
 */

import { signIn, signOut, getUserProfile, isAuthenticated } from '../services/auth.js';
import { getSettings, saveSettings } from '../core/storage.js';

export async function renderProfile(container) {
    const isAuth = await isAuthenticated();
    const user = await getUserProfile();

    container.innerHTML = `
        <div class="profile-container" style="max-width: 600px; margin: 0 auto;">
            <div class="profile-header" style="text-align: center; margin-bottom: 24px;">
                ${isAuth && user ? `
                    <img src="${user.picture}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px; border: 2px solid var(--md-sys-color-primary);">
                    <h2 style="margin: 0; font-size: 24px;">${user.name}</h2>
                    <p style="margin: 4px 0 0 0; color: var(--md-sys-color-secondary);">${user.email}</p>
                ` : `
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--md-sys-color-surface-variant); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--md-sys-color-on-surface-variant)">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    <h2 style="margin: 0; font-size: 24px;">Guest User</h2>
                    <p style="margin: 4px 0 0 0; color: var(--md-sys-color-secondary);">Sign in to access advanced features</p>
                `}
            </div>

            <div class="profile-card" style="background: var(--md-sys-color-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px;">Account Settings</h3>
                
                ${!isAuth ? `
                    <div class="auth-setup">
                        <p class="text-xs text-secondary" style="margin-bottom: 16px; text-align: center;">
                            Sign in with your Google account to enable Keywords Insights and other features.
                        </p>
                        
                        <button id="btn-global-signin" class="action-btn primary" style="width: 100%; justify-content: center; display: flex; align-items: center; gap: 8px;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                            Sign In with Google
                        </button>
                    </div>
                ` : `
                    <div class="auth-connected">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <span>Status</span>
                            <span style="color: #1e8e3e; font-weight: 500;">● Connected</span>
                        </div>
                        <button id="btn-global-signout" class="action-btn secondary" style="width: 100%; justify-content: center;">
                            Sign Out
                        </button>
                    </div>
                `}
            </div>

            <div class="profile-info" style="text-align: center; font-size: 12px; color: var(--md-sys-color-secondary);">
                <p>SEO Analyzer Pro v1.6.0</p>
            </div>
        </div>
    `;

    initProfileEvents(container);
}

function initProfileEvents(container) {
    document.getElementById('btn-global-signin')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-global-signin');
        btn.textContent = 'Signing in...';
        btn.disabled = true;

        try {
            await signIn();
            // Refresh profile view
            renderProfile(container);
        } catch (error) {
            alert('Sign in failed: ' + error.message);
            btn.textContent = 'Sign In with Google';
            btn.disabled = false;
        }
    });

    document.getElementById('btn-global-signout')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await signOut();
            // Refresh profile view
            renderProfile(container);
        }
    });
}
