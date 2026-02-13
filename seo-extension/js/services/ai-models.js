/**
 * AI Models Registry
 * Centralized registry for all supported AI models across providers
 */

export const AI_PROVIDERS = {
    GEMINI: 'gemini',
};

export const AI_MODELS = [
    // Google Gemini Models (Comprehensive List)
    { provider: 'gemini', value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-2.0-flash-thinking-exp-1219', label: 'Gemini 2.0 Flash Thinking (Exp)', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (Latest)', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-1.5-pro-002', label: 'Gemini 1.5 Pro 002', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Latest)', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-1.5-flash-002', label: 'Gemini 1.5 Flash 002', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-1.5-flash-8b-latest', label: 'Gemini 1.5 Flash 8B (Latest)', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-pro', label: 'Gemini Pro', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-pro-vision', label: 'Gemini Pro Vision', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-exp-1206', label: 'Gemini Experimental 1206', icon: 'sparkles' },
    { provider: 'gemini', value: 'gemini-exp-1121', label: 'Gemini Experimental 1121', icon: 'sparkles' },

];

export const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Get model by value
 */
export function getModelById(modelId) {
    return AI_MODELS.find(m => m.value === modelId);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider) {
    return AI_MODELS.filter(m => m.provider === provider);
}

/**
 * Get provider for a model
 */
export function getProviderForModel(modelId) {
    const model = getModelById(modelId);
    return model ? model.provider : null;
}
