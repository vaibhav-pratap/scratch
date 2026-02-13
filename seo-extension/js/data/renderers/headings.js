/**
 * Headings Tab Renderer
 * Visualizes document structure as a collapsible tree with validation.
 */

import { copyToClipboard } from '../../utils/clipboard.js';
import { renderHeadingsChart } from '../../ui/charts.js';

/**
 * Main render function
 */
export function renderHeadingsTab(data) {
    const container = document.getElementById('headings-list');
    if (!container) return;

    // 1. Stats & Validation
    const stats = calculateStats(data.headings);
    const validation = validateStructure(data.headings);

    // 2. Build HTML
    let html = `
        <div class="headings-stats-card">
            <div class="stat-row">
                ${renderStat('H1', stats.h1)}
                ${renderStat('H2', stats.h2)}
                ${renderStat('H3', stats.h3)}
                ${renderStat('H4', stats.h4)}
                ${renderStat('H5', stats.h5)}
                ${renderStat('H6', stats.h6)}
            </div>
            ${validation.length > 0 ? `<div class="structure-warnings">${validation.map(v => renderWarning(v)).join('')}</div>` : ''}
        </div>
        
        <div class="headings-tree-container">
            ${renderTree(buildTree(data.headings))}
        </div>
    `;

    container.innerHTML = html;

    // 3. Render Chart - REMOVED per user request
    // if (data.headings.length > 0) {
    //     renderHeadingsChart(data.headings);
    // }

    // 4. Attach Event Listeners
    attachEventListeners(container);
}

/**
 * Calculate counts for each heading level
 */
function calculateStats(headings) {
    const stats = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    headings.forEach(h => {
        const tag = h.tag.toLowerCase();
        if (stats[tag] !== undefined) stats[tag]++;
    });
    return stats;
}

/**
 * Validate heading structure
 */
function validateStructure(headings) {
    const warnings = [];
    const h1Count = headings.filter(h => h.tag.toLowerCase() === 'h1').length;

    if (h1Count === 0) warnings.push({ type: 'error', msg: 'Missing H1 tag' });
    if (h1Count > 1) warnings.push({ type: 'error', msg: 'Multiple H1 tags found' });

    // Check for skipped levels (e.g. H2 -> H4)
    let prevLevel = 0;
    headings.forEach((h, index) => {
        const currentLevel = parseInt(h.tag.replace('h', ''));
        if (prevLevel > 0 && currentLevel > prevLevel + 1) {
            warnings.push({ type: 'warning', msg: `Skipped heading level: H${prevLevel} to H${currentLevel}` });
        }
        prevLevel = currentLevel;
    });

    // Deduplicate warnings
    return [...new Set(warnings.map(JSON.stringify))].map(JSON.parse).slice(0, 3); // Limit to 3
}

/**
 * Transform flat array to tree structure
 */
function buildTree(headings) {
    if (!headings || headings.length === 0) return [];

    const root = { level: 0, children: [] };
    const stack = [root];

    headings.forEach(h => {
        const currentLevel = parseInt(h.tag.replace('h', '')) || 7;
        const node = { ...h, level: currentLevel, children: [] };

        // Pop stack until we find the parent (a node with lower level)
        while (stack.length > 1 && stack[stack.length - 1].level >= currentLevel) {
            stack.pop();
        }

        const parent = stack[stack.length - 1];
        parent.children.push(node);
        stack.push(node);
    });

    return root.children;
}


/**
 * Recursive Tree Renderer
 */
function renderTree(nodes) {
    if (!nodes || nodes.length === 0) return '';

    return `<ul class="headings-group">
        ${nodes.map(node => {
            const hasChildren = node.children && node.children.length > 0;
            return `
                <li class="heading-node level-${node.level}">
                    <div class="heading-content">
                        ${hasChildren ? 
                            `<button class="tree-toggle-btn" aria-expanded="true">
                                <svg class="chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor"/></svg>
                             </button>` 
                            : '<span class="spacer"></span>'}
                        
                        <span class="tag-badge ${node.tag}">${node.tag.toUpperCase()}</span>
                        <span class="heading-text" title="${node.text}">${node.text || '<span class="text-muted">Empty</span>'}</span>
                        
                        <button class="copy-btn-mini" data-copy="${node.text}">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        </button>
                    </div>
                    ${hasChildren ? renderTree(node.children) : ''}
                </li>
            `;
        }).join('')}
    </ul>`;
}

// Helpers
function renderStat(label, count) {
    return `
        <div class="stat-item ${count === 0 ? 'inactive' : ''}">
            <span class="stat-label">${label}</span>
            <span class="stat-value">${count}</span>
        </div>
    `;
}

function renderWarning(w) {
    return `
        <div class="validation-msg ${w.type}">
            <span class="icon">${w.type === 'error' ? '❌' : '⚠️'}</span>
            <span>${w.msg}</span>
        </div>
    `;
}

function attachEventListeners(container) {
    // Copy buttons
    container.querySelectorAll('.copy-btn-mini').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(btn.dataset.copy, btn);
        });
    });

    // Toggle buttons
    container.querySelectorAll('.tree-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const li = btn.closest('li');
            const ul = li.querySelector('ul');
            if (ul) {
                const isExpanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', !isExpanded);
                ul.style.display = isExpanded ? 'none' : 'block';
                btn.querySelector('.chevron').style.transform = isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        });
    });
}
