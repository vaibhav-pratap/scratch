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
 * Render accessibility tab data
 */
export function renderAccessibilityTab(data) {
    if (!data) return;

    try {
        // Render overall score
        renderAccessibilityScore(data.score);

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
 * Render overall accessibility score
 */
function renderAccessibilityScore(score) {
    const scoreValue = document.getElementById('a11y-score-value');
    const scoreCircle = document.getElementById('a11y-score-circle');

    if (!scoreValue || !scoreCircle) return;

    scoreValue.textContent = score;

    // Color code based on score
    if (score >= 90) {
        scoreCircle.style.borderColor = 'var(--md-sys-color-success)';
    } else if (score >= 70) {
        scoreCircle.style.borderColor = 'var(--md-sys-color-warning)';
    } else {
        scoreCircle.style.borderColor = 'var(--md-sys-color-error)';
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
 * Render all issues with details (using exact metric card structure from cards.css)
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
        // Map severity to metric-dot classes
        const dotClass = issue.severity === 'critical' ? 'poor' :
            issue.severity === 'warning' ? 'needs-improvement' :
                'good';

        const severityColor = issue.severity === 'critical' ? 'var(--md-sys-color-error)' :
            issue.severity === 'warning' ? 'var(--md-sys-color-warning)' :
                'var(--md-sys-color-success)';

        return `
        <div class="cwv-card" style="margin-bottom: 16px;">
            <!-- Metric Header (like LCP/CLS cards) -->
            <div class="metric-header">
                <span>
                    <span class="metric-dot ${dotClass}"></span>
                    <strong>${issue.message}</strong>
                </span>
                <button class="action-btn secondary small highlight-issue-btn" 
                        data-selector="${issue.selector}" 
                        data-severity="${issue.severity}" 
                        data-message="${issue.message}">
                    Highlight
                </button>
            </div>

            <!-- Metric Value / Rating -->
            <div class="metric-value" style="color: ${severityColor};">
                ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)} Issue
            </div>

            <!-- Metric Element (Element selector) -->
            <div class="metric-element">
                <span>Element:</span>
                <code>${issue.element}</code>
            </div>

            <!-- Suggestion Section (if available) -->
            ${issue.suggestion ? `
                <div class="metric-element" style="margin-top: 8px;">
                    <strong style="display: block; margin-bottom: 4px;">💡 How to Fix</strong>
                    <span style="font-size: 10px;">${issue.suggestion}</span>
                    ${issue.fix ? `<code style="margin-top: 4px; font-size: 9px;">${issue.fix}</code>` : ''}
                </div>
            ` : ''}

            <!-- WCAG Reference -->
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

    // Setup individual highlight buttons
    document.querySelectorAll('.highlight-issue-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selector = e.target.getAttribute('data-selector');
            const severity = e.target.getAttribute('data-severity');
            const message = e.target.getAttribute('data-message');
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
