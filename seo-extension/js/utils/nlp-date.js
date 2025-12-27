/**
 * NLP Date Parser
 * Parses natural language date strings into Date objects and improved text.
 * Supports: "today", "tomorrow", "next [day]", "in X days", "weekend"
 */

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export function parseTodoInput(text) {
    let cleanText = text;
    let dueDate = null;
    let priority = 'medium';
    let tags = [];

    const lowerText = text.toLowerCase();

    // --- Priority Parsing ---
    if (lowerText.includes('!high') || lowerText.includes('!urgent')) {
        priority = 'high';
        cleanText = cleanText.replace(/!(high|urgent)/gi, '');
    } else if (lowerText.includes('!low')) {
        priority = 'low';
        cleanText = cleanText.replace(/!low/gi, '');
    } else if (lowerText.includes('!medium')) {
        priority = 'medium';
        cleanText = cleanText.replace(/!medium/gi, '');
    }

    // --- Date Parsing ---
    const dateResult = parseDate(cleanText);
    if (dateResult.date) {
        dueDate = dateResult.date;
        cleanText = dateResult.cleanText;
    }

    // --- Tag Parsing (#tag) ---
    const tagMatch = cleanText.match(/#(\w+)/g);
    if (tagMatch) {
        tags = tagMatch.map(t => t.substring(1)); // Remove #
        cleanText = cleanText.replace(/#(\w+)/g, '');
    }

    // Cleanup extra spaces
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    return {
        text: cleanText,
        dueDate,
        priority,
        tags
    };
}

function parseDate(text) {
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
                d.setDate(d.getDate() + days);
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
                daysUntil += 7; // "Next" usually implies the week after the coming one, but loosely means "upcoming". 
                // Let's standardise: "Monday" = upcoming Monday. "Next Monday" = Monday of next week.
                // For simplicity in this v1, let's treat "Next Monday" as just 7 + days until.
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
            // Set to end of day? Or keep time? Let's default to today's time or 9am?
            // User just cares about the date usually.
            cleanText = cleanText.replace(p.regex, '');
            break; // Only parse one date
        }
    }

    return {
        date: targetDate ? targetDate.getTime() : null, // Store as timestamp
        cleanText
    };
}
