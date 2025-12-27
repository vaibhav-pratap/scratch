/**
 * AI Analysis Renderer Module
 * Renders comprehensive AI content analysis results
 */

import { analyzeContentWithAI, isApiKeyConfigured } from '../../services/gemini-content-analysis.js';


let lastAnalysisData = null;

/**
 * Get the last generated analysis for export
 */
export function getLastAnalysis() {
    return lastAnalysisData;
}

/**
 * Check and update AI Analysis tab visibility based on API key
 */
export async function checkApiKeyAndUpdateUI() {
    try {
        const apiKeyConfigured = await isApiKeyConfigured();
        const warningDiv = document.getElementById('ai-analysis-api-warning');
        const contentDiv = document.getElementById('ai-analysis-content');
        const btnGoToSettings = document.getElementById('btn-go-to-settings');
        const btnGenerate = document.getElementById('btn-generate-ai-analysis');

        // If elements don't exist yet, retry after a short delay
        if (!warningDiv || !contentDiv) {
            setTimeout(checkApiKeyAndUpdateUI, 100);
            return;
        }

        if (apiKeyConfigured) {
            if (warningDiv) warningDiv.style.display = 'none';
            if (contentDiv) contentDiv.style.display = 'block';

            // Setup generate button if not already set up
            if (btnGenerate && !btnGenerate.hasAttribute('data-listener-attached')) {
                btnGenerate.setAttribute('data-listener-attached', 'true');
                btnGenerate.addEventListener('click', handleGenerateAnalysis);
            }
        } else {
            if (warningDiv) warningDiv.style.display = 'block';
            if (contentDiv) contentDiv.style.display = 'none';

            // Setup go to settings button if not already set up
            if (btnGoToSettings && !btnGoToSettings.hasAttribute('data-listener-attached')) {
                btnGoToSettings.setAttribute('data-listener-attached', 'true');
                btnGoToSettings.addEventListener('click', () => {
                    const settingsTab = document.querySelector('[data-tab="settings"]');
                    if (settingsTab) {
                        settingsTab.click();
                    }
                });
            }
        }
    } catch (error) {
        console.error('[AI Analysis] Error checking API key:', error);
    }
}

/**
 * Initialize AI Analysis tab
 */
export async function initAIAnalysisTab() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeAIAnalysis();
        });
    } else {
        initializeAIAnalysis();
    }
}

/**
 * Internal initialization function
 */
async function initializeAIAnalysis() {
    try {
        // Initial check - retry if elements don't exist yet
        let retries = 0;
        const maxRetries = 10;

        const tryInit = async () => {
            const warningDiv = document.getElementById('ai-analysis-api-warning');
            const contentDiv = document.getElementById('ai-analysis-content');

            if (!warningDiv || !contentDiv) {
                if (retries < maxRetries) {
                    retries++;
                    setTimeout(tryInit, 100);
                    return;
                } else {
                    console.warn('[AI Analysis] Elements not found after retries');
                    return;
                }
            }

            await checkApiKeyAndUpdateUI();

            // Listen for tab switches to re-check API key
            document.addEventListener('click', async (e) => {
                if (e.target.closest('[data-tab="ai-analysis"]')) {
                    await checkApiKeyAndUpdateUI();
                }
            });

            // Listen for API key save events (when user saves key in settings)
            chrome.storage.onChanged.addListener((changes, areaName) => {
                if (areaName === 'local' && changes.geminiApiKey) {
                    checkApiKeyAndUpdateUI();
                }
            });
        };

        await tryInit();
    } catch (error) {
        console.error('[AI Analysis] Error initializing:', error);
    }
}

/**
 * Handle generate analysis button click
 */
async function handleGenerateAnalysis() {
    const data = window.currentSEOData;
    if (!data) {
        showError('No SEO data available. Please wait for the analysis to complete.');
        return;
    }

    showLoading();

    try {
        const analysis = await analyzeContentWithAI(data, data.readability);
        renderAnalysis(analysis);
    } catch (error) {
        console.error('[AI Analysis] Error:', error);
        if (error.message === 'API_KEY_REQUIRED') {
            showApiKeyWarning();
        } else {
            showError(error.message || 'Failed to generate AI analysis. Please try again.');
        }
    }
}

/**
 * Show loading state
 */
function showLoading() {
    const loadingDiv = document.getElementById('ai-analysis-loading');
    const errorDiv = document.getElementById('ai-analysis-error');
    const contentDiv = document.getElementById('ai-analysis-content');
    const btnGenerate = document.getElementById('btn-generate-ai-analysis');

    if (loadingDiv) loadingDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    if (btnGenerate) btnGenerate.disabled = true;
    if (contentDiv) {
        // Hide all analysis sections
        document.getElementById('ai-metrics-chart-container')?.style.setProperty('display', 'none');
        document.getElementById('ai-metrics-grid')?.style.setProperty('display', 'none');
        document.getElementById('ai-detailed-analysis')?.style.setProperty('display', 'none');
        document.getElementById('ai-recommendations')?.style.setProperty('display', 'none');
        document.getElementById('ai-improvement-plan')?.style.setProperty('display', 'none');
        document.getElementById('ai-comparison-chart-container')?.style.setProperty('display', 'none');
    }
}

/**
 * Show error message
 */
function showError(message) {
    const loadingDiv = document.getElementById('ai-analysis-loading');
    const errorDiv = document.getElementById('ai-analysis-error');
    const btnGenerate = document.getElementById('btn-generate-ai-analysis');

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    }
    if (btnGenerate) btnGenerate.disabled = false;
}

/**
 * Show API key warning
 */
function showApiKeyWarning() {
    const warningDiv = document.getElementById('ai-analysis-api-warning');
    const contentDiv = document.getElementById('ai-analysis-content');
    const loadingDiv = document.getElementById('ai-analysis-loading');

    if (warningDiv) warningDiv.style.display = 'block';
    if (contentDiv) contentDiv.style.display = 'none';
    if (loadingDiv) loadingDiv.style.display = 'none';
}

/**
 * Render complete analysis
 */
function renderAnalysis(analysis) {
    lastAnalysisData = analysis;

    const loadingDiv = document.getElementById('ai-analysis-loading');
    const errorDiv = document.getElementById('ai-analysis-error');
    const btnGenerate = document.getElementById('btn-generate-ai-analysis');

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.textContent = 'Refresh Analysis';
    }

    // Render overall score
    renderOverallScore(analysis);

    // Render strengths if available (before detailed analysis)
    if (analysis.strengths && analysis.strengths.length > 0) {
        renderStrengths(analysis.strengths);
    }

    // Render metrics chart
    if (analysis.metrics) {
        renderMetricsChart(analysis.metrics);
        renderMetricsGrid(analysis.metrics);
    }

    // Render detailed analysis
    if (analysis.detailedAnalysis) {
        renderDetailedAnalysis(analysis.detailedAnalysis);
    }

    // Render recommendations
    if (analysis.recommendations) {
        renderRecommendations(analysis.recommendations);
    }

    // Render improvement plan
    if (analysis.improvementPlan) {
        renderImprovementPlan(analysis.improvementPlan);
    }

    // Render comparison chart
    if (analysis.comparison) {
        renderComparisonChart(analysis.comparison);
    }
}

/**
 * Render strengths section
 */
function renderStrengths(strengths) {
    const container = document.getElementById('ai-detailed-analysis');
    if (!container) return;

    // Create strengths card
    const strengthsCard = document.createElement('div');
    strengthsCard.className = 'card';
    strengthsCard.style.marginBottom = '24px';
    strengthsCard.style.padding = '16px';
    strengthsCard.style.borderLeft = '4px solid var(--success-color)';
    strengthsCard.style.backgroundColor = 'var(--md-sys-color-success-container)';
    strengthsCard.innerHTML = `
        <strong style="font-size: 15px; color: var(--success-color); display: block; margin-bottom: 12px;">
            ✓ Content Strengths
        </strong>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--md-sys-color-on-surface); line-height: 1.8;">
            ${strengths.map(strength => `<li style="margin-bottom: 6px;">${strength}</li>`).join('')}
        </ul>
    `;

    // Insert at the beginning of detailed analysis
    if (container.firstChild) {
        container.insertBefore(strengthsCard, container.firstChild);
    } else {
        container.appendChild(strengthsCard);
    }

    // Add heading if not exists
    if (!container.querySelector('h3')) {
        const heading = document.createElement('h3');
        heading.style.margin = '0 0 16px 0';
        heading.style.fontSize = '16px';
        heading.style.fontWeight = '600';
        heading.textContent = 'Detailed Analysis';
        container.insertBefore(heading, strengthsCard);
    }
}

/**
 * Render overall score
 */
function renderOverallScore(analysis) {
    const scoreEl = document.getElementById('ai-overall-score');
    const ratingEl = document.getElementById('ai-overall-rating');
    const summaryEl = document.getElementById('ai-overall-summary');

    const score = analysis.overallScore || 0;
    const rating = analysis.overallRating || 'N/A';
    const summary = analysis.summary || 'No summary available.';

    if (scoreEl) {
        scoreEl.textContent = score;
        scoreEl.style.color = score >= 80 ? 'var(--success-color)' :
            (score >= 60 ? 'var(--warning-color)' : 'var(--error-color)');
    }

    if (ratingEl) {
        ratingEl.textContent = rating;
        ratingEl.style.color = score >= 80 ? 'var(--success-color)' :
            (score >= 60 ? 'var(--warning-color)' : 'var(--error-color)');
    }

    if (summaryEl) {
        summaryEl.textContent = summary;
    }
}

/**
 * Render metrics chart
 */
function renderMetricsChart(metrics) {
    const container = document.getElementById('ai-metrics-chart-container');
    const canvas = document.getElementById('ai-metrics-chart');

    if (!container || !canvas || !window.Chart) return;

    container.style.display = 'block';

    // Prepare chart data
    const labels = Object.keys(metrics).map(key => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    });

    const scores = Object.values(metrics).map(m => m.score || 0);
    const colors = scores.map(score =>
        score >= 80 ? 'rgba(76, 175, 80, 0.8)' : (score >= 60 ? 'rgba(255, 152, 0, 0.8)' : 'rgba(244, 67, 54, 0.8)')
    );

    // Destroy existing chart if any
    if (window.aiMetricsChartInstance) {
        window.aiMetricsChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    window.aiMetricsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: scores,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Score: ${context.parsed.y}/100`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Render metrics grid
 */
function renderMetricsGrid(metrics) {
    const container = document.getElementById('ai-metrics-grid');
    if (!container) return;

    container.style.display = 'grid';
    container.innerHTML = '';

    const statusColor = (status) => {
        if (status === 'good' || status === 'Excellent' || status === 'Good') return 'var(--success-color)';
        if (status === 'warning' || status === 'Fair') return 'var(--warning-color)';
        return 'var(--error-color)';
    };

    const statusIcon = (status) => {
        if (status === 'good' || status === 'Excellent' || status === 'Good') return '✓';
        if (status === 'warning' || status === 'Fair') return '⚠';
        return '✗';
    };

    Object.entries(metrics).forEach(([key, metric]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const score = metric.score || 0;
        const rating = metric.rating || 'N/A';
        const analysis = metric.analysis || '';

        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '16px';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 14px;">${label}</strong>
                <span style="color: ${statusColor(rating)}; font-weight: 700; font-size: 18px;">
                    ${statusIcon(rating)} ${score}
                </span>
            </div>
            <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 8px;">
                ${rating}
            </div>
            <div style="font-size: 12px; color: var(--md-sys-color-on-surface); line-height: 1.5;">
                ${analysis.substring(0, 150)}${analysis.length > 150 ? '...' : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Render detailed analysis sections
 */
function renderDetailedAnalysis(detailedAnalysis) {
    const container = document.getElementById('ai-detailed-analysis');
    if (!container) return;

    container.style.display = 'block';

    // Only add heading if it doesn't exist (might have been added by strengths)
    if (!container.querySelector('h3')) {
        const heading = document.createElement('h3');
        heading.style.margin = '0 0 16px 0';
        heading.style.fontSize = '16px';
        heading.style.fontWeight = '600';
        heading.textContent = 'Detailed Analysis';
        container.appendChild(heading);
    }

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

    Object.entries(detailedAnalysis).forEach(([key, analysis]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const score = analysis.score || 0;
        const status = analysis.status || 'good';
        const analysisText = analysis.analysis || '';
        const recommendations = analysis.recommendations || [];

        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '16px';
        card.style.padding = '16px';
        card.style.borderLeft = `4px solid ${statusColor(status)}`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                    <strong style="font-size: 15px; display: flex; align-items: center; gap: 8px;">
                        <span style="color: ${statusColor(status)};">${statusIcon(status)}</span>
                        ${label}
                    </strong>
                    <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px;">
                        Score: ${score}/100
                    </div>
                </div>
            </div>
            <div style="font-size: 13px; color: var(--md-sys-color-on-surface); line-height: 1.6; margin-bottom: ${recommendations.length > 0 ? '12px' : '0'};">
                ${analysisText}
            </div>
            ${recommendations.length > 0 ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                    <strong style="font-size: 12px; display: block; margin-bottom: 8px; color: var(--md-sys-color-on-surface-variant);">Recommendations:</strong>
                    <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: var(--md-sys-color-on-surface);">
                        ${recommendations.map(rec => `<li style="margin-bottom: 4px;">${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        container.appendChild(card);
    });
}

/**
 * Render recommendations
 */
function renderRecommendations(recommendations) {
    const container = document.getElementById('ai-recommendations');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = '<h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Recommendations</h3>';

    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    const priorityColors = {
        critical: 'var(--error-color)',
        high: 'var(--warning-color)',
        medium: 'var(--md-sys-color-primary)',
        low: 'var(--md-sys-color-on-surface-variant)'
    };

    priorityOrder.forEach(priority => {
        const items = recommendations[priority] || [];
        if (items.length === 0) return;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '16px';
        card.style.padding = '16px';
        card.style.borderLeft = `4px solid ${priorityColors[priority]}`;
        card.innerHTML = `
            <strong style="font-size: 14px; text-transform: capitalize; color: ${priorityColors[priority]}; display: block; margin-bottom: 12px;">
                ${priority} Priority
            </strong>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--md-sys-color-on-surface); line-height: 1.8;">
                ${items.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
            </ul>
        `;
        container.appendChild(card);
    });
}

/**
 * Render improvement plan
 */
function renderImprovementPlan(plan) {
    const container = document.getElementById('ai-improvement-plan');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = '<h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Improvement Plan</h3>';

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">';

    if (plan.quickWins && plan.quickWins.length > 0) {
        html += `
            <div class="card" style="padding: 16px; border-left: 4px solid var(--success-color);">
                <strong style="font-size: 14px; color: var(--success-color); display: block; margin-bottom: 12px;">
                    ⚡ Quick Wins
                </strong>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--md-sys-color-on-surface); line-height: 1.8;">
                    ${plan.quickWins.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    if (plan.longTerm && plan.longTerm.length > 0) {
        html += `
            <div class="card" style="padding: 16px; border-left: 4px solid var(--md-sys-color-primary);">
                <strong style="font-size: 14px; color: var(--md-sys-color-primary); display: block; margin-bottom: 12px;">
                    📈 Long-term Improvements
                </strong>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--md-sys-color-on-surface); line-height: 1.8;">
                    ${plan.longTerm.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = '<h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Improvement Plan</h3>' + html;
}

/**
 * Render comparison chart
 */
function renderComparisonChart(comparison) {
    const container = document.getElementById('ai-comparison-chart-container');
    const canvas = document.getElementById('ai-comparison-chart');

    if (!container || !canvas || !comparison || !window.Chart) return;

    container.style.display = 'block';

    const labels = ['Your Score', 'Industry Average', 'Best Practice'];
    const scores = [
        comparison.yourScore || 0,
        comparison.industryAverage || 0,
        comparison.bestPractice || 0
    ];
    const colors = [
        'rgba(66, 133, 244, 0.8)',
        'rgba(158, 158, 158, 0.8)',
        'rgba(76, 175, 80, 0.8)'
    ];

    // Destroy existing chart if any
    if (window.aiComparisonChartInstance) {
        window.aiComparisonChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    window.aiComparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: scores,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Score: ${context.parsed.y}/100`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
