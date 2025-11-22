/**
 * Readability calculator module
 * Calculates Flesch reading ease score
 */

/**
 * Count syllables in a word
 */
function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    const vowels = word.match(/[aeiouy]+/g);
    return vowels ? vowels.length : 1;
}

/**
 * Calculate readability using Flesch Reading Ease
 */
export function calculateReadability() {
    const text = document.body.innerText || '';
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);

    if (sentences.length === 0 || words.length === 0) {
        return { score: 0, level: 'N/A' };
    }

    let syllables = 0;
    words.forEach(word => {
        syllables += countSyllables(word);
    });

    // Flesch Reading Ease: 206.835 - 1.015(total words / total sentences) - 84.6(total syllables / total words)
    const score = Math.round(
        206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
    );

    let level = 'Very Difficult';
    if (score >= 90) level = 'Very Easy';
    else if (score >= 80) level = 'Easy';
    else if (score >= 70) level = 'Fairly Easy';
    else if (score >= 60) level = 'Standard';
    else if (score >= 50) level = 'Fairly Difficult';
    else if (score >= 30) level = 'Difficult';

    return { score, level };
}
