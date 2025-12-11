/**
 * Data renderer module
 * Main rendering logic for populating UI with SEO data
 */

import { setText } from '../utils/dom.js';
import { renderCWVChart, renderLinksChart, renderHeadingsChart } from '../ui/charts.js';
import { renderAccessibilityTab } from './renderers/accessibility.js';
import { renderMetaTab } from './renderers/meta.js';
import { renderTagsTab } from './renderers/tags.js';
import { renderTrackingBuilder } from './renderers/tracking-builder.js';
import { renderImagesTab as renderImagesTabNew } from './renderers/images.js';
import { renderContentQualityTab } from './renderers/content-quality.js';
import { renderCWVSection } from '../ui/cwv-display.js';
import { calculateSEOScore } from './calculators.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { renderKeywordsTab } from './renderers/keywords.js';

/**
 * Main function to render all SEO data
 */
export function renderData(data) {
    if (!data) return;

    // Calculate score
    const { score, suggestions } = calculateSEOScore(data);

    // Store for exports
    data.score = score;
    data.suggestions = suggestions;

    // --- Overview Tab ---
    renderOverviewTab(data, score, suggestions);

    // --- Meta Tab ---
    renderMetaTab(data);

    // --- Headings Tab ---
    renderHeadingsTab(data);

    // --- Images Tab ---
    renderImagesTab(data);

    // --- Links Tab ---
    renderLinksTab(data);

    // --- Accessibility Tab ---
    if (data.accessibility) {
        renderAccessibilityTab(data.accessibility);
    }

    // --- Content Quality Tab ---
    renderContentQualityTab(data);

    // --- Schema Tab ---
    renderSchemaTab(data);

    // --- Tag Detector Tab ---
    if (data.tags) {
        renderTagsTab(data.tags);
    }

    // --- Tracking Builder Tab ---
    renderTrackingBuilder(data);

    // --- Keywords Tab ---
    renderKeywordsTab(data);

    // --- AI Analysis Tab ---
    // Note: AI Analysis tab is initialized separately and checks for API key
}

/**
 * Render Overview Tab
 */
function renderOverviewTab(data, score, suggestions) {
    // Title & Description lengths
    const titleLen = data.title ? data.title.length : 0;
    const descLen = data.description ? data.description.length : 0;
    setText('title-length', `${titleLen} chars`);
    setText('desc-length', `${descLen} chars`);

    // Tech Stack - comprehensive categorized display
    const techStackEl = document.getElementById('tech-stack');
    if (techStackEl) {
        // Clear previous data to prevent stale results
        techStackEl.innerHTML = '';

        if (data.techStack && Object.keys(data.techStack).length > 0) {
            renderTechStack(data.techStack, techStackEl);
        } else {
            techStackEl.innerHTML = '<div class="data-value" style="color: var(--md-sys-color-on-surface-variant);">None detected</div>';
        }
    }

    // SEO Score
    const scoreEl = document.getElementById('seo-score');
    if (scoreEl) {
        scoreEl.textContent = score;
        scoreEl.style.color = score >= 90 ? 'var(--success-color)' : (score >= 70 ? 'var(--warning-color)' : 'var(--error-color)');
    }

    // Suggestions - try both possible IDs
    const suggContainer = document.getElementById('suggestions-list') || document.getElementById('suggestions-container');
    if (suggContainer) {
        suggContainer.innerHTML = '';
        suggestions.forEach(s => {
            suggContainer.innerHTML += `<div class="suggestion-item ${s.type}">${s.msg}</div>`;
        });
    }

    // CWV
    if (data.cwv) {
        renderCWVSection(data.cwv, renderCWVChart);

        // Populate Detailed Cards
        updateCWVCard('lcp', data.cwv.lcp, data.cwv.lcpElement, 2500, 4000);
        updateCWVCard('cls', data.cwv.cls, data.cwv.clsElement, 0.1, 0.25);
        updateCWVCard('inp', data.cwv.inp, null, 200, 500);
        updateCWVCard('fcp', data.cwv.fcp, null, 1800, 3000);
        updateCWVCard('ttfb', data.cwv.ttfb, null, 800, 1800);
    }

    // Readability
    if (data.readability) {
        renderReadabilitySection(data.readability);
    }
}

/**
 * Helper to update a CWV card
 */
function updateCWVCard(metric, value, element, goodThreshold, poorThreshold) {
    const valueEl = document.getElementById(`${metric}-value`);
    const ratingEl = document.getElementById(`${metric}-rating`);
    const elementEl = document.getElementById(`${metric}-element`);
    const dotEl = document.getElementById(`${metric}-dot`);

    if (!valueEl || !ratingEl) return;

    // Format value
    let displayValue = value;
    if (metric === 'cls') displayValue = value ? value.toFixed(3) : '0';
    else displayValue = value ? Math.round(value) + ' ms' : '--';

    valueEl.textContent = displayValue;

    // Determine rating
    let rating = 'Good';
    let colorClass = 'good';
    let color = 'var(--success-color)';

    if (value > poorThreshold) {
        rating = 'Poor';
        colorClass = 'poor';
        color = 'var(--error-color)';
    } else if (value > goodThreshold) {
        rating = 'Needs Improvement';
        colorClass = 'needs-improvement';
        color = 'var(--warning-color)';
    }

    ratingEl.textContent = rating;
    ratingEl.style.color = color;

    // Update dot
    if (dotEl) {
        dotEl.className = `metric-dot ${colorClass}`;
    }

    // Element selector
    if (elementEl) {
        elementEl.textContent = element || 'N/A';
        elementEl.title = element || ''; // Tooltip for long selectors
    }
}

/**
 * Render Headings Tab
 */
function renderHeadingsTab(data) {
    const headingsContainer = document.getElementById('headings-list');
    if (!headingsContainer) return;

    if (!data.headings.length) {
        headingsContainer.innerHTML = '<div class="data-value">No headings found.</div>';
        return;
    }

    headingsContainer.innerHTML = '';
    data.headings.forEach(h => {
        const level = parseInt(h.tag.replace('h', '')) || 1;
        const indent = (level - 1) * 20; // 20px per level

        const div = document.createElement('div');
        div.className = 'heading-item';
        div.style.marginLeft = `${indent}px`;
        div.style.borderLeft = `3px solid var(--primary-color)`;
        if (level > 1) div.style.borderLeft = `3px solid var(--border-color)`;

        div.innerHTML = `
            <span class="${h.tag}" style="font-weight: ${level === 1 ? '700' : '500'}">${h.tag.toUpperCase()}: ${h.text}</span>
            <button class="copy-icon-btn" title="Copy">
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
        `;
        div.querySelector('button').addEventListener('click', (e) => copyToClipboard(h.text, e.currentTarget));
        headingsContainer.appendChild(div);
    });

    renderHeadingsChart(data.headings);
}

/**
 * Render Images Tab
 */
function renderImagesTab(data) {
    // Try new renderer first
    const groupedContainer = document.getElementById('images-grouped-content');
    if (groupedContainer) {
        renderImagesTabNew(data);
        return;
    }

    // Fallback to legacy
    const missingAlt = data.images.filter(i => !i.alt).length;
    setText('img-total', data.images.length);
    setText('img-missing-alt', missingAlt);
    if (missingAlt > 0) {
        const el = document.getElementById('img-missing-alt');
        if (el) el.classList.add('warning-text');
    }

    const imgGrid = document.getElementById('images-list');
    if (!imgGrid) return;

    imgGrid.innerHTML = '';
    data.images.forEach(img => {
        const div = document.createElement('div');
        div.className = `img-card ${!img.alt ? 'missing-alt' : ''}`;
        div.innerHTML = `
            <img src="${img.src}" class="img-preview" loading="lazy">
            <div class="img-info">${img.alt || '<span class="warning-text">No Alt</span>'}</div>
        `;
        imgGrid.appendChild(div);
    });
}

/**
 * Render Links Tab
 */
function renderLinksTab(data) {
    if (!data.links) return;

    setText('link-internal-count', data.links.internal.length);
    setText('link-external-count', data.links.external.length);

    renderLinkList('external-links-list', data.links.external);
    renderLinkList('internal-links-list', data.links.internal);
    renderLinksChart(data.links);
}

/**
 * Render Schema Tab
 */
function renderSchemaTab(data) {
    const schemaList = document.getElementById('schema-list');
    if (!schemaList) return;

    if (data.schema && data.schema.length) {
        schemaList.innerHTML = '';
        data.schema.forEach(s => {
            const div = document.createElement('div');
            div.className = 'data-group';
            div.style.borderLeftColor = s.valid ? 'var(--success-color)' : 'var(--error-color)';

            const label = document.createElement('label');
            label.textContent = s.type;

            const valueDiv = document.createElement('div');
            valueDiv.className = 'data-value';
            valueDiv.textContent = s.details;

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-icon-btn';
            copyBtn.title = 'Copy';
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
            copyBtn.onclick = () => copyToClipboard(JSON.stringify(s.data, null, 2), copyBtn);

            const row = document.createElement('div');
            row.className = 'label-row';
            row.appendChild(valueDiv);
            row.appendChild(copyBtn);
            div.appendChild(label);
            div.appendChild(row);
            schemaList.appendChild(div);
        });
    } else {
        schemaList.innerHTML = '<div class="data-value">No Schema found.</div>';
    }

    // Hreflang
    const hreflangList = document.getElementById('hreflang-list');
    if (hreflangList) {
        if (data.hreflang && data.hreflang.length) {
            hreflangList.innerHTML = '';
            data.hreflang.forEach(h => {
                hreflangList.innerHTML += `<div class="data-value"><b>${h.lang}</b>: ${h.href}</div>`;
            });
        } else {
            hreflangList.innerHTML = '<div class="data-value">No hreflang tags.</div>';
        }
    }

    // PAA
    const paaList = document.getElementById('paa-list');
    if (paaList) {
        if (data.paa && data.paa.length) {
            paaList.innerHTML = '';
            data.paa.forEach(q => {
                paaList.innerHTML += `<div class="suggestion-item">${q}</div>`;
            });
        } else {
            paaList.innerHTML = '<div class="data-value">No PAA found.</div>';
        }
    }

    // Emails & Phones
    renderSimpleList('emails-list', data.emails, 'mailto:');
    renderSimpleList('phones-list', data.phones.map(p => p.number), 'tel:');
}

// Helper functions
function renderKeyValueList(containerId, obj, title) {
    const container = document.getElementById(containerId);
    if (!container || !obj || Object.keys(obj).length === 0) {
        if (container) container.innerHTML = '';
        return;
    }

    const groupDiv = document.createElement('div');
    groupDiv.className = 'data-group';
    groupDiv.style.marginTop = '16px';

    const titleLabel = document.createElement('label');
    titleLabel.textContent = title;
    groupDiv.appendChild(titleLabel);

    for (const [key, val] of Object.entries(obj)) {
        const row = document.createElement('div');
        row.className = 'label-row';
        row.style.marginBottom = '8px';
        row.style.borderBottom = '1px solid var(--surface-color)';
        row.style.paddingBottom = '8px';

        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';
        contentDiv.style.wordBreak = 'break-word';
        contentDiv.innerHTML = `
            <div style="color:var(--text-secondary); font-size: 11px; font-weight: 700; margin-bottom: 2px; text-transform: uppercase;">${key}</div>
            <div class="data-value">${val}</div>
        `;

        const btn = document.createElement('button');
        btn.className = 'copy-icon-btn';
        btn.title = 'Copy';
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
        btn.onclick = () => copyToClipboard(val, btn);

        row.appendChild(contentDiv);
        row.appendChild(btn);
        groupDiv.appendChild(row);
    }

    container.innerHTML = '';
    container.appendChild(groupDiv);
}

function renderLinkList(containerId, links) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    links.slice(0, 100).forEach(l => {
        container.innerHTML += `<div class="link-item"><a href="${l.href}" target="_blank">${l.text || l.href}</a></div>`;
    });
}

function renderSimpleList(containerId, items, prefix = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="data-value" style="padding: 8px;">None found.</div>';
        return;
    }

    container.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'data-group';
        div.innerHTML = `
            <div class="label-row">
                <div class="data-value" style="word-break: break-all;">${item}</div>
                <button class="copy-icon-btn" title="Copy">
                    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
            </div>
        `;
        div.querySelector('button').addEventListener('click', (e) => copyToClipboard(`${prefix}${item}`, e.currentTarget));
        container.appendChild(div);
    });
}

/**
 * Render comprehensive readability section
 */
function renderReadabilitySection(readability) {
    const scoreEl = document.getElementById('readability-score');
    const detailsEl = document.getElementById('readability-details');

    if (!scoreEl) return;

    // Display main score
    const score = readability.score || readability.fleschScore || 0;
    const level = readability.level || 'N/A';
    scoreEl.textContent = `${score} (${level})`;
    scoreEl.style.color = score >= 70 ? 'var(--success-color)' : (score >= 50 ? 'var(--warning-color)' : 'var(--error-color)');

    // Show detailed analysis
    if (detailsEl && readability.wordCount) {
        const statusColor = (status) => {
            if (status === 'good') return 'var(--success-color)';
            if (status === 'warning') return 'var(--warning-color)';
            return 'var(--error-color)';
        };

        const statusIcon = (status) => {
            if (status === 'good') return '✓';
            if (status === 'warning') return '⚠';
            return '✗';
        };

        let html = `
            <div class="card" style="margin-top: 12px; padding: 16px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Content Analysis</h4>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Word Count</div>
                        <div style="font-size: 18px; font-weight: 700;">${readability.wordCount.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Sentences</div>
                        <div style="font-size: 18px; font-weight: 700;">${readability.sentenceCount}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Paragraphs</div>
                        <div style="font-size: 18px; font-weight: 700;">${readability.paragraphCount}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Avg Words/Sentence</div>
                        <div style="font-size: 18px; font-weight: 700;">${readability.averageWordsPerSentence}</div>
                    </div>
                </div>
        `;

        // Voice Analysis
        if (readability.passiveVoice) {
            const pv = readability.passiveVoice;
            html += `
                <div style="margin-bottom: 12px; padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid ${statusColor(pv.status)};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <strong style="font-size: 13px;">Passive Voice</strong>
                        <span style="color: ${statusColor(pv.status)}; font-weight: 700;">${statusIcon(pv.status)} ${pv.percentage}%</span>
                    </div>
                    <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                        ${pv.count} of ${readability.sentenceCount} sentences use passive voice
                    </div>
                </div>
            `;
        }

        // Transitional Words
        if (readability.transitionalWords) {
            const tw = readability.transitionalWords;
            html += `
                <div style="margin-bottom: 12px; padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid ${statusColor(tw.status)};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <strong style="font-size: 13px;">Transitional Words</strong>
                        <span style="color: ${statusColor(tw.status)}; font-weight: 700;">${statusIcon(tw.status)} ${tw.percentage}%</span>
                    </div>
                    <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                        ${tw.count} transitional words found
                        ${tw.found.length > 0 ? `(${tw.found.slice(0, 5).join(', ')})` : ''}
                    </div>
                </div>
            `;
        }

        // Sentence Analysis
        if (readability.sentences) {
            const s = readability.sentences;
            html += `
                <div style="margin-bottom: 12px; padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid ${statusColor(s.status)};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <strong style="font-size: 13px;">Sentence Length</strong>
                        <span style="color: ${statusColor(s.status)}; font-weight: 700;">${statusIcon(s.status)} Avg: ${s.averageLength} words</span>
                    </div>
                    <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                        ${s.longSentences} long (>20), ${s.veryLongSentences} very long (>25), ${s.shortSentences} short (<10)
                        ${s.consecutiveSameStart > 0 ? ` • ${s.consecutiveSameStart} consecutive same starts` : ''}
                    </div>
                </div>
            `;
        }

        // Paragraph Analysis
        if (readability.paragraphs) {
            const p = readability.paragraphs;
            html += `
                <div style="margin-bottom: 12px; padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid ${statusColor(p.status)};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <strong style="font-size: 13px;">Paragraph Length</strong>
                        <span style="color: ${statusColor(p.status)}; font-weight: 700;">${statusIcon(p.status)} Avg: ${p.averageLength} words</span>
                    </div>
                    <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                        ${p.longParagraphs} long (>150), ${p.shortParagraphs} short (<50)
                    </div>
                </div>
            `;
        }

        // Recommendations
        if (readability.recommendations && readability.recommendations.length > 0) {
            html += `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <strong style="font-size: 13px; display: block; margin-bottom: 8px;">Recommendations</strong>
            `;

            readability.recommendations.forEach(rec => {
                const recColor = rec.type === 'error' ? 'var(--error-color)' : 'var(--warning-color)';
                html += `
                    <div style="padding: 8px; margin-bottom: 6px; background: var(--md-sys-color-surface-variant); border-radius: 4px; border-left: 3px solid ${recColor}; font-size: 12px;">
                        ${rec.message}
                    </div>
                `;
            });

            html += `</div>`;
        }

        html += `</div>`;

        detailsEl.innerHTML = html;
        detailsEl.style.display = 'block';
    }
}

/**
 * Render comprehensive tech stack display
 */
function renderTechStack(techStack, container) {
    if (!techStack || Object.keys(techStack).length === 0) {
        container.innerHTML = '<div class="data-value" style="color: var(--md-sys-color-on-surface-variant);">None detected</div>';
        return;
    }

    // Category display names and colors
    const categoryConfig = {
        cms: { label: 'CMS', color: 'var(--md-sys-color-primary)' },
        frameworks: { label: 'JS Frameworks', color: 'var(--md-sys-color-secondary)' },
        uiFrameworks: { label: 'UI Frameworks', color: 'var(--md-sys-color-tertiary)' },
        libraries: { label: 'Libraries', color: '#00BCD4' },
        analytics: { label: 'Analytics', color: '#4CAF50' },
        ecommerce: { label: 'E-commerce', color: '#FF9800' },
        cdn: { label: 'CDN', color: '#9C27B0' },
        fonts: { label: 'Fonts', color: '#795548' },
        advertising: { label: 'Advertising', color: '#F44336' },
        seo: { label: 'SEO Tools', color: '#2196F3' },
        server: { label: 'Server', color: '#607D8B' },
        security: { label: 'Security', color: '#4CAF50' },
        language: { label: 'Backend', color: '#FF5722' },
        payment: { label: 'Payment', color: '#009688' },
        communication: { label: 'Communication', color: '#E91E63' },
        media: { label: 'Media', color: '#673AB7' },
        buildTools: { label: 'Build Tools', color: '#3F51B5' },
        hosting: { label: 'Hosting', color: '#00BCD4' },
        social: { label: 'Social', color: '#FF9800' }
    };

    let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

    for (const [category, technologies] of Object.entries(techStack)) {
        if (!technologies || technologies.length === 0) continue;

        const config = categoryConfig[category] || { label: category, color: 'var(--md-sys-color-on-surface)' };

        html += `
            <div style="padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid ${config.color};">
                <div style="font-size: 11px; font-weight: 700; color: ${config.color}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                    ${config.label}
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        `;

        technologies.forEach(tech => {
            const displayName = tech.version ? `${tech.name} ${tech.version}` : tech.name;
            html += `
                <span style="
                    display: inline-block;
                    padding: 4px 10px;
                    background: var(--md-sys-color-surface);
                    border: 1px solid ${config.color}20;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--md-sys-color-on-surface);
                ">
                    ${displayName}
                </span>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}
