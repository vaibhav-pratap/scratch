/**
 * Sentiment Analysis Module
 * Analyzes text for positive/negative tone and potential toxicity.
 * Uses a lightweight lexicon based on AFINN-165.
 */

// Simplified Lexicon (Score: -5 to +5)
const LEXICON = {
    // POSITIVE
    "amazing": 4, "awesome": 4, "excellent": 5, "outstanding": 5, "fantastic": 4,
    "good": 3, "great": 3, "best": 3, "better": 2, "love": 3, "perfect": 3,
    "beautiful": 3, "brilliant": 4, "creative": 2, "dynamic": 2, "effective": 2,
    "efficient": 2, "engaging": 2, "enjoy": 2, "exciting": 3, "expert": 2,
    "favorite": 2, "free": 1, "fun": 4, "helpful": 2, "highlight": 2,
    "impressive": 3, "improve": 2, "innovative": 2, "inspire": 3, "joke": 2,
    "joy": 3, "masterpiece": 4, "opportunity": 2, "pleasure": 3, "popular": 3,
    "powerful": 2, "pro": 1, "promising": 3, "reward": 2, "robust": 2,
    "safe": 1, "satisfied": 2, "secure": 2, "solution": 1, "success": 2,
    "support": 2, "top": 2, "value": 1, "vision": 1, "wealth": 3, "win": 4,
    "wonderful": 4, "worth": 2, "wow": 4, "yes": 1, "easy": 1, "benefit": 2,
    "boost": 1, "clarity": 2, "comfort": 2, "recommend": 2, "trusted": 2,
    
    // NEGATIVE
    "bad": -3, "worse": -3, "worst": -3, "horrible": -3, "terrible": -3,
    "awful": -3, "disgusting": -3, "hate": -3, "anger": -3, "annoy": -2,
    "anxious": -2, "avoid": -1, "awkward": -2, "blame": -2, "boring": -2,
    "broken": -1, "chaos": -2, "cheat": -3, "complaint": -2, "confused": -1,
    "crisis": -3, "damage": -3, "dead": -3, "delay": -1, "deny": -2,
    "disaster": -2, "doubt": -1, "dumb": -3, "error": -2, "fail": -2,
    "fake": -3, "fear": -2, "fight": -1, "fraud": -4, "grief": -2,
    "guilt": -3, "harm": -2, "hurt": -2, "idiot": -3, "ignore": -1,
    "ill": -2, "issues": -1, "kill": -3, "lack": -1, "lazy": -1,
    "loss": -3, "mess": -1, "mistake": -2, "negative": -2, "pain": -2,
    "panic": -3, "poor": -2, "problem": -1, "quit": -1, "reject": -1,
    "risk": -2, "rude": -2, "sad": -2, "scam": -4, "shame": -2,
    "sick": -2, "silly": -1, "slow": -2, "sorry": -1, "stress": -1,
    "stupid": -2, "suffer": -2, "threat": -2, "trouble": -2, "ugly": -3,
    "unhappy": -2, "useless": -2, "victim": -3, "waste": -1, "weak": -2,
    "worry": -3, "wrong": -2, "manipulate": -1, "mislead": -3, "complex": -1,
    "difficult": -1, "hard": -1
};

// Toxic/Aggressive triggers (Binary flag)
const TOXIC_TRIGGERS = [
    "stupid", "idiot", "dumb", "shut up", "kill yourself", "hate you", 
    "ugly", "fat", "disgusting", "scam", "cheat", "fraud", "manipulate"
];

const STOPWORDS = new Set(['the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);

import { segmentText } from './readability-utils.js';

export function analyzeSentiment(text) {
    if (!text || text.length < 50) {
        return { score: 0, label: 'Neutral', polarity: 0, toxicity: false, negativeWords: [] };
    }

    const { words } = segmentText(text.toLowerCase());
    
    let score = 0;
    let wordCount = 0;
    let toxicFound = false;
    const negativeWords = [];

    // Scoring
    words.forEach(word => {
        if (STOPWORDS.has(word)) return;

        if (TOXIC_TRIGGERS.includes(word)) {
            toxicFound = true;
        }

        if (LEXICON[word]) {
            score += LEXICON[word];
            wordCount++;
            if (LEXICON[word] < 0) {
                negativeWords.push(word);
            }
        }
    });

    // Normalize score (-1 to 1 range roughly, though huge docs can skew)
    // Adjusted logic: Average score per emotional word * intensity factor
    const normalizedScore = wordCount > 0 ? (score / wordCount) : 0;
    const polarity = Math.max(-10, Math.min(10, score)); // Cap total score for display

    let label = 'Neutral';
    if (score > 2) label = 'Positive';
    if (score > 10) label = 'Very Positive';
    if (score < -2) label = 'Negative';
    if (score < -10) label = 'Very Negative';

    // Unique negative words (top 5)
    const uniqueNegatives = [...new Set(negativeWords)].slice(0, 5);

    return {
        score: score, // Raw total score
        average: normalizedScore, // Average per emotional word
        label: label,
        toxicity: toxicFound,
        negativeWords: uniqueNegatives
    };
}
