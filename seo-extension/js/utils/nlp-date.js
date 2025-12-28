/**
 * NLP Date Parser
 * Parses natural language date strings into Date objects and improved text.
 * Supports: "today", "tomorrow", "next [day]", "in X days", "weekend"
 */

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export function parseDateNaturalLanguage(text) {
    const today = new Date();
    let targetDate = null;
    let cleanText = text;

    // Regex Patterns
    const patterns = [
        {
            // "Tomorrow"
            regex: /\b(tomorrow|tmrw)\b/i,
            handler: () => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return d;
            }
        },
        {
            // "Today"
            regex: /\b(today)\b/i,
            handler: () => new Date()
        },
        {
            // "In X days"
            regex: /\bin (\d+) days?\b/i,
            handler: (match) => {
                const days = parseInt(match[1]);
                const d = new Date();
                const now = new Date();
                d.setDate(now.getDate() + days);
                return d;
            }
        },
        {
            // "Next [Day]" (e.g., "Next Monday")
            regex: /\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
            handler: (match) => {
                const targetDayIndex = DAYS.indexOf(match[1].toLowerCase());
                const d = new Date();
                const currentDayIndex = d.getDay();
                let daysUntil = targetDayIndex - currentDayIndex;
                if (daysUntil <= 0) daysUntil += 7; // If today or passed, go to next week's instance
                daysUntil += 7; // "Next" usually implies the week after the coming one
                d.setDate(d.getDate() + daysUntil);
                return d;
            }
        },
        {
            // Simple "[Day]" (e.g., "Monday") - assumes upcoming
            regex: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
            handler: (match) => {
                const targetDayIndex = DAYS.indexOf(match[1].toLowerCase());
                const d = new Date();
                const currentDayIndex = d.getDay();
                let daysUntil = targetDayIndex - currentDayIndex;
                if (daysUntil <= 0) daysUntil += 7;
                d.setDate(d.getDate() + daysUntil);
                return d;
            }
        }
    ];

    for (const p of patterns) {
        const match = cleanText.match(p.regex);
        if (match) {
            targetDate = p.handler(match);
            cleanText = cleanText.replace(p.regex, '');
            break; // Only parse one date
        }
    }

    // Attempt to parse standard date string if NLP failed but looks like date
    if (!targetDate) {
        // Very basic check, mainly relies on new Date() parsing
        // Improvements: Add specific format regex if needed
    }

    if (targetDate) {
        // Reset time to start of day or specific time?
        // Let's keep it simple: date objects with current time preserved or reset?
        // Usually due dates are date-based.
        targetDate.setHours(23, 59, 59, 999); // End of day
        return targetDate;
    }

    return null;
}

