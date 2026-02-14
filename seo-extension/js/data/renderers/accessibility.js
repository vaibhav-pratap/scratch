/**
 * Accessibility Renderer Module
 * Renders accessibility audit data in the UI
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
 * Helper function to escape HTML in data attributes
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render accessibility tab data
 */
export function renderAccessibilityTab(data) {
    if (!data) return;

    try {
        // Render overall score with checks data for doughnut chart
        renderAccessibilityScore(data.score, data.checks || {});

        // Render issues summary
        renderIssuesSummary(data.issues);

        // Render culprits
        renderCulprits(data.culprits);

        // Render detailed checks
        renderChecks(data.checks);

        // Render all issues
        renderAllIssues(data.issues);

        // Setup highlight toggle
        setupHighlightToggle(data.issues);

        // Setup filters
        setupFilters(data.issues);

    } catch (error) {
        console.error('[A11Y Renderer] Error rendering:', error);
    }
}

/**
 * Render overall accessibility score with doughnut chart
 */
function renderAccessibilityScore(score, checks) {
    const scoreValue = document.getElementById('a11y-score-value');
    const canvas = document.getElementById('a11y-score-chart');

    if (!scoreValue || !canvas) return;

    scoreValue.textContent = score;

    // Create doughnut chart with DPI scaling for crisp rendering
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 100;

    // Set display size (css pixels)
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    // Set actual size in memory (scaled for DPI)
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Scale the context to match DPI
    ctx.scale(dpr, dpr);

    const centerX = 50;
    const centerY = 50;
    const outerRadius = 48;
    const innerRadius = 36;

    // Clear canvas
    ctx.clearRect(0, 0, 100, 100);

    // Prepare data from checks
    const categories = [
        { key: 'images', label: 'Images', color: '#4CAF50' },
        { key: 'forms', label: 'Forms', color: '#2196F3' },
        { key: 'headings', label: 'Headings', color: '#FF9800' },
        { key: 'landmarks', label: 'Landmarks', color: '#9C27B0' },
        { key: 'links', label: 'Links', color: '#F44336' },
        { key: 'language', label: 'Language', color: '#00BCD4' },
        { key: 'contrast', label: 'Contrast', color: '#795548' },
        { key: 'interactive', label: 'Interactive', color: '#607D8B' },
        { key: 'media', label: 'Media', color: '#E91E63' }
    ];

    const chartData = categories.map(cat => ({
        ...cat,
        score: checks[cat.key]?.score || 0,
        passed: checks[cat.key]?.passed || 0,
        failed: checks[cat.key]?.failed || 0
    }));

    // Calculate total for percentages
    const total = chartData.reduce((sum, d) => sum + d.score, 0);

    // Draw segments
    let startAngle = -Math.PI / 2; // Start from top

    chartData.forEach(data => {
        const sliceAngle = (data.score / total) * 2 * Math.PI || 0;

        // Add small gap between segments for visual separation
        const gapAngle = 0.02;

        // Draw segment
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle + gapAngle, startAngle + sliceAngle - gapAngle);
        ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle - gapAngle, startAngle + gapAngle, true);
        ctx.closePath();

        // Use category color for vibrant visualization
        if (data.score > 0) {
            ctx.fillStyle = data.color;
        } else {
            ctx.fillStyle = '#E0E0E0'; // Gray for no data
        }

        ctx.fill();

        startAngle += sliceAngle;
    });

    // Add tooltip on hover
    canvas.style.cursor = 'pointer';

    // Remove old listeners by cloning (simplest way to clear event listeners)
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);

    // We need to get the context again for the new canvas and redraw because cloning clears content
    const ctx2 = newCanvas.getContext('2d');
    ctx2.scale(dpr, dpr);

    // Redraw on new canvas
    startAngle = -Math.PI / 2;
    chartData.forEach(data => {
        const sliceAngle = (data.score / total) * 2 * Math.PI || 0;
        const gapAngle = 0.02;

        ctx2.beginPath();
        ctx2.arc(centerX, centerY, outerRadius, startAngle + gapAngle, startAngle + sliceAngle - gapAngle);
        ctx2.arc(centerX, centerY, innerRadius, startAngle + sliceAngle - gapAngle, startAngle + gapAngle, true);
        ctx2.closePath();

        if (data.score > 0) ctx2.fillStyle = data.color;
        else ctx2.fillStyle = '#E0E0E0';

        ctx2.fill();
        startAngle += sliceAngle;
    });

    newCanvas.addEventListener('mousemove', function (e) {
        const rect = newCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if mouse is in the doughnut ring
        if (distance >= innerRadius && distance <= outerRadius) {
            const angle = Math.atan2(dy, dx);
            const normalizedAngle = angle < -Math.PI / 2 ? angle + 2 * Math.PI : angle;
            const adjustedAngle = normalizedAngle + Math.PI / 2;

            // Find which segment
            let currentAngle = 0;
            for (let i = 0; i < chartData.length; i++) {
                const sliceAngle = (chartData[i].score / total) * 2 * Math.PI || 0;
                if (adjustedAngle >= currentAngle && adjustedAngle < currentAngle + sliceAngle) {
                    showTooltip(e, chartData[i]);
                    return;
                }
                currentAngle += sliceAngle;
            }
        } else {
            hideTooltip();
        }
    });

    newCanvas.addEventListener('mouseleave', hideTooltip);
}

let tooltipElement = null;
function showTooltip(e, data) {
    if (!tooltipElement) {
        tooltipElement = document.createElement('div');
        tooltipElement.style.cssText = `
            position: fixed;
            background: var(--md-sys-color-surface-variant);
            color: var(--md-sys-color-on-surface-variant);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            pointer-events: none;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(tooltipElement);
    }

    tooltipElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${data.color}; display: inline-block;"></span>
            <strong>${data.label}</strong>
        </div>
        Score: ${data.score}%<br>
        <span style="color: var(--md-sys-color-success);">Passed: ${data.passed}</span> | <span style="color: var(--md-sys-color-error);">Failed: ${data.failed}</span>
    `;

    tooltipElement.style.left = (e.clientX + 10) + 'px';
    tooltipElement.style.top = (e.clientY + 10) + 'px';
    tooltipElement.style.display = 'block';
}

function hideTooltip() {
    if (tooltipElement) {
        tooltipElement.style.display = 'none';
    }
}

/**
 * Render issues summary counts
 */
function renderIssuesSummary(issues) {
    const criticalCount = document.getElementById('a11y-critical-count');
    const warningCount = document.getElementById('a11y-warning-count');
    const noticeCount = document.getElementById('a11y-notice-count');

    if (criticalCount) criticalCount.textContent = issues.critical?.length || 0;
    if (warningCount) warningCount.textContent = issues.warnings?.length || 0;
    if (noticeCount) noticeCount.textContent = issues.notices?.length || 0;
}

/**
 * Render top culprits affecting score
 */
function renderCulprits(culprits) {
    const container = document.getElementById('a11y-culprits-list');
    if (!container) return;

    if (!culprits || culprits.length === 0) {
        container.innerHTML = '<p style="color: var(--md-sys-color-on-surface-variant);">No major issues found!</p>';
        return;
    }

    const culpritsHTML = culprits.map(culprit => `
        <div class="data-group" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
                <strong>${culprit.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                <span style="color: var(--md-sys-color-on-surface-variant);"> - ${culprit.count} issues</span>
            </div>
            <span class="severity-badge ${culprit.impact}" style="
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                background: ${culprit.impact === 'critical' ? 'var(--md-sys-color-error-container)' : culprit.impact === 'warning' ? 'var(--md-sys-color-warning-container)' : 'var(--md-sys-color-primary-container)'};
                color: ${culprit.impact === 'critical' ? 'var(--md-sys-color-error)' : culprit.impact === 'warning' ? 'var(--md-sys-color-warning)' : 'var(--md-sys-color-primary)'};
            ">${culprit.impact.toUpperCase()}</span>
        </div>
    `).join('');

    container.innerHTML = culpritsHTML;
}

/**
 * Render detailed checks results
 */
function renderChecks(checks) {
    const container = document.getElementById('a11y-checks-container');
    if (!container) return;

    const checkCategories = [
        { key: 'images', label: 'Images', icon: '🖼️', color: '#4CAF50' },
        { key: 'forms', label: 'Forms', icon: '📝', color: '#2196F3' },
        { key: 'headings', label: 'Headings', icon: '📑', color: '#FF9800' },
        { key: 'landmarks', label: 'Landmarks', icon: '🏛️', color: '#9C27B0' },
        { key: 'links', label: 'Links', icon: '🔗', color: '#F44336' },
        { key: 'language', label: 'Language', icon: '🌐', color: '#00BCD4' },
        { key: 'contrast', label: 'Contrast', icon: '🌗', color: '#795548' },
        { key: 'interactive', label: 'Interactive', icon: '👆', color: '#607D8B' },
        { key: 'media', label: 'Media', icon: '🎬', color: '#E91E63' }
    ];

    const checksHTML = checkCategories.map(category => {
        const check = checks[category.key];
        if (!check) return '';

        const totalIssues = check.failed || 0;
        const passedTests = check.passed || 0;
        const score = check.score || 0;

        return `
            <div class="a11y-check-card" style="
                background: var(--md-sys-color-surface);
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="
                            font-size: 24px;
                            width: 40px;
                            height: 40px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: ${category.color}15;
                            border-radius: 10px;
                        ">${category.icon}</div>
                        <div>
                            <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--md-sys-color-on-surface);">${category.label}</h4>
                            <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-top: 2px;">
                                ${totalIssues === 0 ? 'No issues found' : `${totalIssues} issue${totalIssues === 1 ? '' : 's'} detected`}
                            </div>
                        </div>
                    </div>
                    <div class="score-badge" style="
                        background: ${score >= 90 ? 'var(--md-sys-color-success-container)' : score >= 70 ? 'var(--md-sys-color-warning-container)' : 'var(--md-sys-color-error-container)'};
                        color: ${score >= 90 ? 'var(--md-sys-color-on-success-container)' : score >= 70 ? 'var(--md-sys-color-on-warning-container)' : 'var(--md-sys-color-on-error-container)'};
                        padding: 4px 10px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 700;
                    ">
                        ${score}%
                    </div>
                </div>

                <div class="progress-bar-container" style="
                    height: 6px;
                    background: var(--md-sys-color-surface-variant);
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 12px;
                ">
                    <div class="progress-bar" style="
                        width: ${score}%;
                        height: 100%;
                        background: ${category.color};
                        border-radius: 3px;
                        transition: width 1s ease-out;
                    "></div>
                </div>

                <div style="display: flex; gap: 16px; font-size: 12px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--md-sys-color-success);"></span>
                        <span style="color: var(--md-sys-color-on-surface-variant);">Passed: <strong>${passedTests}</strong></span>
                    </div>
                    ${totalIssues > 0 ? `
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--md-sys-color-error);"></span>
                        <span style="color: var(--md-sys-color-on-surface-variant);">Failed: <strong>${totalIssues}</strong></span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = checksHTML;

    // Add hover effect
    const cards = container.querySelectorAll('.a11y-check-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        });
    });
}

/**
 * Render all issues with details
 */
function renderAllIssues(issues, filter = 'all') {
    const container = document.getElementById('a11y-issues-list');
    if (!container) return;

    let allIssues = [
        ...(issues.critical || []),
        ...(issues.warnings || []),
        ...(issues.notices || [])
    ];

    // Filter logic
    if (filter === 'critical') {
        allIssues = allIssues.filter(i => i.severity === 'critical');
    } else if (filter === 'warning') {
        allIssues = allIssues.filter(i => i.severity === 'warning');
    } else if (filter === 'contrast') {
        allIssues = allIssues.filter(i => i.type === 'color-contrast');
    }

    if (allIssues.length === 0) {
        container.innerHTML = '<p style="color: var(--md-sys-color-on-surface-variant); text-align: center; padding: 20px;">No issues found matching this filter. ✨</p>';
        return;
    }

    const issuesHTML = allIssues.map((issue, index) => {
        const dotClass = issue.severity === 'critical' ? 'poor' :
            issue.severity === 'warning' ? 'needs-improvement' :
                'good';

        const severityColor = issue.severity === 'critical' ? 'var(--md-sys-color-error)' :
            issue.severity === 'warning' ? 'var(--md-sys-color-warning)' :
                'var(--md-sys-color-success)';

        return `
        <div class="cwv-card" style="margin-bottom: 16px;">
            <div class="metric-header">
                <span>
                    <span class="metric-dot ${dotClass}"></span>
                    <strong>${issue.message}</strong>
                </span>
                <button class="action-btn secondary small highlight-issue-btn" 
                        data-selector="${escapeHtml(issue.selector)}" 
                        data-severity="${issue.severity}" 
                        data-message="${escapeHtml(issue.message)}">
                    Highlight
                </button>
            </div>

            <div class="metric-value" style="color: ${severityColor};">
                ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)} Issue
            </div>

            <div class="metric-element">
                <span>Element:</span>
                <code style="white-space: pre-wrap; word-break: break-all; overflow: visible; text-overflow: clip;">${escapeHtml(issue.element)}</code>
            </div>

            ${issue.suggestion ? `
                <div class="metric-element" style="margin-top: 8px;">
                    <strong style="display: block; margin-bottom: 4px;">💡 How to Fix</strong>
                    <span style="font-size: 10px; display: block; white-space: normal;">${escapeHtml(issue.suggestion)}</span>
                    ${issue.fix ? `<code style="margin-top: 4px; font-size: 9px; white-space: pre-wrap; word-break: break-all; overflow: visible; text-overflow: clip;">${escapeHtml(issue.fix)}</code>` : ''}
                </div>
            ` : ''}

            ${issue.wcagRef ? `
                <div class="metric-element" style="margin-top: 4px;">
                    <a href="${issue.wcagRef.url}" 
                       target="_blank" 
                       style="color: var(--md-sys-color-primary); text-decoration: none; font-size: 10px; display: inline-flex; align-items: center; gap: 4px;">
                        📖 WCAG ${issue.wcagRef.level}: ${issue.wcagRef.criterion}
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                        </svg>
                    </a>
                </div>
            ` : ''}
        </div>
        `;
    }).join('');

    container.innerHTML = issuesHTML;

    // Setup highlight buttons
    const buttons = container.querySelectorAll('.highlight-issue-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const selector = this.getAttribute('data-selector');
            const severity = this.getAttribute('data-severity');
            const message = this.getAttribute('data-message');

            sendTabMessage('highlightAccessibilityIssue', { selector, severity, message });
        });
    });
}

/**
 * Setup filter buttons
 */
function setupFilters(issues) {
    const filtersContainer = document.getElementById('a11y-filters');
    if (!filtersContainer) return;

    const chips = filtersContainer.querySelectorAll('.filter-chip');
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active state
            chips.forEach(c => {
                c.classList.remove('active');
                c.style.background = 'transparent';
                c.style.color = 'var(--md-sys-color-on-surface)';
                c.style.border = '1px solid var(--md-sys-color-outline)';
            });
            chip.classList.add('active');
            chip.style.background = 'var(--md-sys-color-secondary-container)';
            chip.style.color = 'var(--md-sys-color-on-secondary-container)';
            chip.style.border = 'none';

            const filter = chip.getAttribute('data-filter');
            renderAllIssues(issues, filter);
        });
    });

    // Initialize first button style
    const activeChip = filtersContainer.querySelector('.filter-chip.active');
    if (activeChip) {
        activeChip.style.background = 'var(--md-sys-color-secondary-container)';
        activeChip.style.color = 'var(--md-sys-color-on-secondary-container)';
        activeChip.style.border = 'none';
    }
}

/**
 * Setup toggle highlights button
 */
function setupHighlightToggle(issues) {
    const btn = document.getElementById('btn-toggle-a11y-highlights');
    if (!btn) return;

    let highlightsEnabled = false;

    btn.addEventListener('click', () => {
        highlightsEnabled = !highlightsEnabled;

        const allIssues = [
            ...(issues.critical || []),
            ...(issues.warnings || []),
            ...(issues.notices || [])
        ];

        sendTabMessage('toggleAccessibilityHighlights', { enabled: highlightsEnabled, issues: allIssues });

        btn.textContent = highlightsEnabled ? 'Hide Highlights' : 'Show Highlights';
        btn.classList.toggle('active', highlightsEnabled);
    });
}
