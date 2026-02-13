/**
 * AI Router Module
 * Routes chat requests to the appropriate AI provider based on model selection
 */

import { getModelById, AI_PROVIDERS } from './ai-models.js';
import * as gemini from './gemini.js';

/**
 * Send a chat message to the appropriate AI provider
 * @param {Array} history - Chat history in Gemini format
 * @param {string} modelId - Model ID to use
 * @returns {Promise<string>} - The model's response text
 */
export async function sendChatMessage(history, modelId) {
    const model = getModelById(modelId);

    if (!model) {
        throw new Error(`Unknown model: ${modelId}`);
    }

    console.log(`[AI Router] Routing to ${model.provider} for model ${modelId}`);

    try {
        if (model.provider === AI_PROVIDERS.GEMINI) {
            return await gemini.sendChatMessage(history, modelId);
        } else {
            throw new Error(`Unsupported provider: ${model.provider}`);
        }
    } catch (error) {
        console.error(`[AI Router] Error with ${model.provider}:`, error);
        throw error;
    }
}

/**
 * Test API key for a specific provider
 * @param {string} provider - Provider name ('gemini')
 * @param {string} apiKey - API key to test
 * @param {string} modelId - Model to test with
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function testApiKey(provider, apiKey, modelId) {
    try {
        if (provider === AI_PROVIDERS.GEMINI) {
            return await gemini.testApiKey(apiKey, modelId);
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }
    } catch (error) {
        console.error(`[AI Router] Error testing ${provider} key:`, error);
        return {
            valid: false,
            error: error.message || 'Failed to validate API key'
        };
    }
}

/**
 * Check if API key is configured for a provider
 * @param {string} provider - Provider name
 * @returns {Promise<boolean>}
 */
export async function hasApiKey(provider) {
    try {
        if (provider === AI_PROVIDERS.GEMINI) {
            const key = await gemini.getGeminiApiKey();
            return !!key;
        }
        return false;
    } catch (error) {
        console.error(`[AI Router] Error checking ${provider} key:`, error);
        return false;
    }
}
