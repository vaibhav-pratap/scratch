/**
 * AI Summary UI Module
 * Handles AI summary generation and display
 * Supports AI summary generation using Gemini
 */

import { generateOverviewSummary } from '../services/ai-prompts.js';
import { hasApiKey } from '../services/ai-router.js';
import { getSettings } from '../core/storage.js';
import { AI_MODELS, DEFAULT_MODEL, getModelById } from '../services/ai-models.js';

/**
 * Initialize AI Summary UI
 */
export function initAISummary() {
    const btnGenerate = document.getElementById('btn-generate-ai-summary');
    if (btnGenerate) {
        btnGenerate.addEventListener('click', handleGenerateSummary);
    }
}

/**
 * Handle generate AI summary button click
 */
async function handleGenerateSummary() {
    const data = window.currentSEOData;
    if (!data) {
        showError('No SEO data available. Please wait for the analysis to complete.');
        return;
    }

    // Get selected model or use default
    const settings = await getSettings(['selectedModel']);
    const modelId = settings.selectedModel || DEFAULT_MODEL;
    const model = getModelById(modelId);

    if (!model) {
        showError('Invalid model selected. Please check settings.');
        return;
    }

    // Check if API key is configured for the selected provider
    const hasKey = await hasApiKey(model.provider);
    if (!hasKey) {
        showError('Please configure your Gemini API key in Settings first.');
        // Switch to settings tab
        const settingsTab = document.querySelector('[data-tab="settings"]');
        if (settingsTab) {
            settingsTab.click();
        }
        return;
    }

    // Show loading state
    showLoading();

    try {
        // Generate concise overview summary
        const summary = await generateOverviewSummary(data);

        // Display summary
        showSummary(summary);
    } catch (error) {
        console.error('[AI Summary] Error:', error);
        showError(error.message || 'Failed to generate AI summary. Please try again.');
    }
}

/**
 * Show loading state
 */
function showLoading() {
    const contentDiv = document.getElementById('ai-summary-content');
    const textDiv = document.getElementById('ai-summary-text');
    const loadingDiv = document.getElementById('ai-summary-loading');
    const errorDiv = document.getElementById('ai-summary-error');
    const btnGenerate = document.getElementById('btn-generate-ai-summary');

    if (contentDiv) contentDiv.style.display = 'block';
    if (textDiv) textDiv.style.display = 'none';
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    if (btnGenerate) {
        btnGenerate.disabled = true;
        btnGenerate.textContent = 'Generating...';
    }
}

/**
 * Show summary text
 */
function showSummary(summary) {
    const contentDiv = document.getElementById('ai-summary-content');
    const textDiv = document.getElementById('ai-summary-text');
    const loadingDiv = document.getElementById('ai-summary-loading');
    const errorDiv = document.getElementById('ai-summary-error');
    const btnGenerate = document.getElementById('btn-generate-ai-summary');

    if (contentDiv) contentDiv.style.display = 'block';
    if (textDiv) {
        textDiv.style.display = 'block';
        // Convert markdown-like formatting to HTML
        textDiv.innerHTML = formatSummaryText(summary);
    }
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Regenerate
        `;
    }
}

/**
 * Show error message
 */
function showError(message) {
    const contentDiv = document.getElementById('ai-summary-content');
    const textDiv = document.getElementById('ai-summary-text');
    const loadingDiv = document.getElementById('ai-summary-loading');
    const errorDiv = document.getElementById('ai-summary-error');
    const btnGenerate = document.getElementById('btn-generate-ai-summary');

    if (contentDiv) contentDiv.style.display = 'block';
    if (textDiv) textDiv.style.display = 'none';
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    }
    if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Generate
        `;
    }
}

/**
 * Format summary text with basic markdown support
 */
function formatSummaryText(text) {
    if (!text) return '';

    // Escape HTML first
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Convert markdown-style formatting
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: 700; margin-top: 16px; margin-bottom: 8px; color: var(--md-sys-color-primary);">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 18px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; color: var(--md-sys-color-primary);">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 20px; font-weight: 700; margin-top: 24px; margin-bottom: 12px; color: var(--md-sys-color-primary);">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>');
    html = html.replace(/^(\d+)\. (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 4px;">$2</li>');

    // Wrap consecutive list items in ul
    html = html.replace(/(<li.*?<\/li>\n?)+/g, '<ul style="margin: 8px 0; padding-left: 0;">$&</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p style="margin: 8px 0; line-height: 1.6;">');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph
    if (!html.startsWith('<h') && !html.startsWith('<ul')) {
        html = '<p style="margin: 0; line-height: 1.6;">' + html + '</p>';
    }

    return html;
}

