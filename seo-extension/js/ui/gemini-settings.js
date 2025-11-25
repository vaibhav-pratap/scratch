/**
 * Gemini Settings UI Module
 * Handles UI for Gemini API key and model selection
 */

import { getGeminiApiKey, saveGeminiApiKey, getGeminiModel, saveGeminiModel, testApiKey, GEMINI_MODELS } from '../services/gemini.js';

/**
 * Initialize Gemini settings UI
 */
export async function initGeminiSettings() {
    // Load saved settings
    await loadGeminiSettings();

    // Setup API key save button
    const btnSaveApiKey = document.getElementById('btn-save-api-key');
    if (btnSaveApiKey) {
        btnSaveApiKey.addEventListener('click', handleSaveApiKey);
    }

    // Setup model selection change
    const modelSelect = document.getElementById('gemini-model');
    if (modelSelect) {
        modelSelect.addEventListener('change', handleModelChange);
    }
}

/**
 * Load and display saved Gemini settings
 */
async function loadGeminiSettings() {
    // Load API key (masked)
    const apiKey = await getGeminiApiKey();
    const apiKeyInput = document.getElementById('gemini-api-key');
    if (apiKeyInput) {
        if (apiKey) {
            // Show masked version as placeholder
            apiKeyInput.placeholder = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) + ' (click to change)';
            apiKeyInput.value = '';
            apiKeyInput.type = 'password';
            
            // Add focus handler to clear placeholder when user starts typing
            apiKeyInput.addEventListener('focus', () => {
                if (apiKeyInput.value === '') {
                    apiKeyInput.placeholder = 'Enter your Gemini API key';
                }
            });
        } else {
            apiKeyInput.value = '';
            apiKeyInput.type = 'password';
            apiKeyInput.placeholder = 'Enter your Gemini API key';
        }
    }

    // Load model
    const model = await getGeminiModel();
    const modelSelect = document.getElementById('gemini-model');
    if (modelSelect) {
        modelSelect.value = model;
    }
}

/**
 * Handle API key save
 */
async function handleSaveApiKey() {
    const apiKeyInput = document.getElementById('gemini-api-key');
    const statusDiv = document.getElementById('gemini-status');
    
    if (!apiKeyInput) return;

    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        // Check if there's a saved key
        const savedKey = await getGeminiApiKey();
        if (savedKey) {
            showStatus('API key already saved. Enter a new key to update.', 'info');
            return;
        }
        showStatus('Please enter an API key', 'error');
        return;
    }

    // Show loading
    showStatus('Testing API key...', 'info');
    
    // Test the API key
    const modelSelect = document.getElementById('gemini-model');
    const model = modelSelect ? modelSelect.value : 'gemini-2.0-flash';
    
    try {
        const result = await testApiKey(apiKey, model);
        
        if (result.valid) {
            await saveGeminiApiKey(apiKey);
            // Clear the input and show masked placeholder
            apiKeyInput.value = '';
            apiKeyInput.placeholder = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) + ' (click to change)';
            apiKeyInput.type = 'password';
            showStatus('API key saved successfully!', 'success');
        } else {
            const errorMsg = result.error || 'Invalid API key or model. Please check your API key and model selection.';
            showStatus(errorMsg, 'error');
        }
    } catch (error) {
        console.error('[Gemini Settings] Error testing API key:', error);
        showStatus(`Error: ${error.message || 'Failed to validate API key'}`, 'error');
    }
}

/**
 * Handle model selection change
 */
async function handleModelChange() {
    const modelSelect = document.getElementById('gemini-model');
    if (!modelSelect) return;

    const model = modelSelect.value;
    await saveGeminiModel(model);
    showStatus('Model updated successfully!', 'success');
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('gemini-status');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // Set color based on type
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

    // Auto-hide after 3 seconds for success/info
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

