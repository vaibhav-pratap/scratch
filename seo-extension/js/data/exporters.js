/**
 * Data exporters module
 * Functions for exporting SEO data in various formats
 */

/**
 * Download data as PDF
 */
// export function downloadPDF(data) {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();

//     doc.setFontSize(20);
//     doc.text("SEO Analysis Report", 10, 10);

//     doc.setFontSize(12);
//     doc.text(`URL: ${data.url || 'Current Page'}`, 10, 20);
//     doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 26);
//     doc.text(`Score: ${data.score || 0}/100`, 10, 32);

//     let y = 40;

//     // Meta
//     doc.setFontSize(14);
//     doc.text("Meta Information", 10, y);
//     y += 6;
//     doc.setFontSize(10);
//     doc.text(`Title: ${data.title || 'Missing'}`, 10, y); y += 6;
//     doc.text(`Description: ${data.description || 'Missing'}`, 10, y); y += 6;
//     y += 4;

//     // CWV
//     if (data.cwv) {
//         doc.setFontSize(14);
//         doc.text("Core Web Vitals", 10, y);
//         y += 6;
//         doc.setFontSize(10);
//         doc.text(`LCP: ${Math.round(data.cwv.lcp || 0)} ms`, 10, y); y += 6;
//         doc.text(`CLS: ${(data.cwv.cls || 0).toFixed(3)}`, 10, y); y += 6;
//         doc.text(`INP: ${Math.round(data.cwv.inp || 0)} ms`, 10, y); y += 6;
//         y += 4;
//     }

//     // Readability
//     if (data.readability) {
//         doc.setFontSize(14);
//         doc.text("Readability", 10, y);
//         y += 6;
//         doc.setFontSize(10);
//         doc.text(`Score: ${data.readability.score}`, 10, y); y += 6;
//         doc.text(`Level: ${data.readability.level}`, 10, y); y += 6;
//         y += 4;
//     }

//     // Headings
//     doc.setFontSize(14);
//     doc.text("Headings Structure", 10, y);
//     y += 6;
//     doc.setFontSize(10);
//     const hCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
//     (data.headings || []).forEach(h => {
//         const tag = h.tag.toLowerCase();
//         if (hCounts[tag] !== undefined) hCounts[tag]++;
//     });
//     doc.text(`H1: ${hCounts.h1}, H2: ${hCounts.h2}, H3: ${hCounts.h3}`, 10, y);
//     y += 10;

//     // Links
//     doc.setFontSize(14);
//     doc.text("Links", 10, y);
//     y += 6;
//     doc.setFontSize(10);
//     doc.text(`Internal: ${data.links?.internal?.length || 0}`, 10, y); y += 6;
//     doc.text(`External: ${data.links?.external?.length || 0}`, 10, y); y += 6;

//     doc.save("seo-report.pdf");
// }

/**
 * Download data as PDF (Material 3 Detailed Report)
 */
export function downloadPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- Material 3 Design System Colors ---
    const CARD_COLOR_LOW = '#F7F2F8';     // Surface Container Low (Card background)
    const PRIMARY_COLOR = '#6750A4';      // Primary (Titles, emphasis)
    const ON_SURFACE_COLOR = '#1D1B20';   // On-Surface (Main text)
    const OUTLINE_COLOR = '#CAC4D0';      // Outline (Subtle dividers)
    const SUCCESS_COLOR = '#4CAF50';      // Status: Good
    const WARNING_COLOR = '#FF9800';      // Status: Needs Improvement
    const DANGER_COLOR = '#F44336';       // Status: Poor
    const H_COLOR = '#49454F';            // Heading color (On-Surface Variant)

    const PAGE_MARGIN = 15;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const CARD_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN;
    const COL_WIDTH = (CARD_WIDTH / 2) - 3;
    const CARD_CORNER_RADIUS = 4;
    let y = 15; // Starting Y position

    // --- Helper Functions ---

    function drawCard(doc, x, y, w, h, radius, color) {
        doc.setFillColor(color);
        doc.setDrawColor(OUTLINE_COLOR);
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, w, h, radius, radius, 'F');
    }

    function checkPageBreak(currentY, minSpaceRequired) {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (currentY + minSpaceRequired > pageHeight - 15) {
            doc.addPage();
            return 15; // Reset Y position
        }
        return currentY;
    }

    function getMetricStatus(label, value) {
        let status = 'Missing';
        let color = DANGER_COLOR;
        let unit = '';
        let formattedValue = value;

        if (value === null || value === undefined || value === '') return { status, color, formattedValue: 'N/A' };

        // Ensure value is a number for comparisons
        const numericValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numericValue)) return { status: 'Invalid', color: DANGER_COLOR, formattedValue: value };

        if (label === 'LCP') {
            unit = ' ms'; formattedValue = `${Math.round(numericValue)}`;
            if (numericValue <= 2500) { status = 'Good'; color = SUCCESS_COLOR; }
            else if (numericValue <= 4000) { status = 'Needs Improvement'; color = WARNING_COLOR; }
            else { status = 'Poor'; color = DANGER_COLOR; }
        } else if (label === 'CLS') {
            unit = ''; formattedValue = numericValue.toFixed(3);
            if (numericValue <= 0.1) { status = 'Good'; color = SUCCESS_COLOR; }
            else if (numericValue <= 0.25) { status = 'Needs Improvement'; color = WARNING_COLOR; }
            else { status = 'Poor'; color = DANGER_COLOR; }
        } else if (label === 'INP') {
            unit = ' ms'; formattedValue = `${Math.round(numericValue)}`;
            if (numericValue <= 200) { status = 'Good'; color = SUCCESS_COLOR; }
            else if (numericValue <= 500) { status = 'Needs Improvement'; color = WARNING_COLOR; }
            else { status = 'Poor'; color = DANGER_COLOR; }
        } else if (label === 'FCP') {
            unit = ' ms'; formattedValue = `${Math.round(numericValue)}`;
            if (numericValue <= 1800) { status = 'Good'; color = SUCCESS_COLOR; }
            else if (numericValue <= 3000) { status = 'Needs Improvement'; color = WARNING_COLOR; }
            else { status = 'Poor'; color = DANGER_COLOR; }
        } else if (label === 'TTFB') {
            unit = ' ms'; formattedValue = `${Math.round(numericValue)}`;
            if (numericValue <= 800) { status = 'Good'; color = SUCCESS_COLOR; }
            else if (numericValue <= 1800) { status = 'Needs Improvement'; color = WARNING_COLOR; }
            else { status = 'Poor'; color = DANGER_COLOR; }
        }

        return { status, color, formattedValue: formattedValue + unit };
    }


    // --- 1. Header and Score Card ---
    doc.setTextColor(PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text("SEO Analysis Report", PAGE_MARGIN, y);
    y += 10;

    // Score Card
    const scoreCardHeight = 25;
    drawCard(doc, PAGE_MARGIN, y, CARD_WIDTH, scoreCardHeight, CARD_CORNER_RADIUS, CARD_COLOR_LOW);
    doc.setTextColor(PRIMARY_COLOR);
    doc.setFontSize(18);
    doc.text(`Overall Score: ${data.score || 0}/100`, PAGE_MARGIN + 5, y + 10);
    doc.setTextColor(ON_SURFACE_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`URL: ${data.url || 'Current Page'}`, PAGE_MARGIN + 5, y + 16);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, PAGE_MARGIN + 5, y + 22);
    y += scoreCardHeight + 15;

    // --- 2. Core Web Vitals (Individual Cards) ---

    y = checkPageBreak(y, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("Performance Metrics", PAGE_MARGIN, y);
    y += 5;

    const perfMetrics = [
        { label: 'LCP', value: data.cwv?.lcp, element: data.cwv?.lcpElement },
        { label: 'CLS', value: data.cwv?.cls, element: data.cwv?.clsElement },
        { label: 'INP', value: data.cwv?.inp, element: data.cwv?.inpElement },
        { label: 'FCP', value: data.fcp, element: data.fcpElement },
        { label: 'TTFB', value: data.ttfb, element: data.ttfbElement }
    ];

    const METRIC_COL_WIDTH = (CARD_WIDTH - 4) / 3; // Three metrics per row
    const X_START = PAGE_MARGIN;
    const X_SPACING = 3;

    // Helper to draw a single CWV metric card
    function drawMetricCard(metric, x, y) {
        const { status, color, formattedValue } = getMetricStatus(metric.label, metric.value);
        const cardH = 30; // Card height for metric + element

        drawCard(doc, x, y, METRIC_COL_WIDTH, cardH, CARD_CORNER_RADIUS, CARD_COLOR_LOW);

        // Metric Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(PRIMARY_COLOR);
        doc.text(metric.label, x + 3, y + 6);

        // Status Badge 
        const STATUS_WIDTH = 20;
        doc.setFillColor(color);
        doc.setDrawColor(color);
        doc.rect(x + METRIC_COL_WIDTH - STATUS_WIDTH - 2, y + 3, STATUS_WIDTH, 3, 'F');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(status, x + METRIC_COL_WIDTH - STATUS_WIDTH / 2 - 2, y + 5, { align: 'center' });

        // Value
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(ON_SURFACE_COLOR);
        doc.text(formattedValue, x + 3, y + 14);

        // Element (Caption size)
        doc.setFontSize(7);
        doc.setTextColor(H_COLOR);
        const elementText = `Element: ${metric.element || 'N/A'}`;
        const elementLines = doc.splitTextToSize(elementText, METRIC_COL_WIDTH - 6);
        doc.text(elementLines, x + 3, y + 22);
    }

    // Draw the CWV cards in two rows (3 + 2)
    let cwvY = y + 5;
    for (let i = 0; i < 3 && perfMetrics[i]; i++) {
        drawMetricCard(perfMetrics[i], X_START + i * (METRIC_COL_WIDTH + X_SPACING), cwvY);
    }
    cwvY += 35; // Move down for the next row

    for (let i = 3; i < 5 && perfMetrics[i]; i++) {
        // Center the last two metrics
        const offset = (CARD_WIDTH - 2 * METRIC_COL_WIDTH - X_SPACING) / 2;
        drawMetricCard(perfMetrics[i], X_START + (i - 3) * (METRIC_COL_WIDTH + X_SPACING) + offset, cwvY);
    }
    y = cwvY + 35;

    // --- 3. Metadata & Technical Summary (Full Width Card) ---

    y = checkPageBreak(y, 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("Metadata & Technical Summary", PAGE_MARGIN, y);
    y += 5;

    const summaryCardH = 90; // Increased height
    drawCard(doc, PAGE_MARGIN, y, CARD_WIDTH, summaryCardH, CARD_CORNER_RADIUS, CARD_COLOR_LOW);

    // LEFT (Meta & Readability)
    let summaryY = y + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text("Page Meta:", PAGE_MARGIN + 3, summaryY); summaryY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(ON_SURFACE_COLOR);
    doc.text(`Title: ${data.title || 'Missing'}`, PAGE_MARGIN + 3, summaryY); summaryY += 5;
    doc.text(`Description: ${data.description || 'Missing'}`, PAGE_MARGIN + 3, summaryY); summaryY += 5;
    doc.text(`Keywords: ${data.keywords || 'Missing'}`, PAGE_MARGIN + 3, summaryY); summaryY += 10;

    // Readability
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text("Readability:", PAGE_MARGIN + 3, summaryY); summaryY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(ON_SURFACE_COLOR);
    doc.text(`Score: ${data.readability?.score || 'N/A'} / Level: ${data.readability?.level || 'N/A'}`, PAGE_MARGIN + 3, summaryY); summaryY += 10;

    // Link Counts
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text("Link Counts:", PAGE_MARGIN + 3, summaryY); summaryY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(ON_SURFACE_COLOR);
    doc.text(`Internal: ${data.links?.internal?.length || 0}`, PAGE_MARGIN + 3, summaryY); summaryY += 5;
    doc.text(`External: ${data.links?.external?.length || 0}`, PAGE_MARGIN + 3, summaryY);


    // RIGHT (Technical & Social)
    summaryY = y + 5;
    const RIGHT_X = PAGE_MARGIN + COL_WIDTH + 6;
    doc.setDrawColor(OUTLINE_COLOR);
    doc.setLineWidth(0.2);
    doc.line(PAGE_MARGIN + CARD_WIDTH / 2, y + 3, PAGE_MARGIN + CARD_WIDTH / 2, y + summaryCardH - 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text("Technical & Social Tags:", RIGHT_X, summaryY); summaryY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(ON_SURFACE_COLOR);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Schema Types:", RIGHT_X, summaryY); summaryY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const schemaTypes = (data.schema?.types || ['Not Detected']).join(', ');
    doc.text(doc.splitTextToSize(schemaTypes, COL_WIDTH - 6), RIGHT_X, summaryY); summaryY += 8;
    doc.text(`Schema Valid: ${data.schema?.valid ? 'Yes' : 'No'}`, RIGHT_X, summaryY); summaryY += 10;

    // Social Tags
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Open Graph:", RIGHT_X, summaryY); summaryY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Title: ${data.og?.title || 'Missing'}`, RIGHT_X, summaryY); summaryY += 5;
    doc.text(`Image: ${data.og?.image ? 'Present' : 'Missing'}`, RIGHT_X, summaryY); summaryY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Twitter Card:", RIGHT_X, summaryY); summaryY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Card Type: ${data.twitter?.card || 'Missing'}`, RIGHT_X, summaryY); summaryY += 5;
    doc.text(`Image: ${data.twitter?.image ? 'Present' : 'Missing'}`, RIGHT_X, summaryY);

    y += summaryCardH + 10;

    // --- 4. Detailed Sections (Dynamic Paging) ---

    // 4a. Headings Structure (Detailed List)
    y = checkPageBreak(y, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("Headings Structure Detail", PAGE_MARGIN, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(H_COLOR);
    doc.text("Tag", PAGE_MARGIN + 5, y + 5);
    doc.text("Text Content", PAGE_MARGIN + 30, y + 5);
    y += 8;

    doc.setDrawColor(OUTLINE_COLOR);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + CARD_WIDTH, y);

    let currentY = y + 5;
    (data.headings || []).forEach(h => {
        currentY = checkPageBreak(currentY, 15);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PRIMARY_COLOR);
        doc.text(h.tag, PAGE_MARGIN + 5, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(ON_SURFACE_COLOR);
        const textLines = doc.splitTextToSize(h.text || 'No Content', CARD_WIDTH - 35);
        doc.text(textLines, PAGE_MARGIN + 30, currentY);
        currentY += textLines.length * 4 + 3;
    });
    y = currentY + 5;


    // 4b. Link & Contact Lists (Requires its own page for clarity)

    // Add a dedicated page for detailed lists
    doc.addPage();
    y = 15;

    // External Links List
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("External Links List", PAGE_MARGIN, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(H_COLOR);
    doc.text("External URL (Text)", PAGE_MARGIN + 5, y);
    y += 5;

    doc.setDrawColor(OUTLINE_COLOR);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + CARD_WIDTH, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(ON_SURFACE_COLOR);
    (data.links?.external || []).forEach(link => {
        y = checkPageBreak(y, 10);
        const linkText = `${link.href} (${link.text || 'N/A'})`;
        const linkLines = doc.splitTextToSize(linkText, CARD_WIDTH - 10);
        doc.text(linkLines, PAGE_MARGIN + 5, y);
        y += linkLines.length * 4 + 3;
    });

    // Emails List
    y = checkPageBreak(y, 30);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("Emails Found", PAGE_MARGIN, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(H_COLOR);
    doc.text("Email Address", PAGE_MARGIN + 5, y);
    y += 5;

    doc.setDrawColor(OUTLINE_COLOR);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + CARD_WIDTH, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(ON_SURFACE_COLOR);
    (data.emails || []).forEach(email => {
        y = checkPageBreak(y, 10);
        doc.text(email, PAGE_MARGIN + 5, y);
        y += 6;
    });

    // Phone Numbers List
    y = checkPageBreak(y, 30);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("Phone Numbers Found", PAGE_MARGIN, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(H_COLOR);
    doc.text("Phone Number (Display)", PAGE_MARGIN + 5, y);
    y += 5;

    doc.setDrawColor(OUTLINE_COLOR);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + CARD_WIDTH, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(ON_SURFACE_COLOR);
    // Assuming phones data is an array of objects like { number: '...', display: '...' }
    (data.phones || []).forEach(phone => {
        y = checkPageBreak(y, 10);
        const display = phone.display || phone.number;
        doc.text(display, PAGE_MARGIN + 5, y);
        y += 6;
    });

    // --- Save PDF ---
    doc.save("seo-report-detailed-m3.pdf");
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
