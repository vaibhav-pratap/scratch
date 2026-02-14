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
    },
    'tabindex-positive': {
        criterion: '2.4.3 Focus Order',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html'
    },
    'media-captions': {
        criterion: '1.2.2 Captions (Prerecorded)',
        level: 'A',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html'
    }
};

/**
 * Color Utilities
 */
function parseRgb(color) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return null;
    return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1
    };
}

function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(fg, bg) {
    const l1 = getLuminance(fg.r, fg.g, fg.b);
    const l2 = getLuminance(bg.r, bg.g, bg.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function blendColors(fg, bg) {
    const alpha = fg.a;
    return {
        r: Math.round((1 - alpha) * bg.r + alpha * fg.r),
        g: Math.round((1 - alpha) * bg.g + alpha * fg.g),
        b: Math.round((1 - alpha) * bg.b + alpha * fg.b),
        a: 1
    };
}

function getEffectiveBackgroundColor(element) {
    let current = element;
    while (current) {
        const style = window.getComputedStyle(current);
        const color = parseRgb(style.backgroundColor);
        if (color && color.a === 1) return color;
        if (color && color.a > 0) {
            // Partial transparency - simplistic handling: assume white behind
            return blendColors(color, { r: 255, g: 255, b: 255, a: 1 });
        }
        current = current.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 }; // Default to white
}

/**
 * Check Color Contrast
 */
function checkContrast() {
    // Only check visible text elements to save performance
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (node) => {
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const style = window.getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }}
    );

    const issues = [];
    let checkedCount = 0;
    let failed = 0;
    const MAX_CHECKS = 200; // Limit checks to avoid freezing large pages

    while (walker.nextNode() && checkedCount < MAX_CHECKS) {
        const node = walker.currentNode;
        const element = node.parentElement;
        checkedCount++;

        const style = window.getComputedStyle(element);
        const fg = parseRgb(style.color);
        if (!fg || fg.a === 0) continue; // Invisible text

        const bg = getEffectiveBackgroundColor(element);
        
        // Handle transparent text color blending
        const effectiveFg = fg.a < 1 ? blendColors(fg, bg) : fg;

        const ratio = getContrastRatio(effectiveFg, bg);
        const fontSize = parseFloat(style.fontSize);
        const isBold = style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700;
        const isLarge = fontSize >= 24 || (fontSize >= 18.66 && isBold); // 18pt or 14pt bold

        const requiredRatio = isLarge ? 3 : 4.5;

        if (ratio < requiredRatio) {
            failed++;
            // Only report unique selectors to reduce noise
            const selector = getElementSelector(element);
            if (!issues.some(i => i.selector === selector)) {
                issues.push({
                    type: 'color-contrast',
                    severity: 'critical', // Treat as critical for visibility
                    message: `Low contrast ratio: ${ratio.toFixed(2)}:1 (Expected ${requiredRatio}:1)`,
                    element: selector,
                    selector: selector,
                    wcagRef: WCAG_REFS['color-contrast'],
                    suggestion: `Increase contrast between text color and background.`,
                    fix: `Change text color to a darker shade or background to lighter.`
                });
            }
        }
    }

    // Heuristic score
    return { 
        passed: checkedCount - failed, 
        failed, 
        issues, 
        score: checkedCount > 0 ? Math.round(((checkedCount - failed) / checkedCount) * 100) : 100 
    };
}

/**
 * Check Interactive Elements (Tabindex & Focus)
 */
function checkFocusable() {
    const elements = document.querySelectorAll('*[tabindex]');
    const issues = [];
    let passed = 0;
    let failed = 0;

    elements.forEach(el => {
        const tabIndex = parseInt(el.getAttribute('tabindex'));
        if (tabIndex > 0) {
            failed++;
            issues.push({
                type: 'tabindex-positive',
                severity: 'warning',
                message: 'Positive tabindex found',
                element: getElementSelector(el),
                selector: getElementSelector(el),
                wcagRef: WCAG_REFS['tabindex-positive'],
                suggestion: 'Avoid positive tabindex values as they disrupt natural tab order.',
                fix: 'Change tabindex to "0" or "-1"'
            });
        } else {
            passed++;
        }
    });

    return { 
        passed, 
        failed, 
        issues, 
        score: (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 100
    };
}

/**
 * Check Media Elements (Video/Audio)
 */
function checkMedia() {
    const media = document.querySelectorAll('video, audio');
    const issues = [];
    let passed = 0;
    let failed = 0;

    media.forEach(el => {
        const hasCaptions = el.querySelector('track[kind="captions"]');
        const isSilent = el.muted || el.volume === 0; // Rough check, not perfect

        if (!hasCaptions && !isSilent) {
            failed++;
            issues.push({
                type: 'media-captions',
                severity: 'warning',
                message: `<${el.tagName.toLowerCase()}> missing captions`,
                element: getElementSelector(el),
                selector: getElementSelector(el),
                wcagRef: WCAG_REFS['media-captions'],
                suggestion: 'Add captions for prerecorded audio/video content.',
                fix: 'Add <track kind="captions" src="..."> inside the media element'
            });
        } else {
            passed++;
        }
    });

    return { 
        passed, 
        failed, 
        issues, 
        score: media.length > 0 ? Math.round((passed / media.length) * 100) : 100
    };
}

/**
 * Get unique and precise selector for an element
 * Uses combination of ID, classes, nth-child, and path to ensure uniqueness
 */
function getElementSelector(element) {
    // If element has an ID, that's the most unique selector
    if (element.id) {
        return `#${CSS.escape(element.id)}`;
    }

    // Build a path from root to element
    const path = [];
    let current = element;

    while (current && current !== document.body && current !== document.documentElement) {
        let selector = current.tagName.toLowerCase();

        // Add classes if available (limit to most specific ones)
        if (current.className && typeof current.className === 'string') {
            const classes = current.className.split(' ')
                .filter(c => c && !c.startsWith('a11y-')) // Exclude our highlight classes
                .slice(0, 2)
                .map(c => CSS.escape(c))
                .join('.');
            if (classes) {
                selector += '.' + classes;
            }
        }

        // Add nth-child position for precision
        if (current.parentElement) {
            const siblings = Array.from(current.parentElement.children);
            const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);

            if (sameTagSiblings.length > 1) {
                const index = sameTagSiblings.indexOf(current) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }

        path.unshift(selector);
        current = current.parentElement;
    }

    // Return the full path (max 4 levels to avoid overly long selectors)
    return path.slice(-4).join(' > ');
}

/**
 * Store element references for highlighting
 * Maps selectors to actual DOM elements to improve reliability
 */
const elementReferences = new Map();

function storeElementReference(element, selector) {
    // Generate a unique key based on selector + index
    const key = selector;
    if (!elementReferences.has(key)) {
        elementReferences.set(key, element);
    }
    return key;
}

function getElementByStoredReference(selector) {
    // First try the stored reference
    if (elementReferences.has(selector)) {
        const element = elementReferences.get(selector);
        // Check if element still exists in DOM
        if (document.contains(element)) {
            return [element];
        }
        // If not, remove the stale reference
        elementReferences.delete(selector);
    }

    // Fall back to querySelectorAll
    return document.querySelectorAll(selector);
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
        images: 10,
        forms: 15,
        headings: 10,
        landmarks: 10,
        links: 15,
        language: 5,
        contrast: 20,
        interactive: 10,
        media: 5
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
            language: checkLanguage(),
            contrast: checkContrast(),
            interactive: checkFocusable(),
            media: checkMedia()
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
