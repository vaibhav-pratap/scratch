/**
 * Global Authentication Service
 * Manages Google Sign-In and User Profile
 * 
 * DEVELOPMENT vs PRODUCTION:
 * - DEV: Uses Web Application OAuth (launchWebAuthFlow)
 * - PROD: Switch to Chrome Extension OAuth (getAuthToken) when publishing to Chrome Web Store
 */

import { getSettings, saveSettings } from '../core/storage.js';

// OAuth Configuration
// DEV: Web Application client (for unpublished extension)
const DEV_CLIENT_ID = '106325929364-bkc4a5r01g7o32vjc15umc64bdqg6l7q.apps.googleusercontent.com';

// PROD: Chrome Extension client (for published extension)
// const PROD_CLIENT_ID = '106325929364-rcs850a9c7qircjrsn50988c6t4maka0.apps.googleusercontent.com';

// Current environment
const IS_DEV = true; // Set to false when publishing to Chrome Web Store
const CLIENT_ID = IS_DEV ? DEV_CLIENT_ID : PROD_CLIENT_ID;

const SCOPES = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/webmasters.readonly', // Search Console
    'https://www.googleapis.com/auth/adwords', // Google Ads API
    'https://www.googleapis.com/auth/bigquery.readonly' // BigQuery API
];

/**
 * Sign In with Google
 * @returns {Promise<Object>} User profile and token
 */
export async function signIn() {
    try {
        console.log('[Auth] Starting OAuth flow...', IS_DEV ? '(DEV)' : '(PROD)');

        if (IS_DEV) {
            // Development: Use launchWebAuthFlow with Web Application OAuth
            return await signInDev();
        } else {
            // Production: Use getAuthToken with Chrome Extension OAuth
            return await signInProd();
        }

    } catch (error) {
        console.error('[Auth] Sign in error:', error);
        throw error;
    }
}

/**
 * Development Sign In using launchWebAuthFlow
 */
async function signInDev() {
    const redirectUri = chrome.identity.getRedirectURL();
    console.log('[Auth] Redirect URI:', redirectUri);

    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
        `client_id=${CLIENT_ID}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(SCOPES.join(' '))}`;

    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
            { url: authUrl, interactive: true },
            async (redirectUrl) => {
                if (chrome.runtime.lastError) {
                    console.error('[Auth] Flow failed:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (!redirectUrl) {
                    reject(new Error('No redirect URL received'));
                    return;
                }

                console.log('[Auth] Got redirect URL');

                // Extract access token from URL hash
                const url = new URL(redirectUrl);
                const params = new URLSearchParams(url.hash.substring(1));
                const accessToken = params.get('access_token');

                if (!accessToken) {
                    reject(new Error('No access token in redirect URL'));
                    return;
                }

                console.log('[Auth] Got token, fetching user info...');

                try {
                    const userInfo = await fetchUserInfo(accessToken);

                    await saveSettings({
                        authToken: accessToken,
                        userProfile: userInfo
                    });

                    console.log('[Auth] Sign in successful:', userInfo.email);
                    resolve({ accessToken, userInfo });
                } catch (err) {
                    console.error('[Auth] Failed to fetch user info:', err);
                    reject(err);
                }
            }
        );
    });
}

/**
 * Production Sign In using getAuthToken
 * Requires oauth2 field in manifest.json
 */
async function signInProd() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            if (chrome.runtime.lastError) {
                console.error('[Auth] OAuth error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            if (!token) {
                reject(new Error('No access token received'));
                return;
            }

            console.log('[Auth] Got token, fetching user info...');

            try {
                const userInfo = await fetchUserInfo(token);

                await saveSettings({
                    authToken: token,
                    userProfile: userInfo
                });

                console.log('[Auth] Sign in successful:', userInfo.email);
                resolve({ accessToken: token, userInfo });
            } catch (err) {
                console.error('[Auth] Failed to fetch user info:', err);
                reject(err);
            }
        });
    });
}

/**
 * Sign Out
 * Clears local session and revokes token
 */
export async function signOut() {
    const { authToken } = await getSettings(['authToken']);

    if (authToken) {
        if (IS_DEV) {
            // Dev: Revoke via Google API
            try {
                await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${authToken}`);
                console.log('[Auth] Token revoked');
            } catch (err) {
                console.warn('[Auth] Failed to revoke token:', err);
            }
        } else {
            // Prod: Remove cached token
            chrome.identity.removeCachedAuthToken({ token: authToken }, () => {
                console.log('[Auth] Cached token removed');
            });
        }
    }

    await saveSettings({
        authToken: null,
        userProfile: null,
        gscAccessToken: null
    });
}

/**
 * Get Current Token
 */
export async function getToken() {
    const { authToken } = await getSettings(['authToken']);
    return authToken;
}

/**
 * Get Current User Profile
 */
export async function getUserProfile() {
    const { userProfile } = await getSettings(['userProfile']);
    return userProfile;
}

/**
 * Check if authenticated
 */
export async function isAuthenticated() {
    const token = await getToken();
    return !!token;
}

/**
 * Fetch User Info from Google API
 */
async function fetchUserInfo(token) {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user info');
    }

    return response.json();
}
