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

    // Create doughnut chart
    const ctx = canvas.getContext('2d');
    const centerX = 70;
    const centerY = 70;
    const outerRadius = 65;
    const innerRadius = 50;

    // Clear canvas
    ctx.clearRect(0, 0, 140, 140);

    // Prepare data from checks
    const categories = [
        { key: 'images', label: 'Images', color: '#4CAF50' },
        { key: 'forms', label: 'Forms', color: '#2196F3' },
        { key: 'headings', label: 'Headings', color: '#FF9800' },
        { key: 'landmarks', label: 'Landmarks', color: '#9C27B0' },
        { key: 'links', label: 'Links', color: '#F44336' },
        { key: 'language', label: 'Language', color: '#00BCD4' }
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

        // Draw segment
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();

        // Color based on score
        if (data.score >= 90) {
            ctx.fillStyle = '#0F9D58'; // Green
        } else if (data.score >= 70) {
            ctx.fillStyle = '#F4B400'; // Yellow
        } else {
            ctx.fillStyle = '#DB4437'; // Red
        }

        ctx.fill();

        // Add border
        ctx.strokeStyle = 'var(--md-sys-color-surface)';
        ctx.lineWidth = 2;
        ctx.stroke();

        startAngle += sliceAngle;
    });

    // Add tooltip on hover
    canvas.style.cursor = 'pointer';

    canvas.addEventListener('mousemove', function (e) {
        const rect = canvas.getBoundingClientRect();
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

    canvas.addEventListener('mouseleave', hideTooltip);
}

/**
 * Show tooltip for chart segment
 */
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
        <strong>${data.label}</strong><br>
        Score: ${data.score}%<br>
        Passed: ${data.passed} | Failed: ${data.failed}
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
        { key: 'images', label: 'Images', icon: '🖼️' },
        { key: 'forms', label: 'Forms', icon: '📝' },
        { key: 'headings', label: 'Headings', icon: '📑' },
        { key: 'landmarks', label: 'Landmarks', icon: '🏛️' },
        { key: 'links', label: 'Links', icon: '🔗' },
        { key: 'language', label: 'Language', icon: '🌐' }
    ];

    const checksHTML = checkCategories.map(category => {
        const check = checks[category.key];
        if (!check) return '';

        const totalIssues = check.failed || 0;
        const passedTests = check.passed || 0;
        const score = check.score || 0;

        return `
            <div class="data-group" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 20px;">${category.icon}</span>
                        <strong>${category.label}</strong>
                    </div>
                    <div style="font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                        ${passedTests} passed • ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 24px; font-weight: 700; color: ${score >= 90 ? 'var(--md-sys-color-success)' : score >= 70 ? 'var(--md-sys-color-warning)' : 'var(--md-sys-color-error)'};">
                        ${score}%
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = checksHTML;
}

/**
 * Render all issues with details
 */
function renderAllIssues(issues) {
    const container = document.getElementById('a11y-issues-list');
    if (!container) return;

    const allIssues = [
        ...(issues.critical || []),
        ...(issues.warnings || []),
        ...(issues.notices || [])
    ];

    if (allIssues.length === 0) {
        container.innerHTML = '<p style="color: var(--md-sys-color-on-surface-variant);">No accessibility issues found! 🎉</p>';
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
    console.log(`[A11Y Renderer] Setting up ${buttons.length} highlight buttons`);

    buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const selector = this.getAttribute('data-selector');
            const severity = this.getAttribute('data-severity');
            const message = this.getAttribute('data-message');

            console.log('[A11Y Renderer] Highlight clicked:', { selector, severity, message });

            sendTabMessage('highlightAccessibilityIssue', { selector, severity, message });
        });
    });
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
