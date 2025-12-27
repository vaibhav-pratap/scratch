/**
 * Excel Generator Module
 * Generates specific sheets for every tab's data
 */

export function generateExcel(data) {
    try {
        const { XLSX } = window;
        const wb = XLSX.utils.book_new();

        const addSheet = (name, content) => {
            let ws;
            if (Array.isArray(content)) {
                ws = XLSX.utils.json_to_sheet(content);
            } else {
                // If it's a flat object, turn into key-value pairs
                // If it's complex, we try to JSON stringify values
                const rows = Object.entries(content).map(([k, v]) => ({
                    Metric: k,
                    Value: typeof v === 'object' ? JSON.stringify(v) : v
                }));
                ws = XLSX.utils.json_to_sheet(rows);
            }
            XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31)); // Max sheet name length
        };

        // 1. Overview
        addSheet('Overview', {
            url: data.url,
            score: data.score,
            generated: data.exportDate,
            readability_score: data.readability?.score
        });

        // 2. Meta
        addSheet('Meta Tags', {
            title: data.title,
            description: data.description,
            robots: data.robots,
            canonical: data.canonical
        });

        // 3. Performance
        if (data.cwv) {
            addSheet('Core Web Vitals', data.cwv);
        }

        // 4. Headings
        addSheet('Headings', data.headings || []);

        // 5. Links
        const linkRows = [];
        (data.links?.internal || []).forEach(l => linkRows.push({ type: 'internal', ...l }));
        (data.links?.external || []).forEach(l => linkRows.push({ type: 'external', ...l }));
        addSheet('Links', linkRows);

        // 6. Content
        if (data.readability) {
            addSheet('Content Stats', data.readability);
        }

        // 7. Images
        if (data.images) {
            addSheet('Images', data.images);
        }

        // 8. Accessibility
        if (data.accessibility) {
            addSheet('Accessibility Score', {
                score: data.accessibility.score,
                critical: data.accessibility.critical,
                warning: data.accessibility.warning
            });
            if (data.accessibility.violations) {
                addSheet('Accessibility Issues', data.accessibility.violations);
            }
        }

        // 9. Schema
        if (data.schema && Array.isArray(data.schema)) {
            const schemaRows = data.schema.map(item => ({
                Type: item.type,
                Name: item.name || '',
                "Validation Status": item.status || 'Valid',
                "Raw JSON-LD": JSON.stringify(item.data || {}, null, 2) // Pretty print JSON
            }));
            addSheet('Schema', schemaRows);
        }

        // 10. Technology Stack
        addSheet('Technologies', data.technologies || []);

        // 10. Tags (Meta & Social)
        // Combine all tag-like data into one sheet
        const tagRows = [];
        if (data.meta) {
            Object.entries(data.meta).forEach(([k, v]) => {
                if (typeof v === 'object' && v.value) {
                    tagRows.push({ Category: 'Meta', Name: k, Value: v.value, Issues: v.issues ? v.issues.join('; ') : '' });
                }
            });
        }
        if (data.social) {
            Object.entries(data.social).forEach(([k, v]) => {
                tagRows.push({ Category: 'Social/OG/Twitter', Name: k, Value: v, Issues: '' });
            });
        }
        if (tagRows.length > 0) {
            addSheet('Tags', tagRows);
        }

        // 11. Keywords Performance (GSC)
        if (data.keywords && data.keywords.performance) {
            const kPerf = data.keywords.performance;
            if (kPerf.queries) {
                // Flatten query objects
                const qRows = kPerf.queries.map(q => ({
                    Query: q.keys ? q.keys[0] : q.query,
                    Clicks: q.clicks,
                    Impressions: q.impressions,
                    CTR: q.ctr,
                    Position: q.position
                }));
                addSheet('Search Console Queries', qRows);
            }
        }

        // 14. AI Analysis
        if (data.aiAnalysis) {
            const aiRows = [
                { Metric: 'Overall Rating', Value: data.aiAnalysis.overallRating },
                { Metric: 'Score', Value: data.aiAnalysis.overallScore },
                { Metric: 'Summary', Value: data.aiAnalysis.summary }
            ];
            addSheet('AI Insights', aiRows);

            if (data.aiAnalysis.detailedAnalysis) {
                // Try to format detailed analysis
                const detailedRows = Object.entries(data.aiAnalysis.detailedAnalysis).map(([k, v]) => ({
                    Category: k,
                    Score: v.score,
                    Status: v.status,
                    Analysis: v.analysis,
                    Recommendations: (v.recommendations || []).join('; ')
                }));
                addSheet('AI Detailed', detailedRows);
            }
        }

        // Download
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seo-full-audit-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

    } catch (e) {
        console.error("Excel generation failed:", e);
        alert("Failed to generate Excel file. see console.");
    }
}
