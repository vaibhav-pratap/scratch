/**
 * Accessibility Extractor Module
 * Extracts accessibility data based on WCAG 2.1 guidelines
 */

/**
 * WCAG Reference Data
 */
const WCAG_REFS = {
    'missing-alt': {
        criterion: '1.1.1 Non-text Content',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
    },
    'missing-label': {
        criterion: '1.3.1 Info and Relationships',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
    },
    'heading-hierarchy': {
        criterion: '1.3.1 Info and Relationships',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
    },
    'color-contrast': {
        criterion: '1.4.3 Contrast (Minimum)',
        level: 'AA',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
    },
    'missing-landmark': {
        criterion: '1.3.1 Info and Relationships',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
    },
    'empty-link': {
        criterion: '2.4.4 Link Purpose (In Context)',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html'
    },
    'missing-lang': {
        criterion: '3.1.1 Language of Page',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html'
    },
    'keyboard-trap': {
        criterion: '2.1.2 No Keyboard Trap',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html'
    }
};

/**
 * Get unique selector for an element
 */
function getElementSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    if (element.className) {
        const classes = element.className.split(' ').filter(c => c).slice(0, 2).join('.');
        if (classes) {
            return `${element.tagName.toLowerCase()}.${classes}`;
        }
    }
    return element.tagName.toLowerCase();
}

/**
 * Check images for alt text
 */
function checkImages() {
    const images = document.querySelectorAll('img');
    const issues = [];
    let passed = 0;
    let failed = 0;

    images.forEach(img => {
        if (!img.hasAttribute('alt')) {
            failed++;
            issues.push({
                type: 'missing-alt',
                severity: 'critical',
                message: 'Image missing alt attribute',
                element: getElementSelector(img),
                selector: getElementSelector(img),
                wcagRef: WCAG_REFS['missing-alt'],
                suggestion: 'Add descriptive alt text that conveys the purpose of this image. For decorative images, use alt="".',
                fix: `Add alt="Description of image" to the <img> tag`
            });
        } else if (img.alt === '' && !img.hasAttribute('role')) {
            // Empty alt is okay for decorative images
            passed++;
        } else {
            passed++;
        }
    });

    return { passed, failed, issues, score: images.length > 0 ? Math.round((passed / images.length) * 100) : 100 };
}

/**
 * Check forms for labels and ARIA attributes
 */
function checkForms() {
    const inputs = document.querySelectorAll('input, select, textarea');
    const issues = [];
    let passed = 0;
    let failed = 0;

    inputs.forEach(input => {
        const hasLabel = input.labels && input.labels.length > 0;
        const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
        const isHidden = input.type === 'hidden';

        if (!isHidden && !hasLabel && !hasAriaLabel) {
            failed++;
            issues.push({
                type: 'missing-label',
                severity: 'critical',
                message: 'Form input missing label',
                element: getElementSelector(input),
                selector: getElementSelector(input),
                wcagRef: WCAG_REFS['missing-label'],
                suggestion: 'Add a <label> element or aria-label attribute to describe this input field.',
                fix: `Add <label for="${input.id || 'input-id'}">Label text</label> or aria-label="Label text"`
            });
        } else if (!isHidden) {
            passed++;
        }
    });

    return { passed, failed, issues, score: inputs.length > 0 ? Math.round((passed / inputs.length) * 100) : 100 };
}

/**
 * Check heading hierarchy
 */
function checkHeadings() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues = [];
    let passed = 0;
    let failed = 0;

    // Check for missing H1
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) {
        failed++;
        issues.push({
            type: 'heading-hierarchy',
            severity: 'warning',
            message: 'Page missing H1 heading',
            element: 'document',
            selector: 'body',
            wcagRef: WCAG_REFS['heading-hierarchy'],
            suggestion: 'Add a main H1 heading that describes the primary purpose of the page.',
            fix: 'Add <h1>Page Title</h1> at the top of your content'
        });
    } else if (h1Count > 1) {
        failed++;
        issues.push({
            type: 'heading-hierarchy',
            severity: 'notice',
            message: `Multiple H1 headings found (${h1Count})`,
            element: 'document',
            selector: 'h1',
            wcagRef: WCAG_REFS['heading-hierarchy'],
            suggestion: 'Use only one H1 per page for better document structure.',
            fix: 'Change extra H1 elements to H2 or lower'
        });
    }

    // Check for hierarchy skips
    let previousLevel = 0;
    headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1));
        if (previousLevel > 0 && level - previousLevel > 1) {
            failed++;
            issues.push({
                type: 'heading-hierarchy',
                severity: 'warning',
                message: `Heading hierarchy skip from H${previousLevel} to H${level}`,
                element: getElementSelector(heading),
                selector: getElementSelector(heading),
                wcagRef: WCAG_REFS['heading-hierarchy'],
                suggestion: 'Maintain proper heading hierarchy. Don\'t skip levels (e.g., H2 to H4).',
                fix: `Change this H${level} to H${previousLevel + 1}`
            });
        } else {
            passed++;
        }
        previousLevel = level;
    });

    return { passed, failed, issues, score: headings.length > 0 ? Math.round((passed / headings.length) * 100) : 100 };
}

/**
 * Check for ARIA landmarks
 */
function checkLandmarks() {
    const issues = [];
    const landmarks = {
        header: document.querySelector('header, [role="banner"]'),
        nav: document.querySelector('nav, [role="navigation"]'),
        main: document.querySelector('main, [role="main"]'),
        footer: document.querySelector('footer, [role="contentinfo"]')
    };

    let passed = 0;
    let failed = 0;

    Object.entries(landmarks).forEach(([name, element]) => {
        if (!element) {
            failed++;
            issues.push({
                type: 'missing-landmark',
                severity: 'warning',
                message: `Missing ${name} landmark`,
                element: 'document',
                selector: 'body',
                wcagRef: WCAG_REFS['missing-landmark'],
                suggestion: `Add a <${name}> element or role="${name === 'header' ? 'banner' : name === 'footer' ? 'contentinfo' : name}" to improve navigation.`,
                fix: `Add <${name}>...</${name}> or <div role="${name}">...</div>`
            });
        } else {
            passed++;
        }
    });

    return { passed, failed, issues, score: Math.round((passed / 4) * 100) };
}

/**
 * Check links for accessibility
 */
function checkLinks() {
    const links = document.querySelectorAll('a');
    const issues = [];
    let passed = 0;
    let failed = 0;

    const badLinkTexts = ['click here', 'read more', 'more', 'here', 'link'];

    links.forEach(link => {
        const text = link.textContent.trim().toLowerCase();
        const hasAriaLabel = link.hasAttribute('aria-label');

        if (text === '' && !hasAriaLabel) {
            failed++;
            issues.push({
                type: 'empty-link',
                severity: 'critical',
                message: 'Link with no text content',
                element: getElementSelector(link),
                selector: getElementSelector(link),
                wcagRef: WCAG_REFS['empty-link'],
                suggestion: 'Add descriptive text or aria-label to explain the link purpose.',
                fix: 'Add meaningful text between <a> tags or add aria-label="Link purpose"'
            });
        } else if (!hasAriaLabel && badLinkTexts.includes(text)) {
            failed++;
            issues.push({
                type: 'empty-link',
                severity: 'warning',
                message: `Non-descriptive link text: "${text}"`,
                element: getElementSelector(link),
                selector: getElementSelector(link),
                wcagRef: WCAG_REFS['empty-link'],
                suggestion: 'Use descriptive text that makes sense out of context.',
                fix: `Change "${text}" to describe where the link goes`
            });
        } else {
            passed++;
        }
    });

    return { passed, failed, issues, score: links.length > 0 ? Math.round((passed / links.length) * 100) : 100 };
}

/**
 * Check language attribute
 */
function checkLanguage() {
    const issues = [];
    const html = document.documentElement;
    const hasLang = html.hasAttribute('lang');

    if (!hasLang) {
        issues.push({
            type: 'missing-lang',
            severity: 'critical',
            message: 'Missing language attribute on <html>',
            element: 'html',
            selector: 'html',
            wcagRef: WCAG_REFS['missing-lang'],
            suggestion: 'Add lang attribute to the <html> element to indicate the page language.',
            fix: 'Add lang="en" (or appropriate language code) to <html> tag'
        });
        return { passed: 0, failed: 1, issues, score: 0 };
    }

    return { passed: 1, failed: 0, issues, score: 100 };
}

/**
 * Calculate overall accessibility score
 */
function calculateScore(checks) {
    const weights = {
        images: 15,
        forms: 20,
        headings: 15,
        landmarks: 15,
        links: 20,
        language: 15
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
        if (checks[key]) {
            totalScore += checks[key].score * weight;
            totalWeight += weight;
        }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Get top culprits affecting accessibility
 */
function getCulprits(checks) {
    const culprits = [];

    Object.entries(checks).forEach(([category, data]) => {
        if (data.failed > 0 && data.issues.length > 0) {
            // Group by issue type
            const typeCount = {};
            data.issues.forEach(issue => {
                typeCount[issue.type] = (typeCount[issue.type] || 0) + 1;
            });

            Object.entries(typeCount).forEach(([type, count]) => {
                const severity = data.issues.find(i => i.type === type)?.severity || 'warning';
                culprits.push({
                    type,
                    category,
                    count,
                    impact: severity,
                    score: -data.failed * 10 // Negative impact on score
                });
            });
        }
    });

    // Sort by impact and count
    culprits.sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, notice: 1 };
        const severityDiff = severityOrder[b.impact] - severityOrder[a.impact];
        if (severityDiff !== 0) return severityDiff;
        return b.count - a.count;
    });

    return culprits.slice(0, 5); // Top 5 culprits
}

/**
 * Main export function
 */
export function getAccessibilityData() {
    try {
        const checks = {
            images: checkImages(),
            forms: checkForms(),
            headings: checkHeadings(),
            landmarks: checkLandmarks(),
            links: checkLinks(),
            language: checkLanguage()
        };

        const score = calculateScore(checks);
        const culprits = getCulprits(checks);

        // Collect all issues
        const allIssues = {
            critical: [],
            warnings: [],
            notices: []
        };

        Object.values(checks).forEach(check => {
            check.issues.forEach(issue => {
                if (issue.severity === 'critical') {
                    allIssues.critical.push(issue);
                } else if (issue.severity === 'warning') {
                    allIssues.warnings.push(issue);
                } else {
                    allIssues.notices.push(issue);
                }
            });
        });

        return {
            score,
            culprits,
            issues: allIssues,
            checks
        };
    } catch (error) {
        console.error('[Accessibility] Error extracting data:', error);
        return {
            score: 0,
            culprits: [],
            issues: { critical: [], warnings: [], notices: [] },
            checks: {}
        };
    }
}
