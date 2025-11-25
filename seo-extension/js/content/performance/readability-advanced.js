/**
 * Advanced Readability Calculator Module
 * Yoast-style comprehensive content analysis including:
 * - Flesch Reading Ease Score
 * - Active vs Passive Voice
 * - Transitional words/sentences
 * - Sentence and paragraph analysis
 * - Subheading distribution
 * - Content structure analysis
 */

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
 * Common transitional words and phrases
 */
const TRANSITIONAL_WORDS = [
    'however', 'therefore', 'moreover', 'furthermore', 'additionally', 'consequently',
    'nevertheless', 'nonetheless', 'meanwhile', 'subsequently', 'accordingly', 'hence',
    'thus', 'indeed', 'specifically', 'particularly', 'especially', 'notably',
    'for example', 'for instance', 'in addition', 'in fact', 'in other words',
    'on the other hand', 'on the contrary', 'as a result', 'in conclusion',
    'to summarize', 'in summary', 'first', 'second', 'third', 'finally',
    'next', 'then', 'afterward', 'previously', 'initially', 'ultimately',
    'also', 'besides', 'further', 'likewise', 'similarly', 'conversely'
];

/**
 * Count syllables in a word (improved algorithm)
 */
function countSyllables(word) {
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
 * Detect passive voice in a sentence
 */
function isPassiveVoice(sentence) {
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
    
    sentences.forEach((sentence, index) => {
        const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        totalWords += wordCount;
        
        // Categorize sentence length
        if (wordCount > 25) analysis.veryLongSentences++;
        else if (wordCount > 20) analysis.longSentences++;
        else if (wordCount < 10) analysis.shortSentences++;
        
        // Check for consecutive sentences starting with same word
        if (words.length > 0) {
            const firstWord = words[0].toLowerCase().replace(/[^a-z]/g, '');
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
    
    paragraphs.forEach(para => {
        const words = para.trim().split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        totalWords += wordCount;
        
        if (wordCount > 150) analysis.longParagraphs++;
        else if (wordCount < 50) analysis.shortParagraphs++;
    });
    
    analysis.averageLength = Math.round(totalWords / paragraphs.length);
    
    return analysis;
}

/**
 * Calculate comprehensive readability score
 */
export function calculateReadability() {
    try {
        const content = extractMainContent();
        
        if (!content || content.length < 50) {
            return {
                score: 0,
                level: 'N/A',
                error: 'Insufficient content to analyze'
            };
        }
        
        // Basic text analysis
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const words = content.split(/\s+/).filter(w => w.trim().length > 0);
        const paragraphs = content.split(/\n\s*\n|<\/p>\s*<p>/).filter(p => p.trim().length > 0);
        
        if (sentences.length === 0 || words.length === 0) {
            return {
                score: 0,
                level: 'N/A',
                error: 'No readable content found'
            };
        }
        
        // Calculate Flesch Reading Ease
        let syllables = 0;
        words.forEach(word => {
            syllables += countSyllables(word);
        });
        
        const fleschScore = Math.round(
            206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
        );
        
        let level = 'Very Difficult';
        if (fleschScore >= 90) level = 'Very Easy';
        else if (fleschScore >= 80) level = 'Easy';
        else if (fleschScore >= 70) level = 'Fairly Easy';
        else if (fleschScore >= 60) level = 'Standard';
        else if (fleschScore >= 50) level = 'Fairly Difficult';
        else if (fleschScore >= 30) level = 'Difficult';
        
        // Analyze passive voice
        const passiveSentences = sentences.filter(s => isPassiveVoice(s));
        const passivePercentage = Math.round((passiveSentences.length / sentences.length) * 100);
        
        // Analyze transitional words
        const transitional = countTransitionalWords(content);
        const transitionalPercentage = Math.round((transitional.count / sentences.length) * 100);
        
        // Sentence analysis
        const sentenceAnalysis = analyzeSentences(sentences);
        
        // Paragraph analysis
        const paragraphAnalysis = analyzeParagraphs(content);
        
        // Calculate overall readability score (0-100)
        // Based on multiple factors similar to Yoast
        let overallScore = fleschScore;
        
        // Adjust for passive voice (penalty if > 25%)
        if (passivePercentage > 25) {
            overallScore -= 10;
        } else if (passivePercentage > 15) {
            overallScore -= 5;
        }
        
        // Adjust for sentence length (penalty for too many long sentences)
        const longSentencePercentage = (sentenceAnalysis.longSentences / sentences.length) * 100;
        if (longSentencePercentage > 25) {
            overallScore -= 10;
        } else if (longSentencePercentage > 15) {
            overallScore -= 5;
        }
        
        // Bonus for transitional words (good for readability)
        if (transitionalPercentage >= 30) {
            overallScore += 5;
        } else if (transitionalPercentage >= 20) {
            overallScore += 3;
        }
        
        // Penalty for consecutive same starts
        if (sentenceAnalysis.consecutiveSameStart > 3) {
            overallScore -= 5;
        }
        
        // Ensure score is within bounds
        overallScore = Math.max(0, Math.min(100, overallScore));
        
        // Determine status for each metric
        const getStatus = (value, goodThreshold, warningThreshold) => {
            if (value <= goodThreshold) return 'good';
            if (value <= warningThreshold) return 'warning';
            return 'poor';
        };
        
        return {
            // Overall scores
            score: overallScore,
            fleschScore: fleschScore,
            level: level,
            
            // Basic metrics
            wordCount: words.length,
            sentenceCount: sentences.length,
            paragraphCount: paragraphAnalysis.total,
            averageWordsPerSentence: Math.round(words.length / sentences.length),
            averageSentencesPerParagraph: Math.round(sentences.length / paragraphAnalysis.total),
            
            // Voice analysis
            passiveVoice: {
                count: passiveSentences.length,
                percentage: passivePercentage,
                status: getStatus(passivePercentage, 10, 25),
                sentences: passiveSentences.slice(0, 5).map(s => s.trim().substring(0, 100))
            },
            
            // Transitional words
            transitionalWords: {
                count: transitional.count,
                percentage: transitionalPercentage,
                status: getStatus(30 - transitionalPercentage, 20, 30), // Inverted: more is better
                found: transitional.found.slice(0, 10)
            },
            
            // Sentence analysis
            sentences: {
                averageLength: sentenceAnalysis.averageLength,
                longSentences: sentenceAnalysis.longSentences,
                veryLongSentences: sentenceAnalysis.veryLongSentences,
                shortSentences: sentenceAnalysis.shortSentences,
                consecutiveSameStart: sentenceAnalysis.consecutiveSameStart,
                status: getStatus(sentenceAnalysis.averageLength, 15, 20)
            },
            
            // Paragraph analysis
            paragraphs: {
                averageLength: paragraphAnalysis.averageLength,
                longParagraphs: paragraphAnalysis.longParagraphs,
                shortParagraphs: paragraphAnalysis.shortParagraphs,
                status: getStatus(paragraphAnalysis.averageLength, 100, 150)
            },
            
            // Recommendations
            recommendations: generateRecommendations({
                fleschScore,
                passivePercentage,
                transitionalPercentage,
                sentenceAnalysis,
                paragraphAnalysis
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
 * Generate recommendations based on analysis
 */
function generateRecommendations(analysis) {
    const recommendations = [];
    
    const { fleschScore, passivePercentage, transitionalPercentage, sentenceAnalysis, paragraphAnalysis } = analysis;
    
    // Flesch score recommendations
    if (fleschScore < 60) {
        recommendations.push({
            type: 'error',
            message: `Flesch Reading Ease score is ${fleschScore} (${fleschScore < 30 ? 'Very Difficult' : 'Difficult'}). Aim for 60+ for better readability.`
        });
    } else if (fleschScore < 70) {
        recommendations.push({
            type: 'warning',
            message: `Flesch Reading Ease score is ${fleschScore} (Standard). Consider simplifying language for better readability.`
        });
    }
    
    // Passive voice recommendations
    if (passivePercentage > 25) {
        recommendations.push({
            type: 'error',
            message: `${passivePercentage}% of sentences use passive voice. Try to use active voice more often (aim for < 10%).`
        });
    } else if (passivePercentage > 15) {
        recommendations.push({
            type: 'warning',
            message: `${passivePercentage}% of sentences use passive voice. Consider using more active voice.`
        });
    }
    
    // Sentence length recommendations
    if (sentenceAnalysis.averageLength > 20) {
        recommendations.push({
            type: 'error',
            message: `Average sentence length is ${sentenceAnalysis.averageLength} words. Aim for 15 words or less.`
        });
    } else if (sentenceAnalysis.averageLength > 15) {
        recommendations.push({
            type: 'warning',
            message: `Average sentence length is ${sentenceAnalysis.averageLength} words. Consider shorter sentences.`
        });
    }
    
    if (sentenceAnalysis.veryLongSentences > 0) {
        recommendations.push({
            type: 'warning',
            message: `${sentenceAnalysis.veryLongSentences} sentence(s) exceed 25 words. Consider breaking them into shorter sentences.`
        });
    }
    
    // Consecutive same starts
    if (sentenceAnalysis.consecutiveSameStart > 3) {
        recommendations.push({
            type: 'warning',
            message: `${sentenceAnalysis.consecutiveSameStart} consecutive sentences start with the same word. Vary your sentence beginnings.`
        });
    }
    
    // Transitional words
    if (transitionalPercentage < 20) {
        recommendations.push({
            type: 'warning',
            message: `Only ${transitionalPercentage}% of sentences contain transitional words. Add more to improve flow (aim for 30%+).`
        });
    }
    
    // Paragraph length
    if (paragraphAnalysis.averageLength > 150) {
        recommendations.push({
            type: 'warning',
            message: `Average paragraph length is ${paragraphAnalysis.averageLength} words. Consider shorter paragraphs (aim for 100 words or less).`
        });
    }
    
    return recommendations;
}

