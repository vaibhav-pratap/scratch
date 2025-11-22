/**
 * Schema extractor module (simplified)
 * Extracts and validates structured data (JSON-LD, Microdata)
 * Note: This is a simplified version. Full implementation in original content.js
 */

/**
 * Get schema/structured data
 */
export function getSchema() {
    const schemas = [];

    // Extract JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script, index) => {
        try {
            const data = JSON.parse(script.textContent);
            const type = data['@type'] || (Array.isArray(data) ? 'Multiple' : 'Unknown');
            schemas.push({
                type: Array.isArray(type) ? type.join(', ') : type,
                details: `JSON-LD #${index + 1}`,
                data: data,
                valid: true
            });
        } catch (e) {
            schemas.push({
                type: 'JSON-LD',
                details: 'Parse Error',
                data: {},
                valid: false
            });
        }
    });

    // Extract Microdata (simplified)
    const microdataItems = document.querySelectorAll('[itemscope]');
    microdataItems.forEach((item, index) => {
        const type = item.getAttribute('itemtype') || 'Unknown';
        schemas.push({
            type: type.split('/').pop() || 'Microdata',
            details: `Microdata #${index + 1}`,
            data: { itemtype: type },
            valid: true
        });
    });

    return schemas;
}
