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

    // Helper to extract type from an object
    const extractType = (data) => {
        if (!data) return 'Unknown';
        if (Array.isArray(data)) return 'Multiple';
        if (typeof data === 'string') return data;
        return data['@type'] || 'Unknown';
    };

    // Helper to process a JSON-LD object
    const processJsonLd = (data, index, context = '') => {
        if (!data) return;

        if (Array.isArray(data)) {
            data.forEach((item, i) => processJsonLd(item, index, `${context}[${i}]`));
            return;
        }

        if (data['@graph'] && Array.isArray(data['@graph'])) {
            data['@graph'].forEach((item, i) => processJsonLd(item, index, `${context}.@graph[${i}]`));
            return;
        }

        const type = extractType(data);
        if (type !== 'Unknown') {
            // Try to find a human-readable label
            let label = data.name || data.headline || data.url || data.description || data.author?.name || '';
            if (label && label.length > 50) label = label.substring(0, 47) + '...';

            // Fallback if no label found
            if (!label) {
                // Clean up context to be less technical if possible, or just use index
                label = `Item ${index + 1}`;
            }

            schemas.push({
                type: Array.isArray(type) ? type.join(', ') : type,
                details: label,
                data: data,
                valid: true
            });
        }
    };

    // Extract JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script, index) => {
        try {
            const data = JSON.parse(script.textContent);
            processJsonLd(data, index);
        } catch (e) {
            schemas.push({
                type: 'JSON-LD',
                details: 'Parse Error',
                data: { error: e.message },
                valid: false
            });
        }
    });

    // Extract Microdata
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
