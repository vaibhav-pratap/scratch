/**
 * Inclusive Language Module
 * Checks content for non-inclusive, biased, or outdated terminology.
 * Provides suggestions for more modern and inclusive alternatives.
 */

const INCLUSIVE_DICTIONARY = [
    // Gender
    { term: "mankind", suggestion: "humankind", category: "Gender" },
    { term: "manpower", suggestion: "workforce", category: "Gender" },
    { term: "manmade", suggestion: "artificial", category: "Gender" },
    { term: "chairman", suggestion: "chairperson", category: "Gender" },
    { term: "policeman", suggestion: "police officer", category: "Gender" },
    { term: "fireman", suggestion: "firefighter", category: "Gender" },
    { term: "mailman", suggestion: "mail carrier", category: "Gender" },
    { term: "stewardess", suggestion: "flight attendant", category: "Gender" },
    { term: "guys", suggestion: "folks", category: "Gender" },
    { term: "waitress", suggestion: "server", category: "Gender" },
    { term: "freshman", suggestion: "first-year student", category: "Gender" },
    { term: "mother tongue", suggestion: "native language", category: "Gender" },

    // Race / Ethnicity
    { term: "blacklist", suggestion: "blocklist", category: "Race" },
    { term: "whitelist", suggestion: "allowlist", category: "Race" },
    { term: "master", suggestion: "primary", category: "Race" },
    { term: "slave", suggestion: "secondary", category: "Race" },
    { term: "grandfathered", suggestion: "legacy", category: "Race" },
    { term: "powwow", suggestion: "meeting", category: "Race" },
    { term: "guru", suggestion: "expert", category: "Race" },
    { term: "ninja", suggestion: "expert", category: "Race" },
    { term: "sherpa", suggestion: "guide", category: "Race" },

    // Disability
    { term: "crazy", suggestion: "wild", category: "Disability" },
    { term: "insane", suggestion: "extreme", category: "Disability" },
    { term: "dumb", suggestion: "unwise", category: "Disability" },
    { term: "lame", suggestion: "uncool", category: "Disability" },
    { term: "sanity check", suggestion: "confidence check", category: "Disability" },
    { term: "blind spot", suggestion: "missed area", category: "Disability" },
    { term: "crippled", suggestion: "disabled", category: "Disability" },
    { term: "handicap", suggestion: "disability", category: "Disability" },
    { term: "wheelchair bound", suggestion: "wheelchair user", category: "Disability" },
    { term: "suffers from", suggestion: "has", category: "Disability" },
    { term: "tone deaf", suggestion: "insensitive", category: "Disability" },
    { term: "ocd", suggestion: "meticulous", category: "Disability" }
];

/**
 * Check text for inclusive language issues
 * @param {string} text - The content to analyze
 * @returns {object} - Analysis results including score and issues
 */
export function checkInclusivity(text) {
    if (!text) return { score: 100, issues: [] };

    const lowerText = text.toLowerCase();
    const issues = [];
    let issueCount = 0;

    INCLUSIVE_DICTIONARY.forEach(item => {
        // Use word boundary to avoid partial matches (e.g., "human" shouldn't match "man")
        // Note: Simple regex handling; for "grandfathered", standard \b works.
        const regex = new RegExp(`\\b${item.term}\\b`, 'gi');
        
        const matches = lowerText.match(regex);
        if (matches) {
            // Find first index for context snippet (optional, maybe later)
            issueCount += matches.length;
            
            // Avoid duplicate reports for the same term
            if (!issues.find(i => i.term === item.term)) {
                issues.push({
                    term: item.term,
                    suggestion: item.suggestion,
                    category: item.category,
                    count: matches.length
                });
            }
        }
    });

    // Score calculation (100 - penalties)
    // 5 points deduction per unique issue found (not per occurrence to avoid punishing repetition of one mistake too hard)
    let score = Math.max(0, 100 - (issues.length * 5));

    return {
        score,
        issues
    };
}
