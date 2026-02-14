/**
 * Readability Utilities
 * Shared helper functions for text analysis
 */

/**
 * Advanced NLP-style text segmentation using Intl.Segmenter
 */
export function segmentText(text) {
    const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    const wordSegmenter = new Intl.Segmenter('en', { granularity: 'word' });

    const sentences = [...sentenceSegmenter.segment(text)]
        .map(s => s.segment.trim())
        .filter(s => s.length > 1);
    
    // For word counting, we want to filter out punctuation only segments
    const words = [...wordSegmenter.segment(text)]
        .filter(s => s.isWordLike)
        .map(w => w.segment);

    return { sentences, words };
}

/**
 * Count syllables in a word (improved algorithm)
 */
export function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    // Handle silent 'e' at the end
    if (word.endsWith('e')) {
        word = word.slice(0, -1);
    }

    // Count vowel groups
    const vowels = word.match(/[aeiouy]+/g);
    if (!vowels) return 1;

    let count = vowels.length;

    // Adjust for common patterns
    if (word.endsWith('le') && word.length > 2) {
        count++;
    }

    return Math.max(1, count);
}

/**
 * Common passive voice indicators
 */
const PASSIVE_INDICATORS = [
    /\b(am|is|are|was|were|be|been|being)\s+\w+ed\b/gi,
    /\b(am|is|are|was|were|be|been|being)\s+\w+en\b/gi,
    /\b(get|gets|got|gotten)\s+\w+ed\b/gi,
    /\b(get|gets|got|gotten)\s+\w+en\b/gi
];

/**
 * Detect passive voice in a sentence
 */
export function isPassiveVoice(sentence) {
    const lowerSentence = sentence.toLowerCase();

    // Check for passive voice patterns
    for (const pattern of PASSIVE_INDICATORS) {
        if (pattern.test(sentence)) {
            return true;
        }
    }

    // Check for "by [noun]" pattern which often indicates passive
    if (/\bby\s+[a-z]+\b/i.test(sentence)) {
        // But exclude common phrases like "by the way", "by now", etc.
        const excludePhrases = ['by the way', 'by now', 'by far', 'by and large', 'by all means'];
        const hasExclude = excludePhrases.some(phrase => lowerSentence.includes(phrase));
        if (!hasExclude && /\b(was|were|is|are|been)\s+\w+ed\s+by\b/i.test(sentence)) {
            return true;
        }
    }
    return false;
}

/**
 * Calculate Flesch Reading Ease for a text block
 */
export function calculateFleschScore(text) {
    const { sentences, words } = segmentText(text);
    
    if (sentences.length === 0 || words.length === 0) return 0;

    let syllables = 0;
    words.forEach(word => {
        syllables += countSyllables(word);
    });

    const score = Math.round(
        206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
    );

    return Math.max(0, Math.min(100, score));
}
