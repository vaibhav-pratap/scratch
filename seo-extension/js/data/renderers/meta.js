import { copyToClipboard } from '../../utils/clipboard.js';
import { createTagCard } from './tags.js';

/**
 * Meta Tab Renderer
 * Renders meta tags, social previews (OG, X), and SERP preview in a grouped layout
 */

export function renderMetaTab(data) {
    const container = document.getElementById('meta-grouped-content');
    if (!container) return;

    let html = '';

    // --- 1. Google Search Preview & Basic Meta ---
    html += '<h3 style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg> Google Search Result</h3>';

    // Preview
    html += getSerpPreviewHtml(data);

    // Data Cards
    html += '<div style="margin-top: 16px;">';
    html += createTagCard('Title Tag', data.title || 'Missing', !!data.title, '', null, '');
    html += createTagCard('Meta Description', data.description || 'Missing', !!data.description, '', null, '');
    html += createTagCard('Meta Keywords', data.keywords || 'Missing', !!data.keywords, '', null, '');
    html += createTagCard('Canonical URL', data.canonical || 'Missing', !!data.canonical, '', null, '');
    html += createTagCard('Robots Tag', data.robots || 'Missing', !!data.robots, '', null, '');

    // Favicon Check
    const faviconUrl = data.favicon;
    const hasFavicon = faviconUrl && !faviconUrl.endsWith('favicon.ico'); // Simple check, can be improved
    const faviconHtml = hasFavicon ? `<img src="${faviconUrl}" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 8px;"> ${faviconUrl}` : 'Missing';
    html += createTagCard('Favicon', hasFavicon ? faviconUrl : 'Missing', hasFavicon, '', hasFavicon ? faviconHtml : null, '');

    html += '</div>';

    // --- 2. Open Graph (Facebook) ---
    html += '<h3 style="margin-top: 32px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> Open Graph (Facebook)</h3>';

    // Preview
    const og = data.og || {};
    html += getOgPreviewHtml(og);

    // Data Cards
    html += '<div style="margin-top: 16px;">';
    const ogFields = ['title', 'description', 'image', 'url', 'type', 'site_name'];

    ogFields.forEach(field => {
        const val = og[field];
        const isDetected = !!val;
        let displayVal = val || 'Missing';
        let copyVal = val || 'Missing';

        // Handle Image display in card
        if (field === 'image' && isDetected) {
            displayVal = `<a href="${val}" target="_blank" style="color: var(--md-sys-color-primary); text-decoration: none;">${val}</a>`;
        }

        html += createTagCard(`og:${field}`, copyVal, isDetected, '', field === 'image' && isDetected ? displayVal : null, '');
    });
    html += '</div>';

    // --- 3. X (Twitter) Card ---
    html += '<h3 style="margin-top: 32px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> X (Twitter) Card</h3>';

    // Preview
    const twitter = data.twitter || {};
    html += getXPreviewHtml(twitter, og);

    // Data Cards
    html += '<div style="margin-top: 16px;">';
    const twitterFields = ['card', 'site', 'creator', 'title', 'description', 'image'];

    twitterFields.forEach(field => {
        const val = twitter[field];
        const isDetected = !!val;
        let displayVal = val || 'Missing';
        let copyVal = val || 'Missing';

        // Handle Image display in card
        if (field === 'image' && isDetected) {
            displayVal = `<a href="${val}" target="_blank" style="color: var(--md-sys-color-primary); text-decoration: none;">${val}</a>`;
        }

        html += createTagCard(`twitter:${field}`, copyVal, isDetected, '', field === 'image' && isDetected ? displayVal : null, '');
    });
    html += '</div>';

    // Inject HTML
    container.innerHTML = html;

    // Attach Listeners for Copy Buttons
    container.querySelectorAll('.tag-copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = btn.getAttribute('data-copy-text');
            copyToClipboard(text, btn);
        });
    });
}

/**
 * Generate Google SERP Preview HTML
 */
function getSerpPreviewHtml(data) {
    const title = data.title || 'Missing Title';
    const displayTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;

    const desc = data.description || 'Missing Meta Description. Google will try to generate a snippet from the page content.';
    const displayDesc = desc.length > 160 ? desc.substring(0, 160) + '...' : desc;

    const url = data.canonical || data.url || 'example.com';
    let displayUrl = url;
    try {
        const u = new URL(url);
        displayUrl = `${u.hostname} › ${u.pathname.substring(1).replace(/\//g, ' › ')}`;
    } catch (e) { }

    return `
        <div class="preview-card serp-card">
            <div class="serp-header">
                <div class="serp-site-info">
                    <div class="serp-site-name">${new URL(data.url || 'https://example.com').hostname}</div>
                    <div class="serp-url">${displayUrl}</div>
                </div>
            </div>
            <div class="serp-title">${displayTitle}</div>
            <div class="serp-desc">${displayDesc}</div>
        </div>
    `;
}

/**
 * Generate Open Graph Preview HTML
 */
function getOgPreviewHtml(og) {
    if (!og || Object.keys(og).length === 0) {
        return '<div class="data-value" style="font-style:italic;">No Open Graph data found</div>';
    }

    const image = og.image;
    const title = og.title || 'Missing Title';
    const desc = og.description || '';
    const site = og.site_name || new URL(og.url || 'https://example.com').hostname.toUpperCase();

    return `
        <div class="preview-card og-card">
            ${image ? `<div class="og-image" style="background-image: url('${image}')"></div>` : '<div class="og-image-placeholder">No Image</div>'}
            <div class="og-content">
                <div class="og-site">${site}</div>
                <div class="og-title">${title}</div>
                ${desc ? `<div class="og-desc">${desc}</div>` : ''}
            </div>
        </div>
    `;
}

/**
 * Generate X (Twitter) Preview HTML
 */
function getXPreviewHtml(twitter, og) {
    // Fallback to OG if Twitter data is missing
    const data = { ...og, ...twitter };

    if (!data || Object.keys(data).length === 0) {
        return '<div class="data-value" style="font-style:italic;">No X/Twitter data found</div>';
    }

    const cardType = data.card || 'summary_large_image';
    const image = data.image;
    const title = data.title || 'Missing Title';
    const desc = data.description || '';
    const site = data.site || new URL(data.url || 'https://example.com').hostname;

    const isLarge = cardType === 'summary_large_image';

    return `
        <div class="preview-card x-card ${isLarge ? 'large' : 'summary'}">
            ${image ? `<div class="x-image" style="background-image: url('${image}')"></div>` : '<div class="x-image-placeholder">No Image</div>'}
            <div class="x-content">
                <div class="x-title">${title}</div>
                ${desc ? `<div class="x-desc">${desc}</div>` : ''}
                <div class="x-site">${site}</div>
            </div>
        </div>
    `;
}
