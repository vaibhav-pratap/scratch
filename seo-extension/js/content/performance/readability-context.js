/**
 * Readability Context Module
 * Manages scoring thresholds based on target audience
 */

export const AUDIENCE_TYPES = {
    GENERAL: 'general',
    PROFESSIONAL: 'professional',
    ACADEMIC: 'academic'
};

const THRESHOLDS = {
    [AUDIENCE_TYPES.GENERAL]: {
        fleschMin: 60, // Standard readable
        sentenceLengthMax: 20,
        paragraphLengthMax: 150,
        passiveMax: 10,
        description: "General Audience (Standard Web Content)"
    },
    [AUDIENCE_TYPES.PROFESSIONAL]: {
        fleschMin: 50, // Slightly more complex allowed
        sentenceLengthMax: 25,
        paragraphLengthMax: 200,
        passiveMax: 15,
        description: "Professional / Business Audience"
    },
    [AUDIENCE_TYPES.ACADEMIC]: {
        fleschMin: 30, // Much more complex allowed
        sentenceLengthMax: 30,
        paragraphLengthMax: 250,
        passiveMax: 20,
        description: "Academic / Technical Audience"
    }
};

/**
 * Get thresholds for a specific audience
 * @param {string} audience - One of AUDIENCE_TYPES
 */
export function getThresholds(audience = AUDIENCE_TYPES.GENERAL) {
    return THRESHOLDS[audience] || THRESHOLDS[AUDIENCE_TYPES.GENERAL];
}

/**
 * Convert raw score to qualitative status based on context
 */
export function getScoreStatus(score, metric, audience = AUDIENCE_TYPES.GENERAL) {
    const limits = getThresholds(audience);
    
    switch (metric) {
        case 'flesch':
            if (score >= limits.fleschMin) return 'good';
            if (score >= limits.fleschMin - 10) return 'warning';
            return 'poor';
            
        case 'sentenceLength':
            if (score <= limits.sentenceLengthMax) return 'good';
            if (score <= limits.sentenceLengthMax + 5) return 'warning';
            return 'poor';

        case 'paragraphLength':
            if (score <= limits.paragraphLengthMax) return 'good';
            if (score <= limits.paragraphLengthMax + 50) return 'warning';
            return 'poor';

        case 'passive':
            if (score <= limits.passiveMax) return 'good';
            if (score <= limits.passiveMax + 10) return 'warning';
            return 'poor';
            
        default:
            return 'neutral';
    }
}
