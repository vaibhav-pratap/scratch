/**
 * Message handlers module
 * Handles incoming messages from popup/sidepanel
 */

import { toggleLinkHighlight } from '../highlighting/links.js';
import { highlightAccessibilityIssue, clearAccessibilityHighlights, toggleAccessibilityHighlights } from '../highlighting/accessibility.js';
import { highlightImage } from '../highlighting/images.js';
import { highlightPassiveVoice, highlightLongSentences, highlightSentencesWithoutTransitions, highlightLongParagraphs, highlightAllIssues, toggleContentHighlights, clearContentHighlights, scrollToText } from '../highlighting/content-quality.js';
import { highlightBySelector, clearHighlightsBySelector, clearAllHighlights } from '../highlighting/utils.js';

/**
 * Setup message listener
 */
export function setupMessageListener(extractDataFn) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getSEOData") {
            sendResponse(extractDataFn(request));
        } else if (request.action === "toggleNofollow") {
            toggleLinkHighlight('nofollow', request.enabled !== false);
        } else if (request.action === "toggleHighlight") {
            toggleLinkHighlight(request.linkType, request.enabled);
        } else if (request.action === "highlightAccessibilityIssue") {
            highlightAccessibilityIssue(request.selector, request.severity, request.message);
        } else if (request.action === "clearAccessibilityHighlights") {
            clearAccessibilityHighlights();
        } else if (request.action === "toggleAccessibilityHighlights") {
            toggleAccessibilityHighlights(request.enabled, request.issues);
        } else if (request.action === "highlightImage") {
            const result = highlightImage(request.src);
            sendResponse({ active: result });
            return true;
        } else if (request.action === "highlightPassiveVoice") {
            highlightPassiveVoice(request.sentences);
        } else if (request.action === "highlightLongSentences") {
            highlightLongSentences(request.sentences);
        } else if (request.action === "highlightSentencesWithoutTransitions") {
            highlightSentencesWithoutTransitions(request.sentences);
        } else if (request.action === "highlightLongParagraphs") {
            highlightLongParagraphs(request.paragraphs);
        } else if (request.action === "highlightAllContentIssues") {
            highlightAllIssues(request.issues);
        } else if (request.action === "toggleContentHighlights") {
            toggleContentHighlights(request.enabled, request.issues);
        } else if (request.action === "clearContentHighlights") {
            clearContentHighlights();
        } else if (request.action === "scrollToText") {
            scrollToText(request.text);
        } else if (request.action === "highlightElement") {
            const result = highlightBySelector(request.selector, request.label, request.type);
            sendResponse({ active: result });
            return true; // Keep channel open for async response
        } else if (request.action === "clearHighlights") {
            clearHighlightsBySelector(request.selector);
        } else if (request.action === "clearAllHighlights") {
            clearAllHighlights();
        }
    });
}
