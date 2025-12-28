
import { parseDateNaturalLanguage } from './nlp-date.js';
import { extractHashtags } from './hashtags.js';

/**
 * Parses a raw todo input string to extract metadata
 * 
 * Supported patterns:
 * - Priority: !high, !medium, !low, !urgent
 * - Tags: #tag1 #tag2
 * - Due Date: @today, @tomorrow, @friday, @dec 25
 */
export function parseTodoInput(input) {
    let text = input;
    let priority = 'medium';
    let dueDate = null;
    let tags = [];

    // 1. Extract Priority
    const priorityRegex = /!(high|medium|low|urgent)/i;
    const priorityMatch = text.match(priorityRegex);
    if (priorityMatch) {
        priority = priorityMatch[1].toLowerCase();
        if (priority === 'urgent') priority = 'high';
        text = text.replace(priorityRegex, '').trim();
    }

    // 2. Extract Tags
    // We use our existing utility if possible, but for now simple regex
    const tagRegex = /#[\w-]+/g;
    const tagMatches = text.match(tagRegex);
    if (tagMatches) {
        tags = tagMatches.map(t => t.substring(1)); // remove #
        text = text.replace(tagRegex, '').trim();
    }

    // Also try helper if didn't catch specific unicode etc, 
    // but regex covers most standard cases.

    // 3. Extract Due Date
    // Look for @date pattern
    const dateRegex = /@([^@#]+)/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
        const potentialDate = dateMatch[1].trim();
        const parsed = parseDateNaturalLanguage(potentialDate);
        if (parsed) {
            dueDate = parsed.getTime();
            text = text.replace(dateRegex, '').trim();
        }
    }

    // Cleanup extra spaces
    text = text.replace(/\s+/g, ' ').trim();

    return {
        text,
        priority,
        dueDate,
        tags
    };
}
