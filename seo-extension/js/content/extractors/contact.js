/**
 * Contact extractor module
 * Extracts emails and phone numbers from the page
 */

/**
 * Get all email addresses
 */
export function getEmails() {
    const emails = new Set();

    // 1. Extract from mailto: links
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        const email = link.href.replace('mailto:', '').split('?')[0];
        if (email) emails.add(email.toLowerCase());
    });

    // 2. Extract from page text using regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const pageText = document.body.innerText;
    const matches = pageText.match(emailRegex);
    if (matches) {
        matches.forEach(email => emails.add(email.toLowerCase()));
    }

    // 3. Extract from meta tags
    document.querySelectorAll('meta[content*="@"]').forEach(meta => {
        const content = meta.getAttribute('content');
        const matches = content.match(emailRegex);
        if (matches) {
            matches.forEach(email => emails.add(email.toLowerCase()));
        }
    });

    return Array.from(emails).sort();
}

/**
 * Get all phone numbers
 */
export function getPhoneNumbers() {
    const phones = new Set();

    // 1. Extract from tel: links
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        const phone = link.href.replace('tel:', '').trim();
        const displayText = link.innerText.trim();
        if (phone) {
            phones.add(JSON.stringify({
                number: phone,
                display: displayText || phone
            }));
        }
    });

    // 2. Extract from page text using patterns
    const pageText = document.body.innerText;

    // International format
    const intlPattern = /\+\d{1,3}(?:[\s.-]?\d{2,4}){2,5}/g;
    let matches = pageText.match(intlPattern);
    if (matches) {
        matches.forEach(phone => {
            const digits = phone.replace(/\D/g, '');
            if (digits.length >= 10 && digits.length <= 15) {
                phones.add(JSON.stringify({ number: phone.trim(), display: phone.trim() }));
            }
        });
    }

    // US/CA format with parentheses
    const parensPattern = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    matches = pageText.match(parensPattern);
    if (matches) {
        matches.forEach(phone => {
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 10) {
                phones.add(JSON.stringify({ number: phone.trim(), display: phone.trim() }));
            }
        });
    }

    // Plain formatted numbers
    const plainPattern = /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/g;
    matches = pageText.match(plainPattern);
    if (matches) {
        matches.forEach(phone => {
            phones.add(JSON.stringify({ number: phone.trim(), display: phone.trim() }));
        });
    }

    // Convert back and remove duplicates
    const uniquePhones = Array.from(phones).map(p => JSON.parse(p));
    const seen = new Set();
    const filtered = uniquePhones.filter(phone => {
        const digits = phone.number.replace(/\D/g, '');
        if (seen.has(digits)) return false;
        seen.add(digits);
        return true;
    });

    return filtered.slice(0, 50);
}
