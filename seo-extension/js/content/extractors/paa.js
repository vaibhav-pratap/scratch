/**
 * People Also Ask extractor module
 * Extracts PAA questions from Google SERP
 */

/**
 * Get People Also Ask questions
 */
export function getPAA() {
    const paaElements = document.querySelectorAll('[data-q], .related-question-pair, .related-question');
    const questions = [];
    paaElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length < 200 && text.includes('?')) {
            questions.push(text);
        }
    });
    return questions;
}
