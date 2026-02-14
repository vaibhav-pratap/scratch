import { copyToClipboard } from '../../utils/clipboard.js';

/**
 * Images Tab Renderer
 * Renders all images with copy and download functionality
 */

// Helper to send messages to content script
function sendTabMessage(action, data = {}) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action, ...data });
        }
    });
}

/**
 * Check if image is decorative or an icon
 */
function isDecorative(img) {
    // 1. Explicit decorative attributes
    if (img.role === 'presentation' || img.role === 'none') return true;
    if (img.ariaHidden === 'true') return true;

    // 2. Inline SVGs or SVG files are often icons
    const isSvg = img.type.includes('svg') || img.src.includes('.svg') || img.src.startsWith('data:image/svg');
    
    // 3. Small dimensions (likely icons/bullets)
    // Relaxed check: < 50x50 is almost certainly an icon
    const isSmall = (img.width > 0 && img.width <= 50) && (img.height > 0 && img.height <= 50);

    // If it's an SVG or Small, treat as decorative/icon UNLESS it has a title or meaningful alt
    // But for the purpose of "Missing Alt Error", we want to exclude these if they lack alt.
    if (isSvg || isSmall) return true;

    // 4. Class checks (common icon classes)
    if (img.classes && (img.classes.includes('icon') || img.classes.includes('logo'))) return true;

    return false;
}

export function renderImagesTab(data) {
    const container = document.getElementById('images-grouped-content');
    if (!container) {
        return renderImagesTabLegacy(data);
    }

    const images = data.images || [];
    
    // --- Advanced Analysis ---
    let total = images.length;
    let missingAltCritical = 0;
    let decorativeCount = 0;
    let lazyLoadedCount = 0;
    const formats = { webp: 0, jpg: 0, png: 0, svg: 0, gif: 0, other: 0 };
    const sizes = { small: 0, medium: 0, large: 0 }; // Small < 100px, Medium < 800px, Large > 800px

    images.forEach(img => {
        // 1. Decorative Check
        const decorative = isDecorative(img);
        if (decorative) {
            decorativeCount++;
        } else if (!img.alt || img.alt.trim() === '') {
            missingAltCritical++;
        }

        // 2. Lazy Loading
        if (img.loading === 'lazy' || img.type.includes('lazy')) lazyLoadedCount++;

        // 3. Format Detection
        const lowerSrc = img.src.toLowerCase();
        if (lowerSrc.includes('.webp') || img.src.startsWith('data:image/webp')) formats.webp++;
        else if (lowerSrc.includes('.jpg') || lowerSrc.includes('.jpeg')) formats.jpg++;
        else if (lowerSrc.includes('.png')) formats.png++;
        else if (lowerSrc.includes('.svg') || img.type.includes('svg')) formats.svg++;
        else if (lowerSrc.includes('.gif')) formats.gif++;
        else formats.other++;

        // 4. Size Categorization
        const maxDim = Math.max(img.width || 0, img.height || 0);
        if (maxDim > 0) {
            if (maxDim < 100) sizes.small++;
            else if (maxDim < 800) sizes.medium++;
            else sizes.large++;
        }
    });

    let html = '';

    // --- Stats Dashboard ---
    html += `
        <div class="stats-dashboard" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px;">
            <!-- Total -->
            <div style="background: var(--md-sys-color-surface-variant); padding: 16px; border-radius: 12px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 4px;">Total Images</div>
                <div style="font-size: 24px; font-weight: 700;">${total}</div>
            </div>
            
            <!-- Issues (Critical) -->
            <div style="background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); padding: 16px; border-radius: 12px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 4px;">Missing Alt</div>
                <div style="font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    ${missingAltCritical}
                    ${missingAltCritical > 0 ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>' : ''}
                </div>
                <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">Excludes decorative icons</div>
            </div>

            <!-- Decorative/Icons -->
            <div style="background: var(--md-sys-color-surface-variant); padding: 16px; border-radius: 12px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 4px;">Icons / SVG</div>
                <div style="font-size: 24px; font-weight: 700;">${decorativeCount}</div>
            </div>

            <!-- Lazy Loaded -->
            <div style="background: var(--md-sys-color-surface-variant); padding: 16px; border-radius: 12px; border: 1px solid var(--md-sys-color-outline-variant);">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 4px;">Lazy Loaded</div>
                <div style="font-size: 24px; font-weight: 700;">${lazyLoadedCount}</div>
            </div>
        </div>

        <!-- Detailed Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px;">
            <!-- Format Distribution -->
            <div style="background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline-variant); padding: 16px; border-radius: 12px;">
                <h4 style="margin: 0 0 12px 0; font-size: 13px;">Format Distribution</h4>
                <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                    ${Object.entries(formats).map(([fmt, count]) => {
                        if (count === 0) return '';
                        const colors = { webp: '#4CAF50', jpg: '#2196F3', png: '#FF9800', svg: '#9C27B0', gif: '#E91E63', other: '#9E9E9E' };
                        const width = (count / total) * 100;
                        return `<div style="width: ${width}%; background: ${colors[fmt]};" title="${fmt.toUpperCase()}: ${count}"></div>`;
                    }).join('')}
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                    ${Object.entries(formats).map(([fmt, count]) => {
                        if (count === 0) return '';
                        const colors = { webp: '#4CAF50', jpg: '#2196F3', png: '#FF9800', svg: '#9C27B0', gif: '#E91E63', other: '#9E9E9E' };
                        return `
                            <div style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${colors[fmt]};"></div>
                                <span style="text-transform: uppercase;">${fmt}</span>
                                <span style="font-weight: 600;">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Size Breakdown -->
            <div style="background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline-variant); padding: 16px; border-radius: 12px;">
                <h4 style="margin: 0 0 12px 0; font-size: 13px;">Size Breakdown</h4>
                <div style="display: flex; gap: 8px; align-items: flex-end; height: 40px; margin-bottom: 8px;">
                    <div style="flex: 1; background: var(--md-sys-color-primary-container); height: ${(sizes.small / total) * 100}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
                    <div style="flex: 1; background: var(--md-sys-color-primary); height: ${(sizes.medium / total) * 100}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
                    <div style="flex: 1; background: var(--md-sys-color-inverse-primary); height: ${(sizes.large / total) * 100}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                    <span>Small (<100px)</span>
                    <span>Medium</span>
                    <span>Large (>800px)</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-top: 4px;">
                    <span>${sizes.small}</span>
                    <span>${sizes.medium}</span>
                    <span>${sizes.large}</span>
                </div>
            </div>
        </div>
    `;

    // Section title
    html += `
        <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            All Images
        </h3>
    `;

    if (images.length === 0) {
        html += `
            <div style="padding: 40px; text-align: center; color: var(--md-sys-color-on-surface-variant); font-style: italic;">
                No images found on this page
            </div>
        `;
    } else {
        // Images grid - 2 columns
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">';

        images.forEach((img, index) => {
            html += createImageCard(img, index);
        });

        html += '</div>';
    }

    container.innerHTML = html;

    // Attach event listeners
    attachImageListeners(container);
}

/**
 * Extract filename from URL
 */
function extractFilename(url) {
    try {
        // Handle data URIs
        if (url.startsWith('data:')) {
            // Check if it's SVG
            if (url.includes('image/svg+xml')) {
                return 'inline-svg.svg';
            }
            // Check for other image types
            const match = url.match(/data:image\/(\w+);/);
            if (match) {
                return `inline-image.${match[1]}`;
            }
            return 'inline-image.png';
        }

        // Extract filename from URL
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

        // If no filename or query params, clean it up
        return filename.split('?')[0] || 'image.jpg';
    } catch (e) {
        return 'image.jpg';
    }
}

/**
 * Create an image card with copy and download functionality
 */
// Helper to handle image load errors
function handleImageError(img) {
    img.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.style.color = 'var(--md-sys-color-error)';
    fallback.style.fontSize = '12px';
    fallback.textContent = 'Failed to load';
    img.parentElement.appendChild(fallback);
}

/**
 * Create an image card with copy and download functionality
 */
function createImageCard(img, index) {
    const hasAlt = !!img.alt && img.alt.trim() !== '';

    const isDeco = isDecorative(img);
    const hasTitle = !!img.title;
    const filename = extractFilename(img.src);
    const truncatedSrc = img.src.length > 50 ? img.src.substring(0, 50) + '...' : img.src;

    // Border Color Logic
    let borderColor = 'var(--md-sys-color-outline-variant)';
    if (!hasAlt && !isDeco) borderColor = 'var(--md-sys-color-error)';

    return `
        <div class="image-card" data-card-index="${index}" style="
            background: var(--md-sys-color-surface);
            border: 1px solid ${borderColor};
            border-radius: var(--radius-sm);
            overflow: hidden;
            transition: all 0.2s;
            ${!hasAlt && !isDeco ? 'border-left: 4px solid var(--md-sys-color-error);' : ''}
        ">
            <!-- Image Preview -->
            <div style="
                width: 100%;
                height: 200px;
                background: var(--md-sys-color-surface-variant);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            ">
                <img 
                    src="${escapeHtml(img.src)}" 
                    alt="${escapeHtml(img.alt || 'No alt text')}"
                    loading="lazy"
                    class="seo-image-preview"
                    style="max-width: 100%; max-height: 100%; object-fit: contain;"
                >
                ${!hasAlt && !isDeco ? `
                    <div style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: var(--md-sys-color-error);
                        color: var(--md-sys-color-on-error);
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
                    ">NO ALT</div>
                ` : ''}
                ${isDeco ? `
                    <div style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: var(--md-sys-color-secondary-container);
                        color: var(--md-sys-color-on-secondary-container);
                        padding: 6px 10px;
                        border-radius: 6px;
                        font-size: 10px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    ">DECORATIVE</div>
                ` : ''}
            </div>

            <!-- Image Info -->
            <div style="padding: 12px;">
                <!-- Filename -->
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); font-weight: 500; text-transform: uppercase;">Filename</span>
                        <button class="img-copy-btn action-icon-btn" data-copy-text="${escapeHtml(filename)}" title="Copy Filename" style="
                            background: none;
                            border: none;
                            cursor: pointer;
                            padding: 4px;
                            color: var(--md-sys-color-primary);
                            display: flex;
                            align-items: center;
                            border-radius: 4px;
                        ">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                    </div>
                    <div style="
                        font-size: 13px;
                        color: var(--md-sys-color-on-surface);
                        padding: 8px 12px;
                        background: var(--md-sys-color-surface-variant);
                        border-radius: 6px;
                        font-weight: 500;
                        font-family: monospace;
                        word-break: break-word;
                    ">
                        ${escapeHtml(filename)}
                    </div>
                </div>

                <!-- Alt Text -->
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); font-weight: 500; text-transform: uppercase;">Alt Text</span>
                        ${hasAlt ? `
                            <button class="img-copy-btn action-icon-btn" data-copy-text="${escapeHtml(img.alt)}" title="Copy Alt Text" style="
                                background: none;
                                border: none;
                                cursor: pointer;
                                padding: 4px;
                                color: var(--md-sys-color-primary);
                                display: flex;
                                align-items: center;
                                border-radius: 4px;
                            ">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                    <div style="
                        font-size: 13px;
                        color: ${hasAlt ? 'var(--md-sys-color-on-surface)' : (isDeco ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-error)')};
                        padding: 6px 10px;
                        background: var(--md-sys-color-surface-variant);
                        border-radius: 4px;
                        word-break: break-word;
                        min-height: 32px;
                        display: flex;
                        align-items: center;
                        ${!hasAlt ? 'font-style: italic;' : ''}
                    ">
                        ${hasAlt ? escapeHtml(img.alt) : (isDeco ? 'Decorative (No Alt needed)' : 'Missing alt text')}
                    </div>
                </div>

                <!-- Title (if exists) -->
                ${hasTitle ? `
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); font-weight: 500; text-transform: uppercase;">Title Attribute</span>
                            <button class="img-copy-btn action-icon-btn" data-copy-text="${escapeHtml(img.title)}" title="Copy Title" style="
                                background: none;
                                border: none;
                                cursor: pointer;
                                padding: 4px;
                                color: var(--md-sys-color-primary);
                                display: flex;
                                align-items: center;
                                border-radius: 4px;
                            ">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                            </button>
                        </div>
                        <div style="
                            font-size: 13px;
                            color: var(--md-sys-color-on-surface);
                            padding: 6px 10px;
                            background: var(--md-sys-color-surface-variant);
                            border-radius: 4px;
                            word-break: break-word;
                        ">
                            ${escapeHtml(img.title)}
                        </div>
                    </div>
                ` : ''}

                <!-- Image URL -->
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); font-weight: 500; text-transform: uppercase;">Image URL</span>
                        <button class="img-copy-btn action-icon-btn" data-copy-text="${escapeHtml(img.src)}" title="Copy Image URL" style="
                            background: none;
                            border: none;
                            cursor: pointer;
                            padding: 4px;
                            color: var(--md-sys-color-primary);
                            display: flex;
                            align-items: center;
                            border-radius: 4px;
                        ">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                    </div>
                    <div style="
                        font-size: 12px;
                        color: var(--md-sys-color-on-surface-variant);
                        padding: 6px 10px;
                        background: var(--md-sys-color-surface-variant);
                        border-radius: 4px;
                        word-break: break-all;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    " title="${escapeHtml(img.src)}">
                        ${truncatedSrc}
                    </div>
                </div>

                <!-- Image Type & Dimensions -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                        Type: <strong>${escapeHtml(img.type || 'img')}</strong>
                    </span>
                    <span style="font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                        ${img.width && img.height ? `${img.width} × ${img.height}` : 'Size unknown'}
                    </span>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 8px;">
                    <button class="img-download-btn action-text-btn" data-img-src="${escapeHtml(img.src)}" data-img-filename="${escapeHtml(filename)}" style="
                        flex: 1;
                        padding: 8px 12px;
                        background: var(--md-sys-color-primary);
                        color: var(--md-sys-color-on-primary);
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        transition: all 0.2s;
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                        </svg>
                        Download
                    </button>
                    
                    <a href="${escapeHtml(img.src)}" target="_blank" class="action-text-btn" style="
                        padding: 8px 12px;
                        background: var(--md-sys-color-secondary-container);
                        color: var(--md-sys-color-on-secondary-container);
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-decoration: none;
                        transition: all 0.2s;
                    " title="Open in new tab">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                        </svg>
                    </a>
                    
                    <button class="img-highlight-btn action-text-btn" data-img-src="${escapeHtml(img.src)}" title="Highlight on page" style="
                        padding: 8px 12px;
                        background: var(--md-sys-color-tertiary-container);
                        color: var(--md-sys-color-on-tertiary-container);
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-decoration: none;
                        transition: all 0.2s;
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Attach event listeners for buttons and interactions (fixing CSP issues)
 */
function attachImageListeners(container) {
    // 1. Image Load Error Handling
    container.querySelectorAll('img.seo-image-preview').forEach(img => {
        img.addEventListener('error', () => handleImageError(img));
    });

    // 2. Card Hover Effects (Shadow)
    container.querySelectorAll('.image-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '';
        });
    });

    // 3. Button Hover Effects (Opacity/Background)
    // Download Button
    container.querySelectorAll('.img-download-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if (!btn.disabled) btn.style.background = 'var(--md-sys-color-primary-container)';
        });
        btn.addEventListener('mouseleave', () => {
            if (!btn.disabled) btn.style.background = 'var(--md-sys-color-primary)';
        });
    });

    // Other Action Buttons (Open/Highlight)
    container.querySelectorAll('.action-text-btn:not(.img-download-btn)').forEach(btn => {
        btn.addEventListener('mouseenter', () => btn.style.opacity = '0.8');
        btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
    });


    // Copy buttons
    container.querySelectorAll('.img-copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = btn.getAttribute('data-copy-text');
            copyToClipboard(text, btn);
        });
    });

    // Download buttons
    container.querySelectorAll('.img-download-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const imgSrc = btn.getAttribute('data-img-src');
            const imgFilename = btn.getAttribute('data-img-filename');

            try {
                // Show loading state
                const originalText = btn.innerHTML;
                const originalBg = btn.style.background;

                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    </svg>
                    Downloading...
                `;
                btn.disabled = true;

                await downloadImage(imgSrc, imgFilename);

                // Success state
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    Downloaded!
                `;

                // Reset after 2 seconds
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = originalBg;
                    btn.disabled = false;
                }, 2000);

            } catch (error) {
                console.error('Download failed:', error);
                const originalText = btn.innerHTML;
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    Failed
                `;
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        });
    });

    // Highlight buttons
    container.querySelectorAll('.img-highlight-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const imgSrc = btn.getAttribute('data-img-src');

            // Send message to content script to highlight the image
            sendTabMessage('highlightImage', { src: imgSrc });
        });
    });
}

/**
 * Download an image
 */
/**
 * Download an image using chrome.downloads API
 */
async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        try {
            chrome.downloads.download({
                url: url,
                filename: 'seo-images/' + filename, // Organize in a subfolder
                saveAs: false,
                conflictAction: 'uniquify'
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    // Fallback for data URIs if API fails or other errors
                    console.warn('chrome.downloads failed, trying fallback:', chrome.runtime.lastError);
                    fallbackDownload(url, filename).then(resolve).catch(reject);
                } else {
                    resolve(downloadId);
                }
            });
        } catch (e) {
            // permissions might not be active yet or other API issues
            fallbackDownload(url, filename).then(resolve).catch(reject);
        }
    });
}

/**
 * Fallback download method using anchor tag
 */
async function fallbackDownload(url, filename) {
    try {
        // For data URIs, download directly
        if (url.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // For external URLs, fetch and download
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
        throw new Error('Fallback download failed: ' + error.message);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Legacy renderer for backward compatibility
 */
function renderImagesTabLegacy(data) {
    const missingAlt = data.images.filter(i => !i.alt).length;

    const totalEl = document.getElementById('img-total');
    const missingEl = document.getElementById('img-missing-alt');

    if (totalEl) totalEl.textContent = data.images.length;
    if (missingEl) {
        missingEl.textContent = missingAlt;
        if (missingAlt > 0) {
            missingEl.classList.add('warning-text');
        }
    }

    const imgGrid = document.getElementById('images-list');
    if (!imgGrid) return;

    imgGrid.innerHTML = '';
    data.images.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = `img-card ${!img.alt ? 'missing-alt' : ''}`;
        div.innerHTML = `
            <img src="${img.src}" class="img-preview" loading="lazy">
            <div class="img-info">${img.alt || '<span class="warning-text">No Alt</span>'}</div>
        `;
        imgGrid.appendChild(div);
    });
}
