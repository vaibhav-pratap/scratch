import { copyToClipboard } from '../../utils/clipboard.js';

/**
 * Tag Detector Renderer
 * Renders detected marketing tags, analytics, and privacy compliance tools
 */

/**
 * Render Tag Detector Tab
 */
export function renderTagsTab(tags) {
    // Helper to attach copy listeners
    const attachListeners = (container) => {
        if (!container) return;
        container.querySelectorAll('.tag-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = btn.getAttribute('data-copy-text');
                copyToClipboard(text, btn);
            });
        });
    };

    // Analytics
    const analyticsEl = document.getElementById('tags-analytics');
    if (analyticsEl) {
        let analyticsHtml = '';
        const analytics = tags.analytics || {};
        let hasAnalytics = false;

        // Google Analytics 4
        if (analytics.ga4 && analytics.ga4.detected) {
            hasAnalytics = true;
            analytics.ga4.ids.forEach(id => {
                analyticsHtml += createTagCard(
                    'Google Analytics 4',
                    id,
                    true,
                    analytics.ga4.method || ''
                );
            });
        }

        // Universal Analytics
        if (analytics.universalAnalytics && analytics.universalAnalytics.detected) {
            hasAnalytics = true;
            analytics.universalAnalytics.ids.forEach(id => {
                analyticsHtml += createTagCard(
                    'Universal Analytics',
                    id,
                    true,
                    analytics.universalAnalytics.method || ''
                );
            });
        }

        // Google Tag Manager
        if (analytics.gtm && analytics.gtm.detected) {
            hasAnalytics = true;
            analytics.gtm.ids.forEach(id => {
                analyticsHtml += createTagCard(
                    'Google Tag Manager',
                    id,
                    true
                );
            });
        }

        analyticsEl.innerHTML = hasAnalytics ? analyticsHtml : `<div style="color: var(--md-sys-color-on-surface-variant); padding: 12px 0; font-style: italic;">No analytics tools detected</div>`;
        attachListeners(analyticsEl);
    }

    // Advertising Pixels
    const pixelsEl = document.getElementById('tags-pixels');
    if (pixelsEl) {
        let pixelsHtml = '';
        const pixels = tags.pixels || {};
        let hasPixels = false;

        const pixelNames = [
            { key: 'googleAds', name: 'Google Ads' },
            { key: 'facebookPixel', name: 'Facebook Pixel' },
            { key: 'linkedinInsight', name: 'LinkedIn Insight Tag' },
            { key: 'twitterPixel', name: 'Twitter/X Pixel' },
            { key: 'microsoftAds', name: 'Microsoft Advertising' },
            { key: 'tiktokPixel', name: 'TikTok Pixel' },
            { key: 'pinterestTag', name: 'Pinterest Tag' },
            { key: 'snapchatPixel', name: 'Snapchat Pixel' }
        ];

        pixelNames.forEach(pixel => {
            if (pixels[pixel.key] && pixels[pixel.key].detected) {
                hasPixels = true;
                pixels[pixel.key].ids.forEach(id => {
                    pixelsHtml += createTagCard(pixel.name, id, true);
                });
                // If detected but no IDs (rare, but possible for some pixels), show generic card
                if (pixels[pixel.key].ids.length === 0) {
                    pixelsHtml += createTagCard(pixel.name, 'Detected', true);
                }
            }
        });

        pixelsEl.innerHTML = hasPixels ? pixelsHtml : `<div style="color: var(--md-sys-color-on-surface-variant); padding: 12px 0; font-style: italic;">No advertising pixels detected</div>`;
        attachListeners(pixelsEl);
    }

    // Privacy & Compliance
    const privacyEl = document.getElementById('tags-privacy');
    if (privacyEl) {
        let privacyHtml = '';
        const privacy = tags.privacy || {};
        let hasPrivacy = false;

        // OneTrust
        if (privacy.oneTrust && privacy.oneTrust.detected) {
            hasPrivacy = true;
            privacyHtml += createTagCard('OneTrust', privacy.oneTrust.type, true);
        }

        // Cookiebot
        if (privacy.cookiebot && privacy.cookiebot.detected) {
            hasPrivacy = true;
            privacyHtml += createTagCard('Cookiebot', privacy.cookiebot.type, true);
        }

        // Generic Cookie Banner
        if (privacy.cookieBanner && privacy.cookieBanner.detected) {
            hasPrivacy = true;
            privacyHtml += createTagCard('Cookie Consent Banner', privacy.cookieBanner.type, true);
        }

        // Privacy Policy & Terms - Separate cards for each link
        if (privacy.privacyPolicy && privacy.privacyPolicy.detected) {
            hasPrivacy = true;
            privacy.privacyPolicy.links.forEach(link => {
                const linkHtml = `<a href="${link.href}" target="_blank" style="color: var(--md-sys-color-primary); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 200px;">${link.href}</a>`;
                // Use link text as the Card Title
                // Use "Link URL" as the label
                privacyHtml += createTagCard(link.text, link.href, true, '', linkHtml, 'Link URL:');
            });
        }

        privacyEl.innerHTML = hasPrivacy ? privacyHtml : `<div style="color: var(--md-sys-color-on-surface-variant); padding: 12px 0; font-style: italic;">No privacy tools detected</div>`;
        attachListeners(privacyEl);
    }

    // Other Tools
    const otherEl = document.getElementById('tags-other');
    if (otherEl) {
        let otherHtml = '';
        const other = tags.other || {};
        let hasOther = false;

        const toolNames = [
            { key: 'hotjar', name: 'Hotjar' },
            { key: 'mixpanel', name: 'Mixpanel' },
            { key: 'segment', name: 'Segment' },
            { key: 'intercom', name: 'Intercom' }
        ];

        toolNames.forEach(tool => {
            if (other[tool.key] && other[tool.key].detected) {
                hasOther = true;
                otherHtml += createTagCard(tool.name, other[tool.key].type, true);
            }
        });

        otherEl.innerHTML = hasOther ? otherHtml : `<div style="color: var(--md-sys-color-on-surface-variant); padding: 12px 0; font-style: italic;">No other marketing tools detected</div>`;
        attachListeners(otherEl);
    }
}

/**
 * Helper function to create a tag card
 */
export function createTagCard(name, detail, detected, extraInfo = '', customDetailHtml = null, detailLabel = 'Tracking ID:') {
    const statusIcon = detected
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: var(--md-sys-color-primary);"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: var(--md-sys-color-error);"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>';

    const statusText = detected ? 'Detected' : 'Not Found';
    const statusColor = detected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)';

    const copyBtn = detected && detail ? `
        <button class="tag-copy-btn" data-copy-text="${detail}" title="Copy" style="
            background: none; 
            border: none; 
            cursor: pointer; 
            padding: 4px; 
            color: var(--md-sys-color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            margin-left: auto;
        ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </button>
    ` : '';

    const detailContent = customDetailHtml ? customDetailHtml : detail;

    return `
        <div style="
            padding: 12px;
            margin-bottom: 8px;
            border-radius: var(--radius-sm);
            background: var(--md-sys-color-surface);
            border: 1px solid ${detected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)'};
            ${detected ? 'border-left: 4px solid var(--md-sys-color-primary);' : ''}
        ">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: ${detected && detail ? '8px' : '0'};">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${statusIcon}
                    <span style="font-weight: 500; color: var(--md-sys-color-on-surface);">${name}</span>
                </div>
                <span style="font-size: 12px; color: ${statusColor}; font-weight: 500;">${statusText}</span>
            </div>
            ${detected && detail ? `
                <div style="
                    font-size: 13px;
                    color: var(--md-sys-color-on-surface-variant);
                    padding: 8px 12px;
                    background: var(--md-sys-color-surface-variant);
                    border-radius: 4px;
                    word-break: break-all;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <div style="display: flex; gap: 6px; align-items: center; flex: 1; overflow: hidden;">
                        ${detailLabel ? `<strong style="white-space: nowrap;">${detailLabel}</strong>` : ''}
                        <span style="overflow: hidden; text-overflow: ellipsis;">${detailContent}</span>
                    </div>
                    ${copyBtn}
                </div>
            ` : ''}
            ${detected && extraInfo ? `
                <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px; padding-left: 24px;">
                    ${extraInfo}
                </div>
            ` : ''}
        </div>
    `;
}
