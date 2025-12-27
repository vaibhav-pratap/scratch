/**
 * Hashtag Utility Module
 * Handles hashtag extraction and processing
 */

/**
 * Extract all hashtags from text
 * @param {string} text - Input text
 * @returns {string[]} Array of hashtags (without #)
 */
export function extractHashtags(text) {
    const regex = /#(\w+)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

/**
 * Remove hashtags from text
 * @param {string} text - Input text
 * @returns {string} Text with hashtags removed
 */
export function removeHashtags(text) {
    return text.replace(/#\w+/g, '').trim().replace(/\s+/g, ' ');
}

/**
 * Process hashtags from input text
 * Returns cleaned text and extracted hashtags
 * @param {string} text - Input text
 * @returns {{cleanedText: string, hashtags: string[]}}
 */
export function processHashtags(text) {
    const hashtags = extractHashtags(text);
    const cleanedText = removeHashtags(text);
    return { cleanedText, hashtags };
}
