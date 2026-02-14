/**
 * Advanced Readability Calculator Module
 * Yoast-style comprehensive content analysis including:
 * - Flesch Reading Ease Score
 * - Flesch-Kincaid Grade Level
 * - Coleman-Liau Index
 * - LIX Readability Formula
 * - Active vs Passive Voice
 * - Transitional words/sentences
 * - Sentence and paragraph analysis
 * - LEXICAL SIMPLIFICATION (Complex word suggestions)
 * - NEW: Paragraph Heatmap & Readability Flow
 */

// Utility Modules
import { segmentText, countSyllables, calculateFleschScore, isPassiveVoice } from './readability-utils.js';
import { generateHeatmapData } from './readability-heatmap.js';
import { generateFlowData } from './readability-flow.js';
import { getThresholds, getScoreStatus } from './readability-context.js';

// v4 Expansion Modules
import { analyzeSentiment } from './sentiment.js';
import { checkInclusivity } from './inclusive.js';
import { generateKeywordHeatmap } from './keyword-density.js';

/**
 * Common passive voice indicators
 */


/**
 * Common transitional words and phrases
 * Comprehensive list covering all major categories
 */
const TRANSITIONAL_WORDS = [
    // Addition/Agreement
    'additionally', 'also', 'and', 'besides', 'coupled with', 'furthermore',
    'in addition', 'likewise', 'moreover', 'similarly', 'equally important',
    'as well as', 'together with', 'not to mention', 'to say nothing of',
    'not only', 'but also', 'in the same way', 'by the same token',

    // Contrast/Opposition
    'although', 'but', 'conversely', 'despite', 'even though', 'however',
    'in contrast', 'in spite of', 'nevertheless', 'nonetheless', 'notwithstanding',
    'on the contrary', 'on the other hand', 'otherwise', 'rather', 'still',
    'though', 'yet', 'while', 'whereas', 'even so', 'be that as it may',
    'in reality', 'at the same time', 'different from', 'of course',

    // Cause and Effect/Consequence
    'accordingly', 'as a result', 'because', 'consequently', 'due to', 'for',
    'for this reason', 'hence', 'since', 'so', 'therefore', 'thus',
    'then', 'it follows that', 'under those circumstances', 'in that case',
    'for that reason', 'in effect', 'as a consequence', 'with this in mind',

    // Sequence/Time
    'after', 'afterward', 'at this time', 'before', 'concurrently', 'currently',
    'during', 'eventually', 'finally', 'first', 'second', 'third', 'fourth',
    'following', 'formerly', 'immediately', 'initially', 'lastly', 'later',
    'meanwhile', 'next', 'now', 'once', 'previously', 'simultaneously', 'soon',
    'subsequently', 'then', 'thereafter', 'until', 'when', 'whenever',
    'at last', 'in the meantime', 'in the interim', 'at first', 'at once',
    'in the end', 'at length', 'at this point', 'prior to', 'straight away',
    'starting with',

    // Example/Illustration
    'as an illustration', 'as shown by', 'by way of illustration', 'for example',
    'for instance', 'in other words', 'in particular', 'namely', 'put differently',
    'specifically', 'such as', 'that is', 'to demonstrate', 'to illustrate',
    'to put it another way', 'to show that', 'as revealed by', 'in this case',
    'take the case of', 'for one thing', 'as proof', 'like',

    // Emphasis/Clarification
    'above all', 'certainly', 'especially', 'importantly', 'in fact',
    'indeed', 'notably', 'particularly', 'primarily', 'specifically',
    'surely', 'truly', 'undoubtedly', 'unquestionably', 'without doubt',
    'most importantly', 'more specifically', 'to emphasize', 'to repeat',
    'to clarify', 'with attention to', 'chiefly', 'mainly', 'actually',

    // Summary/Conclusion/Restatement
    'all in all', 'all things considered', 'altogether', 'as a final point',
    'as has been noted', 'as I have said', 'as mentioned', 'as shown',
    'briefly', 'by and large', 'given these points', 'in any case',
    'in any event', 'in brief', 'in conclusion', 'in essence', 'in short',
    'in sum', 'in summary', 'in the final analysis', 'in the long run',
    'on balance', 'on the whole', 'overall', 'so', 'summing up',
    'therefore', 'thus', 'to conclude', 'to summarize', 'ultimately',
    'as can be seen', 'for the most part', 'as stated', 'given all this',
    'to sum up', 'wrapping up',

    // Comparison/Similarity  
    'compared to', 'likewise', 'same as', 'similar to', 'similarly',
    'in the same fashion', 'in the same way', 'just as', 'just like',
    'equally', 'by comparison', 'in like manner', 'in a similar way',

    // Place/Position
    'above', 'adjacent to', 'below', 'beyond', 'elsewhere', 'farther on',
    'here', 'nearby', 'opposite to', 'there', 'to the left', 'to the right',
    'in the distance', 'in the foreground', 'in the background',

    // Concession/Qualification
    'admittedly', 'albeit', 'although', 'even though', 'granted that',
    'naturally', 'of course', 'though', 'while it may be true'
];

/**
 * Map of complex words to simpler alternatives
 * "Plain English" suggestions
 */
const COMPLEX_WORDS_MAP = {
    'accordingly': 'so',
    'additional': 'extra',
    'additionally': 'also',
    'advantageous': 'helpful',
    'ameliorate': 'improve / help',
    'approximately': 'about',
    'attempt': 'try',
    'assistance': 'help',
    'beneficial': 'helpful / good',
    'capability': 'ability',
    'cognizant': 'aware',
    'commence': 'start',
    'component': 'part',
    'concerning': 'about',
    'consequently': 'so',
    'consolidate': 'join / merge',
    'constitutes': 'is / forms',
    'demonstrate': 'show',
    'depart': 'leave',
    'designate': 'choose / name',
    'discontinue': 'stop',
    'due to the fact that': 'because',
    'eliminate': 'remove',
    'elucidate': 'explain',
    'employ': 'use',
    'endeavor': 'try',
    'equivalent': 'equal',
    'establish': 'set up / prove',
    'evident': 'clear',
    'exclusively': 'only',
    'expedite': 'hurry',
    'facilitate': 'help / make easy',
    'feasible': 'possible',
    'frequently': 'often',
    'fundamental': 'basic',
    'generate': 'make / create',
    'henceforth': 'from now on',
    'identical': 'same',
    'illustrate': 'show',
    'immediately': 'at once',
    'implement': 'do / set up',
    'in accordance with': 'by / under',
    'in addition': 'also',
    'in close proximity': 'near',
    'inadvertently': 'by mistake',
    'inception': 'start',
    'incumbent upon': 'up to',
    'indicate': 'show',
    'indication': 'sign',
    'initial': 'first',
    'initiate': 'start',
    'inquire': 'ask',
    'leverage': 'use',
    'location': 'place',
    'magnitude': 'size',
    'maintain': 'keep',
    'maximum': 'most',
    'methodology': 'method',
    'modify': 'change',
    'monitor': 'check / watch',
    'multiple': 'many',
    'necessitate': 'need',
    'nevertheless': 'but / however',
    'notify': 'tell',
    'numerous': 'many',
    'objective': 'goal / aim',
    'obligate': 'bind / force',
    'obtain': 'get',
    'participate': 'take part',
    'pertain': 'relate',
    'portion': 'part',
    'possess': 'have',
    'preclude': 'prevent',
    'primary': 'main',
    'prior to': 'before',
    'proficiency': 'skill',
    'provide': 'give',
    'purchase': 'buy',
    'regarding': 'about',
    'relinquish': 'give up',
    'remainder': 'rest',
    'remuneration': 'pay',
    'request': 'ask',
    'require': 'need',
    'reside': 'live',
    'retain': 'keep',
    'selection': 'choice',
    'subsequently': 'later',
    'substantial': 'large / big',
    'sufficient': 'enough',
    'terminate': 'end / stop',
    'therefore': 'so',
    'transmit': 'send',
    'transpire': 'happen',
    'ultimate': 'final',
    'unavailability': 'lack',
    'utilize': 'use',
    'validation': 'proof',
    'verify': 'check',
    'viability': 'chance',
    'virtually': 'almost',
    'visualize': 'see / imagine',
    'warrant': 'justify',
    'whereas': 'but',
    'witnessed': 'saw'
};

/**
 * Extract main content from page (exclude nav, footer, etc.)
 */
function extractMainContent() {
    // Try to find main content areas
    const mainSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.main-content',
        '#content',
        '#main'
    ];

    let content = '';

    for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            content = element.innerText || element.textContent || '';
            if (content.length > 200) break; // Found substantial content
        }
    }

    // Fallback to body if no main content found
    if (!content || content.length < 200) {
        // Remove common non-content elements
        const bodyClone = document.body.cloneNode(true);
        const elementsToRemove = bodyClone.querySelectorAll('nav, footer, header, script, style, noscript, iframe, .nav, .footer, .header, .sidebar, .menu');
        elementsToRemove.forEach(el => el.remove());
        content = bodyClone.innerText || bodyClone.textContent || '';
    }

    return content.trim();
}

/**
 * Count transitional words in text
 */
function countTransitionalWords(text) {
    const lowerText = text.toLowerCase();
    let count = 0;
    const found = [];

    TRANSITIONAL_WORDS.forEach(word => {
        // Use word boundaries to match whole words only
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
            count += matches.length;
            found.push(word);
        }
    });

    return { count, found: [...new Set(found)] };
}

/**
 * Identify complex words and their replacements
 */
function identifyComplexWords(words) {
    const findings = [];
    const complexWordSet = new Set(Object.keys(COMPLEX_WORDS_MAP));

    words.forEach(word => {
        const lowerWord = word.toLowerCase();
        if (complexWordSet.has(lowerWord)) {
            findings.push({
                word: word,
                suggestion: COMPLEX_WORDS_MAP[lowerWord]
            });
        }
    });

    return [...new Set(findings.map(JSON.stringify))].map(JSON.parse); // Unique findings
}

/**
 * Analyze sentence structure
 */
function analyzeSentences(sentences) {
    const analysis = {
        total: sentences.length,
        averageLength: 0,
        longSentences: 0, // > 20 words
        veryLongSentences: 0, // > 25 words
        shortSentences: 0, // < 10 words
        consecutiveSameStart: 0,
        sentenceStarts: {}
    };

    if (sentences.length === 0) return analysis;

    let totalWords = 0;
    let previousStart = '';
    let consecutiveCount = 0;

    const wordSegmenter = new Intl.Segmenter('en', { granularity: 'word' });

    sentences.forEach((sentence, index) => {
        // Use Intl.Segmenter for accurate word count in sentences
        const words = [...wordSegmenter.segment(sentence)].filter(s => s.isWordLike).map(s => s.segment);
        const wordCount = words.length;
        totalWords += wordCount;

        // Categorize sentence length
        if (wordCount > 25) analysis.veryLongSentences++;
        else if (wordCount > 20) analysis.longSentences++;
        else if (wordCount < 10) analysis.shortSentences++;

        // Check for consecutive sentences starting with same word
        if (words.length > 0) {
            const firstWord = words[0].toLowerCase();
            if (firstWord && firstWord === previousStart && firstWord.length > 2) {
                consecutiveCount++;
            } else {
                if (consecutiveCount >= 2) {
                    analysis.consecutiveSameStart += consecutiveCount;
                }
                consecutiveCount = 1;
            }
            previousStart = firstWord;

            // Track sentence starts
            if (firstWord) {
                analysis.sentenceStarts[firstWord] = (analysis.sentenceStarts[firstWord] || 0) + 1;
            }
        }
    });

    if (consecutiveCount >= 2) {
        analysis.consecutiveSameStart += consecutiveCount;
    }

    analysis.averageLength = Math.round(totalWords / sentences.length);

    return analysis;
}

/**
 * Analyze paragraphs
 */
function analyzeParagraphs(text) {
    // Split by double newlines or paragraph tags
    const paragraphs = text.split(/\n\s*\n|<\/p>\s*<p>/).filter(p => p.trim().length > 0);

    const analysis = {
        total: paragraphs.length,
        averageLength: 0,
        longParagraphs: 0, // > 150 words
        shortParagraphs: 0 // < 50 words
    };

    if (paragraphs.length === 0) return analysis;

    let totalWords = 0;
    const wordSegmenter = new Intl.Segmenter('en', { granularity: 'word' });

    paragraphs.forEach(para => {
        const words = [...wordSegmenter.segment(para)].filter(s => s.isWordLike);
        const wordCount = words.length;
        totalWords += wordCount;

        if (wordCount > 150) analysis.longParagraphs++;
        else if (wordCount < 50) analysis.shortParagraphs++;
    });

    analysis.averageLength = Math.round(totalWords / paragraphs.length);

    return analysis;
}

/**
 * Advanced Readability Calculator
 * Now includes Sentiment, Inclusivity, and Keyword Density (v4)
 */
export function calculateReadability(audience = 'general', keywords = []) {
    try {
        const content = extractMainContent();

        if (!content || content.length < 50) {
            return {
                score: 0,
                level: 'N/A',
                error: 'Insufficient content to analyze'
            };
        }

        // --- Use Shared Utils ---
        const { sentences, words } = segmentText(content);
        const paragraphs = content.split(/\n\s*\n|<\/p>\s*<p>/).filter(p => p.trim().length > 0);

        if (sentences.length === 0 || words.length === 0) {
            return {
                score: 0,
                level: 'N/A',
                error: 'No readable content found'
            };
        }

        // --- Calculate Core Metrics ---
        let syllables = 0;
        let charCount = 0;
        let longWordsLIX = 0; // Words > 6 letters

        words.forEach(word => {
            syllables += countSyllables(word);
            charCount += word.length;
            if (word.length > 6) longWordsLIX++;
        });

        const fleschScore = Math.round(
            206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
        );

        // Flesch-Kincaid Grade
        const fleschResultResult = (0.39 * (words.length / sentences.length)) + (11.8 * (syllables / words.length)) - 15.59;
        const fleschKincaidGrade = Math.max(0, Math.round(fleschResultResult * 10) / 10);

        // Coleman-Liau
        const L = (charCount / words.length) * 100;
        const S = (sentences.length / words.length) * 100;
        const colemanLiauIndex = Math.round((0.0588 * L - 0.296 * S - 15.8) * 10) / 10;

        // LIX
        const lixScore = Math.round((words.length / sentences.length) + ((longWordsLIX / words.length) * 100));

        // --- Advanced Analysis ---
        const difficultWords = words.filter(w => countSyllables(w) >= 3);
        const difficultWordsPercentage = Math.round((difficultWords.length / words.length) * 100);
        const simplificationSuggestions = identifyComplexWords(words);
        
        // --- NEW: Context-Aware Scores via Heatmap & Flow ---
        const heatmap = generateHeatmapData(content, audience);
        const flowData = generateFlowData(content);

        // --- NEW (v4): Content Analysis Expansion ---
        const sentiment = analyzeSentiment(content);
        const inclusivity = checkInclusivity(content);
        const keywordData = generateKeywordHeatmap(content, keywords);

        const wordCount = words.length;
        const sentenceCount = sentences.length;
        // Determine Grade Level Description
        let level = 'Very Difficult';
        if (fleschScore >= 90) level = 'Very Easy (5th grade)';
        else if (fleschScore >= 80) level = 'Easy (6th grade)';
        else if (fleschScore >= 70) level = 'Fairly Easy (7th grade)';
        else if (fleschScore >= 60) level = 'Standard (8th-9th grade)';
        else if (fleschScore >= 50) level = 'Fairly Difficult (10th-12th grade)';
        else if (fleschScore >= 30) level = 'Difficult (College)';
        else level = 'Very Difficult (Professional)';

        // Analyze specific patterns
        const passiveSentences = sentences.filter(s => isPassiveVoice(s));
        const passivePercentage = Math.round((passiveSentences.length / sentences.length) * 100);

        const transitional = countTransitionalWords(content);
        const transitionalPercentage = Math.round((transitional.count / sentences.length) * 100);

        const sentencesWithoutTransitions = sentences.filter(sentence => {
            const lowerSentence = sentence.toLowerCase();
            return !TRANSITIONAL_WORDS.some(word => {
                const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                return regex.test(sentence);
            });
        });

        // Sentence & Paragraph Analysis
        const sentenceAnalysis = analyzeSentences(sentences);
        const wordSegmenter = new Intl.Segmenter('en', { granularity: 'word' });
        
        const longSentencesList = sentences.filter(sentence => {
            const wordCount = [...wordSegmenter.segment(sentence)].filter(s => s.isWordLike).length;
            return wordCount > 20;
        });
        const veryLongSentencesList = sentences.filter(sentence => {
            const wordCount = [...wordSegmenter.segment(sentence)].filter(s => s.isWordLike).length;
            return wordCount > 25;
        });

        const paragraphAnalysis = analyzeParagraphs(content);
        const longParagraphsList = paragraphs.filter(para => {
             const wordCount = [...wordSegmenter.segment(para)].filter(s => s.isWordLike).length;
            return wordCount > 150;
        });

        // Calculate Overall Score (with basic heuristics)
        let overallScore = fleschScore;
        if (passivePercentage > 25) overallScore -= 10;
        else if (passivePercentage > 15) overallScore -= 5;

        const longSentencePercentage = (sentenceAnalysis.longSentences / sentences.length) * 100;
        if (longSentencePercentage > 25) overallScore -= 10;
        else if (longSentencePercentage > 15) overallScore -= 5;

        if (difficultWordsPercentage > 15) overallScore -= 5;
        if (transitionalPercentage >= 30) overallScore += 5;
        else if (transitionalPercentage >= 20) overallScore += 3;
        if (sentenceAnalysis.consecutiveSameStart > 3) overallScore -= 5;

        overallScore = Math.max(0, Math.min(100, overallScore));
        
        const thresholds = getThresholds(audience);

        return {
            // Overall scores
            score: overallScore,
            fleschScore: fleschScore,
            fleschKincaidGrade: fleschKincaidGrade, 
            colemanLiauIndex: colemanLiauIndex,
            lixScore: lixScore,
            level: level,

            // Basic metrics
            wordCount: words.length,
            sentenceCount: sentences.length,
            paragraphCount: paragraphAnalysis.total,
            averageWordsPerSentence: Math.round(words.length / sentences.length),
            averageSentencesPerParagraph: Math.round(sentences.length / paragraphAnalysis.total),
            readingTimeMinutes: Math.ceil(words.length / 200),

            // Advanced Text Stats
            difficultWords: difficultWords.length,
            difficultWordsPercentage: difficultWordsPercentage,
            simplificationSuggestions: simplificationSuggestions,
            
            // NEW: Heatmap & Flow
            heatmap: heatmap,
            flow: flowData,
            
            // v4 Data
            sentiment: sentiment,
            inclusivity: inclusivity,
            keywordDensity: keywordData,

            // Voice analysis
            passiveVoice: {
                count: passiveSentences.length,
                percentage: passivePercentage,
                status: getScoreStatus(passivePercentage, 'passive', audience),
                sentences: passiveSentences.map(s => s.trim())
            },

            // Transitional words
            transitionalWords: {
                count: transitional.count,
                percentage: transitionalPercentage,
                status: transitionalPercentage > 30 ? 'good' : (transitionalPercentage > 20 ? 'warning' : 'poor'), // Custom logic
                found: transitional.found.slice(0, 10),
                sentencesWithout: sentencesWithoutTransitions.map(s => s.trim())
            },

            // Sentence analysis
            sentences: {
                averageLength: sentenceAnalysis.averageLength,
                longSentences: sentenceAnalysis.longSentences,
                longSentencesList: longSentencesList.map(s => s.trim()),
                veryLongSentences: sentenceAnalysis.veryLongSentences,
                veryLongSentencesList: veryLongSentencesList.map(s => s.trim()),
                shortSentences: sentenceAnalysis.shortSentences,
                consecutiveSameStart: sentenceAnalysis.consecutiveSameStart,
                status: getScoreStatus(sentenceAnalysis.averageLength, 'sentenceLength', audience)
            },

            // Paragraph analysis
            paragraphs: {
                averageLength: paragraphAnalysis.averageLength,
                longParagraphs: paragraphAnalysis.longParagraphs,
                longParagraphsList: longParagraphsList.map(p => p.trim()),
                shortParagraphs: paragraphAnalysis.shortParagraphs,
                status: getScoreStatus(paragraphAnalysis.averageLength, 'paragraphLength', audience)
            },

            // Recommendations
            recommendations: generateRecommendations({
                fleschScore,
                fleschKincaidGrade,
                colemanLiauIndex,
                lixScore,
                passivePercentage,
                transitionalPercentage,
                sentenceAnalysis,
                paragraphAnalysis,
                difficultWordsPercentage,
                simplificationCount: simplificationSuggestions.length,
                thresholds
            })
        };
    } catch (error) {
        console.error('[Readability] Error calculating:', error);
        return {
            score: 0,
            level: 'Error',
            error: error.message
        };
    }
}

/**
 * Generate recommendations based on analysis & audience thresholds
 */
function generateRecommendations(analysis) {
    const recommendations = [];

    const { 
        fleschScore, 
        fleschKincaidGrade, 
        colemanLiauIndex,
        lixScore,
        passivePercentage, 
        transitionalPercentage, 
        sentenceAnalysis, 
        paragraphAnalysis, 
        difficultWordsPercentage,
        simplificationCount,
        thresholds
    } = analysis;

    // Flesch Score
    if (fleschScore < thresholds.fleschMin) {
        recommendations.push({
            type: 'error',
            message: `Flesch Reading Ease is ${fleschScore}. Aim for at least ${thresholds.fleschMin} for your audience.`
        });
    }

    // Flesch-Kincaid Grade recommendations
    if (fleschKincaidGrade > 12) {
        recommendations.push({
            type: 'warning',
            message: `Reading grade level is ${fleschKincaidGrade} (College level).`
        });
    }

    // Coleman-Liau Check
    if (colemanLiauIndex > 14) {
         recommendations.push({
            type: 'warning',
            message: `Coleman-Liau Index is ${colemanLiauIndex}, indicating complex character usage.`
        });
    }

    // LIX Check
    if (lixScore > 50) {
         recommendations.push({
            type: 'warning',
            message: `LIX score is ${lixScore}. Sentences may be too long or use too many long words.`
        });
    }

    // Word Complexity
    if (simplificationCount > 0) {
        recommendations.push({
            type: 'warning',
            message: `Found ${simplificationCount} complex words to simplify.`
        });
    }

    // Passive voice recommendations
    if (passivePercentage > thresholds.passiveMax) {
        recommendations.push({
            type: 'error',
            message: `${passivePercentage}% passive voice. Aim for < ${thresholds.passiveMax}%.`
        });
    } 

    // Sentence length recommendations
    if (sentenceAnalysis.averageLength > thresholds.sentenceLengthMax) {
        recommendations.push({
            type: 'error',
            message: `Average sentence length is ${sentenceAnalysis.averageLength} words. Aim for < ${thresholds.sentenceLengthMax}.`
        });
    }

    // Consecutive same starts
    if (sentenceAnalysis.consecutiveSameStart > 3) {
        recommendations.push({
            type: 'warning',
            message: `${sentenceAnalysis.consecutiveSameStart} consecutive sentences start with the same word.`
        });
    }

    // Transitional words
    if (transitionalPercentage < 20) {
        recommendations.push({
            type: 'warning',
            message: `Only ${transitionalPercentage}% transition words. Aim for 20-30%.`
        });
    }

    return recommendations;
}
