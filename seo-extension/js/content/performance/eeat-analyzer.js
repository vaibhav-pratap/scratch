/**
 * E-E-A-T Analyzer Module
 * Analyzes content for Experience, Expertise, Authoritativeness, and Trustworthiness signals
 * Following Google's Search Quality Rater Guidelines
 */

/**
 * Experience Signal Patterns - EXPANDED
 */
const EXPERIENCE_PATTERNS = {
    // UGC and Reviews
    reviews: [
        '.review', '.reviews', '#reviews', '.testimonial', '.testimonials',
        '[itemtype*="Review"]', '[itemtype*="AggregateRating"]',
        '.comment', '.comments', '#comments', '.feedback',
        '.rating', '.stars', '.user-generated'
    ],
    // First-person language indicating experience
    firstPerson: /\b(i|me|my|we|our|us|tested|tried|used|experienced|saw|visited)\b/i,
    // Media proving experience
    media: [
        'video', 'iframe[src*="youtube"]', 'iframe[src*="vimeo"]',
        '.gallery', '.slider', '.carousel',
        '[data-testid="video-player"]'
    ]
};

/**
 * Expertise Signal Patterns - EXPANDED
 */
const EXPERTISE_PATTERNS = {
    authorBio: [
        '.author-bio', '.about-author', '.author-description',
        '.author-info', '#author-bio', '[itemprop="author"]',
        '.writer-bio', '.contributor-bio'
    ],
    credentials: [
        /\b(phd|md|mba|msc|ma|ba|bs|certified|licensed|expert|specialist|consultant|professional)\b/i,
        /\b(years of experience|decade|veteran|award|recognized|published)\b/i
    ],
    socialProfiles: [
        'a[href*="linkedin.com/in/"]',
        'a[href*="twitter.com/"]', 
        'a[href*="x.com/"]',
        'a[href*="muckrack.com"]',
        'a[href*="crunchbase.com"]',
        'a[href*="scholar.google.com"]'
    ]
};

/**
 * Authoritativeness Signal Selectors & Patterns - EXPANDED
 */
const TRUSTWORTHINESS_PATTERNS = {
    policies: [
        'a[href*="privacy"]', 'a[href*="terms"]', 
        'a[href*="disclaimer"]', 'a[href*="policy"]',
        'a[href*="disclosure"]', 'a[href*="editorial"]'
    ],
    contact: [
        'a[href*="contact"]', 'a[href^="mailto:"]', 
        'a[href^="tel:"]', '.contact-info', 'address',
        'footer .contact'
    ],
    about: [
        'a[href*="about"]', 'a[href*="team"]', 
        'a[href*="mission"]', 'a[href*="history"]'
    ],
    security: [
        'https:', 
        '[src*="trustpilot"]', '[src*="bbb.org"]', '[src*="norton"]',
        '.secure', '.badge'
    ]
};

/**
 * Analyze Experience signals in content
 */
/**
 * Analyze Experience signals in content
 */
function analyzeExperience(content) {
    let score = 50; // Base score
    const signals = {
        score: 0,
        details: {},
        found: []
    };

    // Check for reviews/comments
    const hasReviews = EXPERIENCE_PATTERNS.reviews.some(selector => document.querySelector(selector));
    signals.details.hasReviews = hasReviews;
    if (hasReviews) {
        score += 15;
        signals.found.push('User reviews/comments detected');
    }

    // Check for first-person language in main content area
    // Using a simple regex match count on a sample
    const matches = (content.match(new RegExp(EXPERIENCE_PATTERNS.firstPerson, 'gi')) || []).length;
    signals.details.firstPersonMatches = matches;
    if (matches > 5) {
        score += 10;
        signals.found.push('First-hand experience language detected');
    }

    // Check for media evidence
    const hasMedia = EXPERIENCE_PATTERNS.media.some(selector => document.querySelector(selector));
    signals.details.hasMedia = hasMedia;
    if (hasMedia) {
        score += 10;
        signals.found.push('Multimedia content (video/images) detected');
    }
    
    signals.score = Math.min(100, score);
    return signals;
}

/**
 * Analyze Expertise signals
 */
function analyzeExpertise(content) {
    let score = 40; // Base score
    const signals = {
        score: 0,
        details: {},
        found: []
    };

    // Check for Author Bio
    const hasBio = EXPERTISE_PATTERNS.authorBio.some(selector => document.querySelector(selector));
    signals.details.hasBio = hasBio;
    if (hasBio) {
        score += 20;
        signals.found.push('Author bio section found');
    }

    // Check for credentials
    const credentialMatches = EXPERTISE_PATTERNS.credentials.some(regex => regex.test(content));
    signals.details.hasCredentials = credentialMatches;
    if (credentialMatches) {
        score += 15;
        signals.found.push('Professional credentials detected');
    }

    // Check for Social Profiles
    const hasSocial = EXPERTISE_PATTERNS.socialProfiles.some(selector => document.querySelector(selector));
    signals.details.hasSocial = hasSocial;
    if (hasSocial) {
        score += 15;
        signals.found.push('Author social profiles detected');
    }

    signals.score = Math.min(100, score);
    return signals;
}

/**
 * Analyze Authoritativeness signals (reusing existing logic but simplified)
 */
function analyzeAuthoritativeness() {
    let score = 40;
    const signals = { score: 0, details: {}, found: [] };

    // Check for author name metadata
    const authorMeta = document.querySelector('meta[name="author"]') || document.querySelector('[rel="author"]');
    if (authorMeta) {
        score += 20;
        signals.found.push('Author metadata found');
    }
    
    // Check for published date
    const dateMeta = document.querySelector('meta[property="article:published_time"]');
    if (dateMeta) {
         score += 10;
         signals.found.push('Published date found');
    }
    
    signals.score = Math.min(100, score);
    return signals;
}

/**
 * Analyze Trustworthiness signals
 */
function analyzeTrustworthiness() {
    let score = 50; // Base score
    const signals = {
        score: 0,
        details: {},
        found: []
    };

    // Check for policy pages
    if (TRUSTWORTHINESS_PATTERNS.policies.some(selector => document.querySelector(selector))) {
        score += 15;
        signals.found.push('Legal pages (Privacy/Terms) found');
    }

    // Check for contact info
    if (TRUSTWORTHINESS_PATTERNS.contact.some(selector => document.querySelector(selector))) {
        score += 15;
        signals.found.push('Contact information found');
    }

    // Check for About page
    if (TRUSTWORTHINESS_PATTERNS.about.some(selector => document.querySelector(selector))) {
        score += 10;
        signals.found.push('"About Us" page found');
    }

    // Check for HTTPS
    if (window.location.protocol === 'https:') {
        score += 10;
        signals.found.push('Secure HTTPS connection');
    }

    signals.score = Math.min(100, score);
    return signals;
}

/**
 * Get main content text
 */
function getMainContent() {
    const mainSelectors = [
        'main', 'article', '[role="main"]', '.content',
        '.main-content', '#content', '#main', '.post-content',
        '.article-content', '.entry-content'
    ];

    for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const content = element.innerText || element.textContent || '';
            if (content.length > 200) return content;
        }
    }

    // Fallback: remove nav, footer, etc.
    const bodyClone = document.body.cloneNode(true);
    const toRemove = bodyClone.querySelectorAll('nav, footer, header, script, style, noscript');
    toRemove.forEach(el => el.remove());

    return bodyClone.innerText || bodyClone.textContent || '';
}

/**
 * Analyze YMYL (Your Money or Your Life) topics
 */
function analyzeYMYL(content) {
    const YMYL_KEYWORDS = [
        'finance', 'money', 'stock', 'investment', 'loan', 'bank', 'credit',
        'health', 'medical', 'doctor', 'treatment', 'disease', 'symptom',
        'legal', 'law', 'lawyer', 'attorney', 'court', 'rights',
        'safety', 'security', 'emergency', 'disaster'
    ];

    const found = [];
    let count = 0;

    YMYL_KEYWORDS.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
            count += matches.length;
            found.push(keyword);
        }
    });

    return {
        isYMYL: count > 3, // Threshold for considering it YMYL
        score: count > 3 ? 100 : 0, // Just a flag
        details: { keywordCount: count },
        found: [...new Set(found)].slice(0, 10)
    };
}

/**
 * Main E-E-A-T analysis function
 */
export function analyzeEEAT() {
    try {
        const content = getMainContent();

        // Reduced minimum content requirement from 100 to 50 words
        if (!content || content.trim().split(/\s+/).length < 50) {
            return {
                score: 0,
                error: 'Insufficient content for E-E-A-T analysis (minimum 50 words required)',
                experience: { score: 0, details: {}, found: [] },
                expertise: { score: 0, details: {}, found: [] },
                authoritativeness: { score: 0, details: {}, found: [] },
                trustworthiness: { score: 0, details: {}, found: [] }
            };
        }

        const experience = analyzeExperience(content);
        const expertise = analyzeExpertise(content);
        const authoritativeness = analyzeAuthoritativeness(content);
        const trustworthiness = analyzeTrustworthiness(content);
        const ymyl = analyzeYMYL(content); 

        // Calculate weighted score
        // Adjusted weights: Trust is most important
        let score = (
            (experience.score * 1.5) +
            (expertise.score * 2.0) +
            (authoritativeness.score * 1.5) +
            (trustworthiness.score * 2.5)
        ) / 7.5;

        // Apply YMYL penalty only if content IS YMYL but lacks high Trust/Expertise
        if (ymyl.isYMYL) {
            if (trustworthiness.score < 70 || expertise.score < 60) {
              score *= 0.8; // 20% penalty for low trust/expertise on YMYL topics
            }
        }

        return {
            score: Math.round(score),
            level: getEEATDisplayLevel(score), // e.g. "High", "Medium", "Low" -- Need to add this helper or use getGrade
            grade: getGrade(score), // Keep existing grade helper too
            displayLevel: getGrade(score), // Alias for compatibility
            breakdown: {
                experience,
                expertise,
                authoritativeness,
                trustworthiness,
                ymyl
            }
        };
    } catch (error) {
        console.error('[E-E-A-T Analyzer] Error:', error);
        return {
            score: 0,
            error: error.message,
            experience: { score: 0, details: {}, found: [] },
            expertise: { score: 0, details: {}, found: [] },
            authoritativeness: { score: 0, details: {}, found: [] },
            trustworthiness: { score: 0, details: {}, found: [] }
        };
    }
}

/**
 * Get letter grade from score - ADJUSTED for more realistic grading
 */
function getGrade(score) {
    if (score >= 85) return 'A+';  // Lowered from 90
    if (score >= 75) return 'A';   // Lowered from 80
    if (score >= 65) return 'B';   // Lowered from 70
    if (score >= 55) return 'C';   // Lowered from 60
    if (score >= 45) return 'D';   // Lowered from 50
    return 'F';
}

function getEEATDisplayLevel(score) {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'Low';
    return 'Very Low';
}
