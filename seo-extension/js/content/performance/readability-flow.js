/**
 * Readability Flow Module
 * Generates data for a readability flow graph (score over text position)
 */

import { calculateFleschScore, segmentText, isPassiveVoice, countSyllables } from './readability-utils.js';

/**
 * Generate flow data
 * Calculates readability for sliding windows of sentences
 */
export function generateFlowData(content, windowSize = 3) {
    const { sentences, words } = segmentText(content);
    const flowData = [];

    if (sentences.length < windowSize) {
        // Not enough content for flow, return single point
        return [{ x: 0, y: calculateFleschScore(content), snippet: content.substring(0, 50) + '...', errors: 0 }];
    }

    // Sliding window analysis
    for (let i = 0; i <= sentences.length - windowSize; i++) {
        const windowSentences = sentences.slice(i, i + windowSize);
        const windowText = windowSentences.join(' ');
        const score = calculateFleschScore(windowText);
        
        // Calculate metrics for this window
        let errorCount = 0;
        let complexWords = 0;
        
        windowSentences.forEach(s => {
            if (isPassiveVoice(s)) errorCount++;
            
            // Check for complex words > 3 syllables
            const sWords = s.split(/\s+/); // crude split for speed
            sWords.forEach(w => {
                 if (countSyllables(w) >= 3) complexWords++;
            });
        });

        const totalErrors = errorCount + (complexWords > 5 ? 1 : 0); // Weighted
        const wordCount = windowText.split(/\s+/).length;
        const timeSec = Math.round((wordCount / 200) * 60);

        flowData.push({
            x: Math.round((i / (sentences.length - windowSize)) * 100), // Percentage position
            y: score,
            snippet: windowSentences[0].substring(0, 40) + '...', // Context for tooltip
            errors: totalErrors,
            time: timeSec,
            complex: complexWords
        });
    }

    return flowData;
}
