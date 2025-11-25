/**
 * Data renderer module
 * Main rendering logic for populating UI with SEO data
 */

import { setText } from '../utils/dom.js';
import { renderCWVChart, renderLinksChart, renderHeadingsChart } from '../ui/charts.js';
import { renderAccessibilityTab } from './renderers/accessibility.js';
import { renderCWVSection } from '../ui/cwv-display.js';
import { calculateSEOScore } from './calculators.js';
import { copyToClipboard } from '../utils/clipboard.js';

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

    // --- Schema Tab ---
    renderSchemaTab(data);
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

    // Tech Stack (optional element)
    const techStackEl = document.getElementById('tech-stack');
    if (techStackEl && data.plugins) {
        techStackEl.textContent = data.plugins.length ? data.plugins.join(', ') : 'None detected';
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
        setText('readability-score', `${data.readability.score} (${data.readability.level})`);
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
 * Render Meta Tab
 */
function renderMetaTab(data) {
    setText('meta-title', data.title || 'Missing');
    setText('meta-desc', data.description || 'Missing');
    setText('meta-keywords', data.keywords || 'Missing');
    setText('meta-canonical', data.canonical || 'Missing');
    setText('meta-robots', data.robots || 'Missing');

    renderKeyValueList('og-data', data.og, 'Open Graph');
    renderKeyValueList('twitter-data', data.twitter, 'Twitter Card');
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
