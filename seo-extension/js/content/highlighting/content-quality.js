/**
 * Content Quality Highlighting Module
 * Highlights sentences and paragraphs with readability or E-E-A-T issues
 */

/**
 * Highlight passive voice sentences on the page
 */
export function highlightPassiveVoice(sentences) {
    clearContentHighlights();

    if (!sentences || sentences.length === 0) return;

    sentences.forEach(sentenceText => {
        highlightSentenceByText(sentenceText, 'passive-voice');
    });
}

/**
 * Highlight long sentences on the page
 */
export function highlightLongSentences(sentences) {
    clearContentHighlights();

    if (!sentences || sentences.length === 0) return;

    sentences.forEach(sentenceText => {
        highlightSentenceByText(sentenceText, 'long-sentence');
    });
}

/**
 * Highlight sentences without transitional words
 */
export function highlightSentencesWithoutTransitions(sentences) {
    clearContentHighlights();

    if (!sentences || sentences.length === 0) return;

    sentences.forEach(sentenceText => {
        highlightSentenceByText(sentenceText, 'no-transition');
    });
}

/**
 * Highlight long paragraphs
 */
export function highlightLongParagraphs(paragraphs) {
    clearContentHighlights();

    if (!paragraphs || paragraphs.length === 0) return;

    paragraphs.forEach(paragraphText => {
        highlightParagraphByText(paragraphText, 'long-paragraph');
    });
}

/**
 * Highlight all content quality issues
 */
export function highlightAllIssues(issues) {
    clearContentHighlights();

    if (!issues) return;

    // Highlight passive voice
    if (issues.passiveVoice && issues.passiveVoice.length > 0) {
        issues.passiveVoice.forEach(sentence => {
            highlightSentenceByText(sentence, 'passive-voice');
        });
    }

    // Highlight long sentences
    if (issues.longSentences && issues.longSentences.length > 0) {
        issues.longSentences.forEach(sentence => {
            highlightSentenceByText(sentence, 'long-sentence');
        });
    }

    // Highlight sentences without transitions
    if (issues.sentencesWithoutTransitions && issues.sentencesWithoutTransitions.length > 0) {
        issues.sentencesWithoutTransitions.forEach(sentence => {
            highlightSentenceByText(sentence, 'no-transition');
        });
    }

    // Highlight long paragraphs
    if (issues.longParagraphs && issues.longParagraphs.length > 0) {
        issues.longParagraphs.forEach(paragraphText => {
            highlightParagraphByText(paragraphText, 'long-paragraph');
        });
    }
}

/**
 * Find and highlight a sentence by its text content
 */
function highlightSentenceByText(sentenceText, className) {
    if (!sentenceText || sentenceText.length < 10) return;

    // Normalize the text for matching
    const normalizedText = sentenceText.trim().toLowerCase().substring(0, 100);

    // Find all text nodes in main content
    const mainContent = getMainContentElement();
    if (!mainContent) return;

    const walker = document.createTreeWalker(
        mainContent,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Skip script, style, etc.
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tagName = parent.tagName.toLowerCase();
                if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const textNodes = [];
    let currentNode;
    while (currentNode = walker.nextNode()) {
        textNodes.push(currentNode);
    }

    // Search for matching text
    textNodes.forEach(node => {
        const nodeText = node.textContent.trim().toLowerCase();
        if (nodeText.includes(normalizedText.substring(0, 50))) {
            // Found the sentence, highlight its container
            let container = node.parentElement;

            // Find the closest appropriate container (p, li, div, etc.)
            while (container && !['P', 'LI', 'DIV', 'BLOCKQUOTE', 'TD', 'TH'].includes(container.tagName)) {
                container = container.parentElement;
            }

            if (container && !container.classList.contains('seo-ext-highlight')) {
                container.classList.add('seo-ext-highlight-content', `seo-ext-highlight-${className}`);
                container.setAttribute('data-seo-issue', className.replace(/-/g, ' '));
            }
        }
    });
}

/**
 * Find and highlight a paragraph by its text content
 */
function highlightParagraphByText(paragraphText, className) {
    if (!paragraphText || paragraphText.length < 50) return;

    const normalizedText = paragraphText.trim().toLowerCase().substring(0, 200);

    const mainContent = getMainContentElement();
    if (!mainContent) return;

    // Find all paragraph-like elements
    const paragraphs = mainContent.querySelectorAll('p, div, li, blockquote');

    paragraphs.forEach(para => {
        const paraText = para.textContent.trim().toLowerCase();
        if (paraText.includes(normalizedText.substring(0, 100))) {
            if (!para.classList.contains('seo-ext-highlight')) {
                para.classList.add('seo-ext-highlight-content', `seo-ext-highlight-${className}`);
                para.setAttribute('data-seo-issue', className.replace(/-/g, ' '));
            }
        }
    });
}

/**
 * Get main content element
 */
function getMainContentElement() {
    const selectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.main-content',
        '#content',
        '.post-content',
        '.article-content',
        '.entry-content'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }

    return document.body;
}

/**
 * Clear all content quality highlights
 */
export function clearContentHighlights() {
    document.querySelectorAll('.seo-ext-highlight-content').forEach(el => {
        el.classList.remove(
            'seo-ext-highlight-content',
            'seo-ext-highlight-passive-voice',
            'seo-ext-highlight-long-sentence',
            'seo-ext-highlight-long-paragraph',
            'seo-ext-highlight-no-transition'
        );
        el.removeAttribute('data-seo-issue');
    });
}

/**
 * Toggle content highlights
 */
export function toggleContentHighlights(enabled, issues) {
    if (enabled) {
        highlightAllIssues(issues);

        // Auto-clear after 10 seconds
        setTimeout(() => {
            clearContentHighlights();
        }, 10000);
    } else {
        clearContentHighlights();
    }
}


/**
 * Scroll to text snippet and highlight
 */
export function scrollToText(text) {
    if (!text) return;

    // Clean text (remove ellipsis if present from truncation)
    const cleanText = text.replace(/\.{3}$/, '').trim();
    if (cleanText.length < 10) return; // Too short to be unique

    // Find paragraph containing text
    const paragraphs = document.querySelectorAll('p, li, div');
    let target = null;

    for (const p of paragraphs) {
        // Skip hidden or empty elements
        if (p.offsetParent === null || !p.textContent) continue;
        
        // precise match check
        if (p.textContent.includes(cleanText)) {
            target = p;
            break;
        }
    }

    if (target) {
        // Scroll
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight effect
        const originalTransition = target.style.transition;
        const originalBg = target.style.backgroundColor;

        target.style.transition = 'background-color 0.5s ease';
        target.style.backgroundColor = 'rgba(255, 235, 59, 0.5)'; // Yellow highlight

        setTimeout(() => {
            target.style.backgroundColor = originalBg;
            setTimeout(() => {
                target.style.transition = originalTransition;
            }, 500);
        }, 2000);
    } else {
        console.warn('[SEO Extension] Could not find text to scroll to:', cleanText);
    }
}
