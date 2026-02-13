/**
 * AI Insights UI Module
 * Reusable component for displaying AI insights on any tab
 * Supports AI insights using Gemini
 */

import {
    generateOverviewSummary,
    generateMetaInsights,
    generateHeadingsInsights,
    generateImagesInsights,
    generateLinksInsights,
    generateAccessibilityInsights,
    generateSchemaInsights
} from '../services/ai-prompts.js';
import { hasApiKey } from '../services/ai-router.js';
import { getSettings } from '../core/storage.js';
import { AI_MODELS, DEFAULT_MODEL, getModelById } from '../services/ai-models.js';

/**
 * Create AI insights card HTML
 */
export function createAIInsightsCard(tabId) {
    return `
        <div class="card ai-insights-card" id="ai-insights-${tabId}" style="margin-top: 16px;">
            <div class="data-group" style="margin-bottom: 0;">
                <div class="label-row" style="justify-content: space-between; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        AI Insights
                    </label>
                    <button class="btn-ai-insights action-btn secondary small" data-tab="${tabId}" style="display: flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Get Insights
                    </button>
                </div>
                <div class="ai-insights-content" id="ai-insights-content-${tabId}" style="margin-top: 12px; display: none;">
                    <div class="ai-insights-text" id="ai-insights-text-${tabId}" style="white-space: pre-wrap; line-height: 1.6; padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; font-size: 13px;"></div>
                    <div class="ai-insights-loading" id="ai-insights-loading-${tabId}" style="display: none; text-align: center; padding: 20px;">
                        <div style="display: inline-block; width: 18px; height: 18px; border: 3px solid var(--md-sys-color-primary-container); border-top-color: var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin-top: 12px; color: var(--md-sys-color-on-surface-variant); font-size: 12px;">Generating insights...</p>
                    </div>
                    <div class="ai-insights-error" id="ai-insights-error-${tabId}" style="display: none; color: var(--md-sys-color-error); padding: 12px; background: var(--md-sys-color-error-container); border-radius: 4px; margin-top: 8px; font-size: 12px;"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize AI insights for all tabs
 */
export function initAIInsights() {
    try {
        // Setup click handlers for all AI insight buttons
        // Use event delegation on document to handle dynamically added buttons
        document.addEventListener('click', async (e) => {
            try {
                const button = e.target.closest('.btn-ai-insights');
                if (button) {
                    e.preventDefault();
                    e.stopPropagation();
                    const tabId = button.getAttribute('data-tab');
                    if (tabId) {
                        await handleAIInsightsClick(tabId);
                    }
                }
            } catch (error) {
                console.error('[AI Insights] Error handling click:', error);
            }
        });
    } catch (error) {
        console.error('[AI Insights] Error initializing:', error);
    }
}

/**
 * Handle AI insights button click
 */
async function handleAIInsightsClick(tabId) {
    const data = window.currentSEOData;
    if (!data) {
        showError(tabId, 'No SEO data available. Please wait for the analysis to complete.');
        return;
    }

    // Get selected model or use default
    const settings = await getSettings(['selectedModel']);
    const modelId = settings.selectedModel || DEFAULT_MODEL;
    const model = getModelById(modelId);

    if (!model) {
        showError(tabId, 'Invalid model selected. Please check settings.');
        return;
    }

    // Check if API key is configured for the selected provider
    const hasKey = await hasApiKey(model.provider);
    if (!hasKey) {
        showError(tabId, 'Please configure your Gemini API key in Settings first.');
        return;
    }

    showLoading(tabId);

    try {
        let insights;

        switch (tabId) {
            case 'overview':
                insights = await generateOverviewSummary(data);
                break;
            case 'meta':
                insights = await generateMetaInsights(data);
                break;
            case 'headings':
                insights = await generateHeadingsInsights(data);
                break;
            case 'images':
                insights = await generateImagesInsights(data);
                break;
            case 'links':
                insights = await generateLinksInsights(data);
                break;
            case 'accessibility':
                insights = await generateAccessibilityInsights(data);
                break;
            case 'schema':
                insights = await generateSchemaInsights(data);
                break;
            default:
                throw new Error('Unknown tab ID');
        }

        showInsights(tabId, insights);
    } catch (error) {
        console.error(`[AI Insights ${tabId}] Error:`, error);
        showError(tabId, error.message || 'Failed to generate insights. Please try again.');
    }
}

/**
 * Show loading state
 */
function showLoading(tabId) {
    const contentDiv = document.getElementById(`ai-insights-content-${tabId}`);
    const textDiv = document.getElementById(`ai-insights-text-${tabId}`);
    const loadingDiv = document.getElementById(`ai-insights-loading-${tabId}`);
    const errorDiv = document.getElementById(`ai-insights-error-${tabId}`);
    const button = document.querySelector(`.btn-ai-insights[data-tab="${tabId}"]`);

    if (contentDiv) contentDiv.style.display = 'block';
    if (textDiv) textDiv.style.display = 'none';
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    if (button) {
        button.disabled = true;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Generating...
        `;
    }
}

/**
 * Show insights text
 */
function showInsights(tabId, insights) {
    const contentDiv = document.getElementById(`ai-insights-content-${tabId}`);
    const textDiv = document.getElementById(`ai-insights-text-${tabId}`);
    const loadingDiv = document.getElementById(`ai-insights-loading-${tabId}`);
    const errorDiv = document.getElementById(`ai-insights-error-${tabId}`);
    const button = document.querySelector(`.btn-ai-insights[data-tab="${tabId}"]`);

    if (contentDiv) contentDiv.style.display = 'block';
    if (textDiv) {
        textDiv.style.display = 'block';
        textDiv.innerHTML = formatInsightsText(insights);
    }
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (button) {
        button.disabled = false;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Refresh
        `;
    }
}

/**
 * Show error message
 */
function showError(tabId, message) {
    const contentDiv = document.getElementById(`ai-insights-content-${tabId}`);
    const textDiv = document.getElementById(`ai-insights-text-${tabId}`);
    const loadingDiv = document.getElementById(`ai-insights-loading-${tabId}`);
    const errorDiv = document.getElementById(`ai-insights-error-${tabId}`);
    const button = document.querySelector(`.btn-ai-insights[data-tab="${tabId}"]`);

    if (contentDiv) contentDiv.style.display = 'block';
    if (textDiv) textDiv.style.display = 'none';
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    }
    if (button) {
        button.disabled = false;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Get Insights
        `;
    }
}

/**
 * Format insights text with basic markdown support
 */
function formatInsightsText(text) {
    if (!text) return '';

    // Escape HTML first
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Convert markdown-style formatting
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^(\d+)\.\s+(.*$)/gim, '<div style="margin: 4px 0; padding-left: 16px;"><strong>$1.</strong> $2</div>');
    html = html.replace(/^-\s+(.*$)/gim, '<div style="margin: 4px 0; padding-left: 16px;">• $1</div>');
    html = html.replace(/\n\n/g, '</p><p style="margin: 8px 0; line-height: 1.6;">');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph
    if (!html.startsWith('<div')) {
        html = '<p style="margin: 0; line-height: 1.6;">' + html + '</p>';
    }

    return html;
}

