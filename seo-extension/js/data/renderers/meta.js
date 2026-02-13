import { createTagCard } from './tags.js';
import { copyToClipboard } from '../../utils/clipboard.js';

export function renderMetaTab(data) {
    const container = document.getElementById('meta-grouped-content');
    if (!container) return;

    let html = '';

    // --- 1. SEO Stats Dashboard ---
    html += renderMetaStats(data);

    // --- 2. Google Search Result & Essential Meta ---
    html += `
        <div class="meta-group-section">
            <div class="meta-group-header">
                <i class="fab fa-google"></i>
                <h3>Google Search Result</h3>
            </div>
            ${getSerpPreviewHtml(data)}
            
            <div class="meta-tags-list">
                ${createTagCard('Title Tag', data.title || 'Missing', !!data.title, `${data.title?.length || 0} characters`, null, '')}
                ${createTagCard('Meta Description', data.description || 'Missing', !!data.description, `${data.description?.length || 0} characters`, null, '')}
                ${createTagCard('Meta Keywords', data.keywords || 'Missing', !!data.keywords, '', null, '')}
                ${createTagCard('Canonical URL', data.canonical || 'Missing', !!data.canonical, '', null, '')}
                ${createTagCard('Robots Tag', data.robots || 'Missing', !!data.robots, '', null, '')}
                
                ${(() => {
                    const faviconUrl = data.favicon;
                    const hasFavicon = faviconUrl && !faviconUrl.endsWith('favicon.ico');
                    const faviconHtml = hasFavicon ? `<img src="${faviconUrl}" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 8px;"> ${faviconUrl}` : 'Missing';
                    return createTagCard('Favicon', hasFavicon ? faviconUrl : 'Missing', hasFavicon, '', hasFavicon ? faviconHtml : null, '');
                })()}
            </div>
        </div>
    `;

    // --- 3. Open Graph (Facebook) ---
    const og = data.og || {};
    html += `
        <div class="meta-group-section">
            <div class="meta-group-header">
                <i class="fab fa-facebook"></i>
                <h3>Open Graph (Facebook)</h3>
            </div>
            ${getOgPreviewHtml(og)}
            
            <div class="meta-tags-list">
    `;
    
    const ogFields = ['title', 'description', 'image', 'url', 'type', 'site_name'];
    ogFields.forEach(field => {
        const val = og[field];
        const isDetected = !!val;
        let displayVal = val || 'Missing';
        if (field === 'image' && isDetected) {
            displayVal = `<a href="${val}" target="_blank" style="color: var(--md-sys-color-primary); text-decoration: none;">${val}</a>`;
        }
        html += createTagCard(`og:${field}`, val || 'Missing', isDetected, '', field === 'image' && isDetected ? displayVal : null, '');
    });
    
    html += `
            </div>
        </div>
    `;

    // --- 4. X (Twitter) Card ---
    const twitter = data.twitter || {};
    html += `
        <div class="meta-group-section">
            <div class="meta-group-header">
                <i class="fab fa-x-twitter"></i>
                <h3>X (Twitter) Card</h3>
            </div>
            ${getXPreviewHtml(twitter, og)}
            
            <div class="meta-tags-list">
    `;
    
    const twitterFields = ['card', 'site', 'creator', 'title', 'description', 'image'];
    twitterFields.forEach(field => {
        const val = twitter[field];
        const isDetected = !!val;
        let displayVal = val || 'Missing';
        if (field === 'image' && isDetected) {
            displayVal = `<a href="${val}" target="_blank" style="color: var(--md-sys-color-primary); text-decoration: none;">${val}</a>`;
        }
        html += createTagCard(`twitter:${field}`, val || 'Missing', isDetected, '', field === 'image' && isDetected ? displayVal : null, '');
    });

    html += `
            </div>
        </div>
    `;

    // --- 5. Additional Technical Meta ---
    html += `
        <div class="meta-group-section">
            <div class="meta-group-header">
                <i class="fas fa-cog"></i>
                <h3>Technical Meta Tags</h3>
            </div>
            <div class="meta-tags-list">
                ${createTagCard('Charset', data.charset || 'Missing', !!data.charset, '', null, '')}
                ${createTagCard('Language', data.lang || 'Missing', !!data.lang, '', null, '')}
                ${createTagCard('Author', data.author || 'Missing', !!data.author, '', null, '')}
                ${createTagCard('Viewport', data.viewport || 'Missing', !!data.viewport, '', null, '')}
            </div>
        </div>
    `;

    // Inject HTML
    container.innerHTML = html;

    // Attach Listeners
    attachListeners(container);
}

function renderMetaStats(data) {
    const titleLen = data.title?.length || 0;
    const descLen = data.description?.length || 0;
    
    // Title Score Logic
    let titleClass = 'fill-success';
    if (titleLen === 0) { titleClass = 'fill-error'; }
    else if (titleLen < 30 || titleLen > 60) { titleClass = 'fill-warning'; }

    // Desc Score Logic
    let descClass = 'fill-success';
    if (descLen === 0) { descClass = 'fill-error'; }
    else if (descLen < 70 || descLen > 160) { descClass = 'fill-warning'; }

    return `
        <div class="meta-stats-grid">
            <div class="meta-stat-card">
                <div class="meta-stat-value">${titleLen}</div>
                <div class="meta-stat-label">Title Chars</div>
                <div class="meta-stat-indicator">
                    <div class="indicator-fill ${titleClass}" style="width: ${Math.min((titleLen/60)*100, 100)}%"></div>
                </div>
            </div>
            <div class="meta-stat-card">
                <div class="meta-stat-value">${descLen}</div>
                <div class="meta-stat-label">Desc Chars</div>
                <div class="meta-stat-indicator">
                    <div class="indicator-fill ${descClass}" style="width: ${Math.min((descLen/160)*100, 100)}%"></div>
                </div>
            </div>
        </div>
    `;
}

function getSerpPreviewHtml(data) {
    const title = data.title || 'Missing Title';
    const desc = data.description || 'Missing Meta Description. Google will try to generate a snippet from the page content.';
    const url = data.canonical || data.url || 'https://example.com';
    let hostname = 'example.com';
    let displayUrl = url;
    try {
        const u = new URL(url);
        hostname = u.hostname;
        displayUrl = `${u.hostname} › ${u.pathname.substring(1).replace(/\//g, ' › ')}`;
    } catch (e) { }

    return `
        <div class="preview-card serp-card">
            <div class="serp-header">
                <div class="serp-favicon">
                    <img src="${data.favicon || 'https://www.google.com/s2/favicons?domain=' + hostname}" alt="favicon">
                </div>
                <div class="serp-site-info">
                    <div class="serp-site-name">${hostname}</div>
                    <div class="serp-url">${displayUrl}</div>
                </div>
            </div>
            <div class="serp-title">${title}</div>
            <div class="serp-desc">${desc}</div>
        </div>
    `;
}

function getOgPreviewHtml(og) {
    if (!og || Object.keys(og).length === 0) {
        return '<div style="padding: 12px; background: var(--md-sys-color-surface-container); border-radius: 8px; font-style: italic; color: var(--md-sys-color-on-surface-variant);">No Open Graph data found</div>';
    }

    const image = og.image;
    const title = og.title || 'Missing Title';
    const desc = og.description || '';
    const site = og.site_name || new URL(og.url || 'https://example.com').hostname.toUpperCase();

    const placeholderHtml = `<div class="og-image-placeholder"><i class="fas fa-image" style="font-size: 32px; opacity: 0.3;"></i></div>`;
    const imageHtml = `<div class="og-image" style="background-image: url('${image}')"></div>`;

    return `
        <div class="preview-card og-card">
            ${image ? imageHtml : placeholderHtml}
            <div class="og-content">
                <div class="og-site">${site}</div>
                <div class="og-title">${title}</div>
                ${desc ? `<div class="og-desc">${desc}</div>` : ''}
            </div>
        </div>
    `;
}

function getXPreviewHtml(twitter, og) {
    const data = { ...og, ...twitter };
    if (!data || Object.keys(data).length === 0) {
        return '<div style="padding: 12px; background: var(--md-sys-color-surface-container); border-radius: 8px; font-style: italic; color: var(--md-sys-color-on-surface-variant);">No X/Twitter data found</div>';
    }

    const cardType = data.card || 'summary_large_image';
    const image = data.image;
    const title = data.title || 'Missing Title';
    const desc = data.description || '';
    const site = twitter.site || data.site || new URL(data.url || 'https://example.com').hostname;
    const isLarge = cardType === 'summary_large_image';

    const fontSize = isLarge ? '32px' : '20px';
    const placeholderHtml = `<div class="x-image-placeholder"><i class="fas fa-image" style="font-size: ${fontSize}; opacity: 0.3;"></i></div>`;
    const imageHtml = `<div class="x-image" style="background-image: url('${image}')"></div>`;

    return `
        <div class="preview-card x-card ${isLarge ? 'large' : 'summary'}">
            ${image ? imageHtml : placeholderHtml}
            <div class="x-content">
                <div class="x-site">${site}</div>
                <div class="x-title">${title}</div>
                ${desc ? `<div class="x-desc">${desc}</div>` : ''}
            </div>
        </div>
    `;
}

function attachListeners(container) {
    container.querySelectorAll('.tag-copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = btn.getAttribute('data-copy-text');
            copyToClipboard(text, btn);
        });
    });
}
