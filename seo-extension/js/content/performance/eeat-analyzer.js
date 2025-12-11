/**
 * E-E-A-T Analyzer Module
 * Analyzes content for Experience, Expertise, Authoritativeness, and Trustworthiness signals
 * Following Google's Search Quality Rater Guidelines
 */

/**
 * Experience Signal Patterns - EXPANDED
 */
const EXPERIENCE_PATTERNS = {
    firstPerson: [
        // Personal testing/usage
        /\b(I|I've|I have|my|mine)\s+(tested|tried|used|experienced|found|discovered)\b/gi,
        /\b(I|I've|I have)\s+(worked with|dealt with|handled|managed|operated)\b/gi,
        /\b(I|I've|I have)\s+(seen|witnessed|observed|noticed|encountered)\b/gi,
        /\b(I|I've|I have)\s+(built|created|developed|designed|implemented)\b/gi,
        /\b(I|I've|I have)\s+(learned|realized|understood|figured out)\b/gi,

        // Personal opinions/recommendations
        /\b(I|personally)\s+(recommend|suggest|prefer|love|hate|believe|think)\b/gi,
        /\bin my (experience|opinion|view|case|situation|practice)\b/gi,
        /\bfrom my (experience|perspective|point of view|standpoint|vantage point)\b/gi,
        /\bI (can say|must admit|would argue|strongly feel)\b/gi,

        // Personal journey/story
        /\bmy (journey|story|approach|method|technique|strategy|process)\b/gi,
        /\b(when I|after I|before I|as I)\s+(started|began|tried|tested)\b/gi,
        /\bI (struggled|succeeded|failed|achieved)\b/gi,

        // Personal claims
        /\bI (guarantee|promise|assure you|swear)\b/gi,
        /\btrust me\b/gi,
        /\btake it from me\b/gi,
        /\bfrom someone who\b/gi,
        /\bas someone who (has|have)\b/gi
    ],
    caseStudies: [
        /\bcase study\b/gi,
        /\b(before|after) (and after|results|comparison|photos|images)\b/gi,
        /\breal[ -]world (example|results|data|evidence|testing|application)\b/gi,
        /\b(actual|real|genuine|authentic) (results|outcomes|success|data|experience|case)\b/gi,
        /\b(client|customer|user) (story|success|testimonial|review|feedback)\b/gi,
        /\b(success|failure) (story|case|example)\b/gi,
        /\bproven (results|track record|success|methodology)\b/gi,
        /\bmeasurable (results|outcomes|success|improvements)\b/gi,
        /\b(documented|verified|confirmed) (results|outcomes|success)\b/gi,
        /\b(a|one) year (later|after|since)\b/gi,
        /\bX months (later|after)\b/gi,
        /\bfollow[ -]up (study|results|data)\b/gi
    ],
    examples: [
        /\bfor (example|instance)\b/gi,
        /\bsuch as\b/gi,
        /\be\.g\.\b/gi,
        /\bspecifically\b/gi,
        /\btake (for instance|for example|the case of)\b/gi,
        /\bas (illustrated|demonstrated|shown) (by|in)\b/gi,
        /\bconsider (this|the following)\b/gi,
        /\blet('s| us) (look at|examine|consider)\b/gi,
        /\bto (illustrate|demonstrate|show|exemplify)\b/gi,
        /\b(here's|here is) (an example|a case)\b/gi,
        /\bin (practice|action|reality|real life)\b/gi
    ],
    practical: [
        /\bhands[ -]on (experience|testing|work|approach)\b/gi,
        /\bpractical (experience|application|use|testing)\b/gi,
        /\bstep[ -]by[ -]step (guide|process|tutorial|instructions)\b/gi,
        /\b(detailed|comprehensive) (tutorial|walkthrough|guide)\b/gi,
        /\b(how to|how I)\b/gi,
        /\btips (from|based on) (experience|practice)\b/gi,
        /\blessons (I've )?(learned|learned)\b/gi,
        /\bmistakes (I|we|to avoid)\b/gi,
        /\btried and (tested|true)\b/gi,
        /\bfield[ -]tested\b/gi
    ]
};

/**
 * Expertise Signal Patterns - EXPANDED
 */
const EXPERTISE_PATTERNS = {
    credentials: [
        // Academic credentials
        /\b(PhD|Ph\.D\.|Doctor|Dr\.|Professor|Prof\.)\b/gi,
        /\b(M\.D\.|MD|Medical Doctor)\b/gi,
        /\b(MBA|MSc|M\.Sc\.|BSc|B\.Sc\.|MA|M\.A\.|BA|B\.A\.)\b/gi,
        /\b(J\.D\.|JD|Juris Doctor|Esquire|Esq\.)\b/gi,

        // Professional certifications
        /\b(certified|licensed|accredited|registered)\s+(professional|practitioner|specialist|expert)\b/gi,
        /\bcertified (by|in|as a)\b/gi,
        /\b(board|industry|nationally|internationally) certified\b/gi,
        /\b(CPA|CFA|PMP|CISSP|CompTIA|AWS|Google|Microsoft) certified\b/gi,
        /\bstate[ -]licensed\b/gi,
        /\bAmerican Board of\b/gi,

        // Experience claims
        /\b(years?|decades?) of (experience|expertise|practice)\b/gi,
        /\b(expert|specialist|professional|consultant|authority) (in|on)\b/gi,
        /\b(leading|renowned|recognized|noted) (expert|authority|specialist)\b/gi,
        /\b(industry|subject matter|technical) expert\b/gi,
        /\b(over|more than) \d+ years\b/gi,
        /\bseasoned (professional|expert|practitioner)\b/gi
    ],
    technical: [
        // Technical terminology
        /\b(algorithm|methodology|framework|system|process|protocol|mechanism)\b/gi,
        /\b(architecture|infrastructure|implementation|deployment)\b/gi,
        /\b(empirical|quantitative|qualitative|statistical) (evidence|data|analysis)\b/gi,
        /\b(peer[ -]reviewed|scientific|academic) (research|study|paper|journal)\b/gi,

        // Research language
        /\b(according to|based on|as per|per) (research|studies|data|findings)\b/gi,
        /\b(research shows|studies indicate|data suggests|evidence demonstrates)\b/gi,
        /\b(data|statistics|metrics|analytics|analysis) (shows|indicates|suggests|reveals)\b/gi,
        /\b(clinical|laboratory|controlled) (study|trial|test)\b/gi,
        /\b(hypothesis|theory|model|paradigm)\b/gi,
        /\b(correlation|causation|relationship) between\b/gi,

        // Professional terminology
        /\b(best practices|industry standards|standard operating procedures|SOPs)\b/gi,
        /\b(compliance|regulatory|guidelines|protocols)\b/gi,
        /\b(benchmarks|KPIs|key performance indicators)\b/gi,
        /\b(ROI|return on investment|cost[ -]benefit)\b/gi
    ],
    citations: [
        // Citation formats
        /\[(source|citation|reference|ref|note)\s*\d*\]/gi,
        /\b(cited|referenced|sourced) from\b/gi,
        /\baccording to (a|the) (study|research|report|survey|analysis)\b/gi,
        /\bas (published|reported|stated) (in|by)\b/gi,
        /\b(study|research|report|survey) (published|conducted|performed) by\b/gi,
        /\b(journal|publication|magazine|newspaper) (article|report|study)\b/gi,
        /\b(retrieved|accessed|obtained) from\b/gi,
        /\bsee (also|references|bibliography|sources)\b/gi,
        /\b\d{4}[\);]\b/gi, // Year citations like "2023)"
        /\bet al\.\b/gi,
        /\bibid\b/gi,
        /\bop\. cit\.\b/gi
    ],
    publications: [
        /\bpublished (in|by|on)\b/gi,
        /\b(author|co[ -]author|contributor) (of|to)\b/gi,
        /\b(book|article|paper|chapter|whitepaper|e[ -]book)\s+(titled|called|about)\b/gi,
        /\b(ISBN|DOI)\s*:?\s*\d/gi,
        /\b(presented|spoke) at (a|the) (conference|summit|symposium|seminar)\b/gi,
        /\bkeynote (speaker|presenter|address)\b/gi
    ]
};

/**
 * Authoritativeness Signal Selectors & Patterns - EXPANDED
 */
const AUTHORITATIVENESS_SIGNALS = {
    authorSelectors: [
        // Meta tags
        'meta[name="author"]',
        'meta[property="article:author"]',
        'meta[property="og:article:author"]',
        'meta[name="twitter:creator"]',
        'meta[name="dcterms.creator"]',

        // Semantic elements
        '[rel="author"]',
        '[itemtype*="Person"][itemprop="author"]',
        '[itemtype*="Person"][itemprop="creator"]',

        // Common CSS classes
        '.author',
        '.byline',
        '.by-line',
        '.post-author',
        '.article-author',
        '.entry-author',
        '.author-name',
        '.writer',
        '.contributor',
        '.published-by',
        '.written-by',
        'address[rel="author"]'
    ],
    dateSelectors: [
        // Time elements
        'time[datetime]',
        'time[pubdate]',
        'time[itemprop="datePublished"]',
        'time[itemprop="dateModified"]',

        // Meta tags
        'meta[property="article:published_time"]',
        'meta[property="article:modified_time"]',
        'meta[property="og:published_time"]',
        'meta[property="og:updated_time"]',
        'meta[name="date"]',
        'meta[name="publish_date"]',
        'meta[name="last-modified"]',
        'meta[itemprop="datePublished"]',

        // CSS classes
        '.published-date',
        '.publish-date',
        '.post-date',
        '.entry-date',
        '.updated-date',
        '.last-updated',
        '.date-published',
        '.article-date',
        '.timestamp'
    ],
    bioSelectors: [
        '.author-bio',
        '.author-description',
        '.author-info',
        '.author-details',
        '.author-profile',
        '.author-box',
        '.about-author',
        '#author-bio',
        '#author-info',
        '.bio',
        '.byline-bio',
        '[class*="author"][class*="bio"]',
        '[class*="author"][class*="info"]',
        '[itemprop="author"][itemprop="description"]'
    ],
    awardsRecognition: [
        '.awards',
        '.recognition',
        '.achievements',
        '.credentials',
        '.certifications',
        '[class*="award"]',
        '[class*="recognition"]'
    ]
};

/**
 * Trustworthiness Signal Selectors - EXPANDED
 */
const TRUSTWORTHINESS_SIGNALS = {
    securitySelectors: [
        'link[rel="canonical"]',
        'meta[name="robots"]',
        'meta[name="googlebot"]',
        'meta[http-equiv="Content-Security-Policy"]',
        'link[rel="alternate"]',
        'meta[name="viewport"]'
    ],
    contactSelectors: [
        // Email links
        'a[href^="mailto:"]',
        'a[href^="mailto"]',

        // Contact page links
        'a[href*="/contact"]',
        'a[href*="/contact-us"]',
        'a[href*="/get-in-touch"]',
        'a[href*="/about"]',
        'a[href*="/about-us"]',

        // Contact forms and elements
        'form[class*="contact"]',
        'form[id*="contact"]',
        '.contact-info',
        '.contact-us',
        '.contact-details',
        '.contact-form',
        '#contact',
        '.get-in-touch',

        // Phone numbers
        'a[href^="tel:"]',
        'a[href^="tel"]',
        '.phone',
        '.telephone',
        '[itemprop="telephone"]'
    ],
    policySelectors: [
        // Privacy related
        'a[href*="privacy"]',
        'a[href*="privacy-policy"]',
        'a[href*="cookie"]',
        'a[href*="cookies"]',
        'a[href*="gdpr"]',

        // Terms related
        'a[href*="terms"]',
        'a[href*="terms-of-service"]',
        'a[href*="terms-and-conditions"]',
        'a[href*="tos"]',

        // Other policies
        'a[href*="policy"]',
        'a[href*="disclaimer"]',
        'a[href*="legal"]',
        'a[href*="compliance"]'
    ],
    trustBadges: [
        // Trust seals and badges
        '[alt*="SSL"]',
        '[alt*="Secure"]',
        '[alt*="Verified"]',
        '[alt*="BBB"]',
        '[alt*="TRUSTe"]',
        '[alt*="Norton"]',
        '[alt*="McAfee"]',
        '[alt*="Certified"]',
        'img[src*="trust"]',
        'img[src*="secure"]',
        'img[src*="verified"]',
        'img[src*="badge"]'
    ],
    externalSources: [
        'a[href^="http"]:not([href*="' + window.location.hostname + '"])',
        'a[target="_blank"]',
        'a[rel="noopener"]',
        'a[rel="external"]'
    ],
    socialProof: [
        // Social media
        'a[href*="facebook.com"]',
        'a[href*="twitter.com"]',
        'a[href*="linkedin.com"]',
        'a[href*="instagram.com"]',
        'a[href*="youtube.com"]',
        'a[href*="pinterest.com"]',

        // Reviews
        '[itemprop="aggregateRating"]',
        '[itemprop="review"]',
        '.reviews',
        '.testimonials',
        '.ratings',
        '[class*="review"]',
        '[class*="rating"]',
        '[class*="testimonial"]'
    ]
};

/**
 * Analyze Experience signals in content
 */
function analyzeExperience(content) {
    const signals = {
        score: 0,
        details: {},
        found: []
    };

    // Check for first-person content
    let firstPersonCount = 0;
    EXPERIENCE_PATTERNS.firstPerson.forEach(pattern => {
        const matches = content.match(pattern) || [];
        firstPersonCount += matches.length;
        if (matches.length > 0) {
            signals.found.push(...matches.slice(0, 3).map(m => m.trim()));
        }
    });
    signals.details.firstPerson = firstPersonCount;
    signals.score += Math.min(firstPersonCount * 4, 25); // Max 25 points

    // Check for case studies
    let caseStudyCount = 0;
    EXPERIENCE_PATTERNS.caseStudies.forEach(pattern => {
        const matches = content.match(pattern) || [];
        caseStudyCount += matches.length;
    });
    signals.details.caseStudies = caseStudyCount;
    signals.score += Math.min(caseStudyCount * 8, 25); // Max 25 points

    // Check for examples
    let exampleCount = 0;
    EXPERIENCE_PATTERNS.examples.forEach(pattern => {
        const matches = content.match(pattern) || [];
        exampleCount += matches.length;
    });
    signals.details.examples = exampleCount;
    signals.score += Math.min(exampleCount * 2, 20); // Max 20 points

    // Check for practical experience (NEW)
    let practicalCount = 0;
    EXPERIENCE_PATTERNS.practical.forEach(pattern => {
        const matches = content.match(pattern) || [];
        practicalCount += matches.length;
    });
    signals.details.practical = practicalCount;
    signals.score += Math.min(practicalCount * 3, 15); // Max 15 points

    // Personal anecdotes (paragraphs starting with "I" or "My")
    const paragraphs = content.split(/\n\n+/);
    const personalParagraphs = paragraphs.filter(p => /^(I|My)\s/i.test(p.trim()));
    signals.details.personalParagraphs = personalParagraphs.length;
    signals.score += Math.min(personalParagraphs.length * 3, 15); // Max 15 points

    signals.score = Math.min(signals.score, 100);
    return signals;
}

/**
 * Analyze Expertise signals
 */
function analyzeExpertise(content) {
    const signals = {
        score: 0,
        details: {},
        found: []
    };

    // Check for credentials
    let credentialCount = 0;
    EXPERTISE_PATTERNS.credentials.forEach(pattern => {
        const matches = content.match(pattern) || [];
        credentialCount += matches.length;
        if (matches.length > 0) {
            signals.found.push(...matches.slice(0, 3).map(m => m.trim()));
        }
    });
    signals.details.credentials = credentialCount;
    signals.score += Math.min(credentialCount * 8, 25); // Max 25 points

    // Check for technical depth
    let technicalCount = 0;
    EXPERTISE_PATTERNS.technical.forEach(pattern => {
        const matches = content.match(pattern) || [];
        technicalCount += matches.length;
    });
    signals.details.technicalTerms = technicalCount;
    signals.score += Math.min(technicalCount * 1.5, 25); // Max 25 points

    // Check for citations/references
    let citationCount = 0;
    EXPERTISE_PATTERNS.citations.forEach(pattern => {
        const matches = content.match(pattern) || [];
        citationCount += matches.length;
    });
    signals.details.citations = citationCount;
    signals.score += Math.min(citationCount * 4, 20); // Max 20 points

    // Check for publications (NEW)
    let publicationCount = 0;
    EXPERTISE_PATTERNS.publications.forEach(pattern => {
        const matches = content.match(pattern) || [];
        publicationCount += matches.length;
    });
    signals.details.publications = publicationCount;
    signals.score += Math.min(publicationCount * 5, 15); // Max 15 points

    // Check for author bio
    const hasBio = AUTHORITATIVENESS_SIGNALS.bioSelectors.some(selector => {
        return document.querySelector(selector) !== null;
    });
    signals.details.authorBio = hasBio;
    signals.score += hasBio ? 15 : 0;

    signals.score = Math.min(signals.score, 100);
    return signals;
}

/**
 * Analyze Authoritativeness signals
 */
function analyzeAuthoritativeness() {
    const signals = {
        score: 0,
        details: {},
        found: []
    };

    // Check for author attribution
    const authorElements = AUTHORITATIVENESS_SIGNALS.authorSelectors.map(s =>
        document.querySelector(s)
    ).filter(el => el !== null);

    signals.details.hasAuthor = authorElements.length > 0;
    if (authorElements.length > 0) {
        const authorName = authorElements[0].textContent || authorElements[0].content || 'Found';
        signals.found.push(`Author: ${authorName.trim().substring(0, 50)}`);
        signals.score += 25;
    }

    // Check for published date
    const dateElements = AUTHORITATIVENESS_SIGNALS.dateSelectors.map(s =>
        document.querySelector(s)
    ).filter(el => el !== null);

    signals.details.hasPublishedDate = dateElements.length > 0;
    if (dateElements.length > 0) {
        const date = dateElements[0].getAttribute('datetime') || dateElements[0].content || dateElements[0].textContent;
        signals.found.push(`Published: ${date.substring(0, 20)}`);
        signals.score += 20;
    }

    // Check for updated date
    const updatedElement = document.querySelector('meta[property="article:modified_time"]') ||
        document.querySelector('.updated-date') ||
        document.querySelector('[class*="updated"]');
    signals.details.hasUpdatedDate = updatedElement !== null;
    if (updatedElement) {
        signals.score += 15;
    }

    // Check for author bio/profile
    const bioElements = AUTHORITATIVENESS_SIGNALS.bioSelectors.map(s =>
        document.querySelector(s)
    ).filter(el => el !== null);

    signals.details.hasAuthorBio = bioElements.length > 0;
    signals.score += bioElements.length > 0 ? 20 : 0;

    // Check for external mentions/social proof
    const socialLinks = document.querySelectorAll('a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="facebook.com"]');
    signals.details.socialPresence = socialLinks.length;
    signals.score += Math.min(socialLinks.length * 4, 20);

    signals.score = Math.min(signals.score, 100);
    return signals;
}

/**
 * Analyze Trustworthiness signals
 */
function analyzeTrustworthiness() {
    const signals = {
        score: 0,
        details: {},
        found: []
    };

    // Check for HTTPS
    const isSecure = window.location.protocol === 'https:';
    signals.details.https = isSecure;
    signals.score += isSecure ? 10 : 0;
    if (isSecure) signals.found.push('HTTPS Enabled');

    // Check for contact information
    const contactLinks = TRUSTWORTHINESS_SIGNALS.contactSelectors.map(s =>
        document.querySelectorAll(s)
    ).reduce((acc, nodelist) => acc + nodelist.length, 0);

    signals.details.hasContact = contactLinks > 0;
    signals.score += contactLinks > 0 ? 12 : 0;
    if (contactLinks > 0) signals.found.push(`Contact Info Found (${contactLinks} links)`);

    // Check for privacy policy
    const policyLinks = TRUSTWORTHINESS_SIGNALS.policySelectors.map(s =>
        document.querySelectorAll(s)
    ).reduce((acc, nodelist) => acc + nodelist.length, 0);

    signals.details.hasPrivacyPolicy = policyLinks > 0;
    signals.score += policyLinks > 0 ? 12 : 0;
    if (policyLinks > 0) signals.found.push('Privacy Policy Found');

    // Check for about page
    const aboutLink = document.querySelector('a[href*="/about"]');
    signals.details.hasAboutPage = aboutLink !== null;
    signals.score += aboutLink ? 8 : 0;
    if (aboutLink) signals.found.push('About Page Found');

    // Check for trust badges (NEW)
    const trustBadges = TRUSTWORTHINESS_SIGNALS.trustBadges.map(s =>
        document.querySelectorAll(s)
    ).reduce((acc, nodelist) => acc + nodelist.length, 0);

    signals.details.trustBadges = trustBadges;
    signals.score += Math.min(trustBadges * 5, 15);
    if (trustBadges > 0) signals.found.push(`Trust Badges: ${trustBadges} found`);

    // Check for social proof (NEW)
    const socialProofElements = TRUSTWORTHINESS_SIGNALS.socialProof.map(s =>
        document.querySelectorAll(s)
    ).reduce((acc, nodelist) => acc + nodelist.length, 0);

    signals.details.socialProof = socialProofElements;
    signals.score += Math.min(socialProofElements * 2, 13);
    if (socialProofElements > 5) signals.found.push(`Social Proof: ${socialProofElements} elements`);

    // Check for external authoritative sources
    const externalLinks = document.querySelectorAll(
        `a[href^="http"]:not([href*="${window.location.hostname}"])`
    );
    const authoritativeDomains = [
        'wikipedia.org', 'gov', 'edu', 'nih.gov', 'who.int',
        'cdc.gov', 'nature.com', 'science.org', 'pubmed', 'scholar.google',
        'ncbi.nlm.nih.gov', 'nejm.org', 'thelancet.com', 'bmj.com',
        'nytimes.com', 'wsj.com', 'reuters.com', 'bloomberg.com'
    ];

    let authoritativeCount = 0;
    externalLinks.forEach(link => {
        const href = link.href.toLowerCase();
        if (authoritativeDomains.some(domain => href.includes(domain))) {
            authoritativeCount++;
        }
    });

    signals.details.externalSources = externalLinks.length;
    signals.details.authoritativeSources = authoritativeCount;
    signals.score += Math.min(externalLinks.length * 1.5, 15);
    signals.score += Math.min(authoritativeCount * 4, 15);

    if (externalLinks.length > 0) {
        signals.found.push(`External Links: ${externalLinks.length} (${authoritativeCount} authoritative)`);
    }

    signals.score = Math.min(signals.score, 100);
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
 * Main E-E-A-T analysis function
 */
export function analyzeEEAT() {
    try {
        const content = getMainContent();

        if (!content || content.length < 100) {
            return {
                score: 0,
                error: 'Insufficient content for E-E-A-T analysis',
                experience: { score: 0, details: {}, found: [] },
                expertise: { score: 0, details: {}, found: [] },
                authoritativeness: { score: 0, details: {}, found: [] },
                trustworthiness: { score: 0, details: {}, found: [] }
            };
        }

        const experience = analyzeExperience(content);
        const expertise = analyzeExpertise(content);
        const authoritativeness = analyzeAuthoritativeness();
        const trustworthiness = analyzeTrustworthiness();

        // Calculate overall E-E-A-T score (weighted average)
        const overallScore = Math.round(
            (experience.score * 0.25) +
            (expertise.score * 0.25) +
            (authoritativeness.score * 0.25) +
            (trustworthiness.score * 0.25)
        );

        return {
            score: overallScore,
            grade: getGrade(overallScore),
            experience,
            expertise,
            authoritativeness,
            trustworthiness,
            wordCount: content.split(/\s+/).length,
            timestamp: new Date().toISOString()
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
 * Get letter grade from score
 */
function getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}
