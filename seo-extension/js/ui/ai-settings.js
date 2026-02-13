/**
 * AI Settings UI Module
 * Unified settings handler for all AI providers (Gemini)
 */

import { getGeminiApiKey, saveGeminiApiKey, testApiKey as testGeminiKey } from '../services/gemini.js';
import { AI_PROVIDERS } from '../services/ai-models.js';

/**
 * Initialize AI settings UI
 */
export async function initAISettings() {
    // Load Gemini settings
    await loadGeminiSettings();

    // Setup event listeners
    setupGeminiListeners();
}

/**
 * Load Gemini settings
 */
async function loadGeminiSettings() {
    const apiKey = await getGeminiApiKey();
    const apiKeyInput = document.getElementById('gemini-api-key');

    if (apiKeyInput && apiKey) {
        apiKeyInput.placeholder = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) + ' (click to change)';
        apiKeyInput.value = '';
        apiKeyInput.type = 'password';

        apiKeyInput.addEventListener('focus', () => {
            if (apiKeyInput.value === '') {
                apiKeyInput.placeholder = 'Enter your Gemini API key';
            }
        });
    }
}

/**
 * Setup Gemini event listeners
 */
function setupGeminiListeners() {
    const btnSave = document.getElementById('btn-save-api-key');
    if (btnSave) {
        btnSave.addEventListener('click', handleSaveGeminiKey);
    }
}

/**
 * Handle Gemini API key save
 */
async function handleSaveGeminiKey() {
    const apiKeyInput = document.getElementById('gemini-api-key');
    const statusDiv = document.getElementById('gemini-status');

    if (!apiKeyInput) return;

    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        const savedKey = await getGeminiApiKey();
        if (savedKey) {
            showStatus(statusDiv, 'API key already saved. Enter a new key to update.', 'info');
            return;
        }
        showStatus(statusDiv, 'Please enter an API key', 'error');
        return;
    }

    showStatus(statusDiv, 'Testing API key...', 'info');

    try {
        const result = await testGeminiKey(apiKey, 'gemini-2.0-flash');

        if (result.valid) {
            await saveGeminiApiKey(apiKey);
            apiKeyInput.value = '';
            apiKeyInput.placeholder = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) + ' (click to change)';
            showStatus(statusDiv, 'Gemini API key saved successfully!', 'success');
        } else {
            showStatus(statusDiv, result.error || 'Invalid API key', 'error');
        }
    } catch (error) {
        console.error('[AI Settings] Error testing Gemini key:', error);
        showStatus(statusDiv, `Error: ${error.message}`, 'error');
    }
}

/**
 * Show status message
 */
function showStatus(statusDiv, message, type = 'info') {
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.style.display = 'block';

    if (type === 'success') {
        statusDiv.style.background = 'var(--md-sys-color-success-container)';
        statusDiv.style.color = 'var(--md-sys-color-on-success-container)';
    } else if (type === 'error') {
        statusDiv.style.background = 'var(--md-sys-color-error-container)';
        statusDiv.style.color = 'var(--md-sys-color-on-error-container)';
    } else {
        statusDiv.style.background = 'var(--md-sys-color-primary-container)';
        statusDiv.style.color = 'var(--md-sys-color-on-primary-container)';
    }

    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}
