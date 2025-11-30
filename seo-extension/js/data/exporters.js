/**
 * Data exporters module
 * Functions for exporting SEO data in various formats
 */

/**
 * Download data as PDF
 */
export function downloadPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("SEO Analysis Report", 10, 10);

    doc.setFontSize(12);
    doc.text(`URL: ${data.url || 'Current Page'}`, 10, 20);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 26);
    doc.text(`Score: ${data.score || 0}/100`, 10, 32);

    let y = 40;

    // Meta
    doc.setFontSize(14);
    doc.text("Meta Information", 10, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Title: ${data.title || 'Missing'}`, 10, y); y += 6;
    doc.text(`Description: ${data.description || 'Missing'}`, 10, y); y += 6;
    y += 4;

    // CWV
    if (data.cwv) {
        doc.setFontSize(14);
        doc.text("Core Web Vitals", 10, y);
        y += 6;
        doc.setFontSize(10);
        doc.text(`LCP: ${Math.round(data.cwv.lcp || 0)} ms`, 10, y); y += 6;
        doc.text(`CLS: ${(data.cwv.cls || 0).toFixed(3)}`, 10, y); y += 6;
        doc.text(`INP: ${Math.round(data.cwv.inp || 0)} ms`, 10, y); y += 6;
        y += 4;
    }

    // Readability
    if (data.readability) {
        doc.setFontSize(14);
        doc.text("Readability", 10, y);
        y += 6;
        doc.setFontSize(10);
        doc.text(`Score: ${data.readability.score}`, 10, y); y += 6;
        doc.text(`Level: ${data.readability.level}`, 10, y); y += 6;
        y += 4;
    }

    // Headings
    doc.setFontSize(14);
    doc.text("Headings Structure", 10, y);
    y += 6;
    doc.setFontSize(10);
    const hCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    (data.headings || []).forEach(h => {
        const tag = h.tag.toLowerCase();
        if (hCounts[tag] !== undefined) hCounts[tag]++;
    });
    doc.text(`H1: ${hCounts.h1}, H2: ${hCounts.h2}, H3: ${hCounts.h3}`, 10, y);
    y += 10;

    // Links
    doc.setFontSize(14);
    doc.text("Links", 10, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Internal: ${data.links?.internal?.length || 0}`, 10, y); y += 6;
    doc.text(`External: ${data.links?.external?.length || 0}`, 10, y); y += 6;

    doc.save("seo-report.pdf");
}

/**
 * Download data as Excel
 */
export function downloadExcel(data) {
    try {
        const wb = XLSX.utils.book_new();

        // Helper to add a sheet
        const addSheet = (name, content) => {
            let ws;
            if (Array.isArray(content)) {
                ws = XLSX.utils.json_to_sheet(content);
            } else {
                const rows = Object.entries(content).map(([k, v]) => ({ key: k, value: v }));
                ws = XLSX.utils.json_to_sheet(rows);
            }
            XLSX.utils.book_append_sheet(wb, ws, name);
        };

        // Add sheets
        addSheet('Overview', { score: data.score || 0 });
        addSheet('Meta', {
            title: data.title || '',
            description: data.description || '',
            keywords: data.keywords || '',
            canonical: data.canonical || '',
            robots: data.robots || ''
        });
        addSheet('Open Graph', data.og || {});
        addSheet('Twitter Card', data.twitter || {});
        addSheet('Headings', data.headings || []);
        addSheet('Images', data.images || []);

        const links = [];
        (data.links?.internal || []).forEach(l => links.push({ type: 'internal', href: l.href, text: l.text }));
        (data.links?.external || []).forEach(l => links.push({ type: 'external', href: l.href, text: l.text }));
        addSheet('Links', links);

        addSheet('Schema', data.schema || []);
        addSheet('Hreflang', data.hreflang || []);
        addSheet('PAA', (data.paa || []).map(q => ({ question: q })));
        addSheet('Emails', (data.emails || []).map(e => ({ email: e })));
        addSheet('Phones', (data.phones || []).map(p => ({ number: p.number, display: p.display })));

        // Generate workbook
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seo-data-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        console.error('Excel export failed', e);
        downloadJSON(data); // Fallback
    }
}

/**
 * Download data as JSON
 */
export function downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Download data as CSV
 */
export function downloadCSV(data) {
    try {
        const ws = XLSX.utils.json_to_sheet([data]);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seo-data-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        console.error('CSV export failed', e);
        downloadJSON(data); // Fallback
    }
}

/**
 * Main download function
 */
export function downloadData(data, format) {
    switch (format) {
        case 'excel':
            downloadExcel(data);
            break;
        case 'csv':
            downloadCSV(data);
            break;
        case 'pdf':
            downloadPDF(data);
            break;
        default:
            downloadJSON(data);
    }
}