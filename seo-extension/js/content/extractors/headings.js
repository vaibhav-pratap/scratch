/**
 * Headings extractor module
 * Extracts h1-h6 headings from the page
 */

/**
 * Get all headings from the page
 */
export function getHeadings() {
    const headings = [];
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headers.forEach(header => {
        headings.push({
            tag: header.tagName.toLowerCase(),
            text: header.innerText.trim().substring(0, 100) // Truncate for display
        });
    });
    return headings;
}
