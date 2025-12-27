/**
 * PDF Generator Module
 * Generates professional PDF reports with all available SEO data
 */

export function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Config
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    // Colors
    const colorPrimary = [26, 115, 232]; // Blue 600
    const colorSecondary = [95, 99, 104]; // Grey 700
    const colorText = [32, 33, 36]; // Dark Grey
    const colorLight = [232, 234, 237]; // Light Grey BG

    // --- Helpers ---
    const resetFont = () => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...colorText);
    };

    const checkPageBreak = (heightNeeded) => {
        if (y + heightNeeded > pageHeight - margin) {
            doc.addPage();
            y = margin;
            return true;
        }
        return false;
    };

    const addSectionTitle = (title) => {
        checkPageBreak(25);
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...colorPrimary);
        doc.text(title, margin, y);
        doc.setDrawColor(...colorLight);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 12;
        resetFont();
    };

    const addDetail = (label, value) => {
        checkPageBreak(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colorSecondary);
        doc.text(`${label}:`, margin, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colorText);

        const valueStr = String(value || '--');
        const splitValue = doc.splitTextToSize(valueStr, contentWidth - 40);
        doc.text(splitValue, margin + 40, y);

        y += (splitValue.length * 5) + 2;
    };

    // --- REPORT CONTENT ---

    // Header
    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("SEO Audit Report", margin, 25);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 25);
    y = 55;

    // Executive Summary
    resetFont();
    doc.setFontSize(11);
    const url = data.url || 'Analyzed URL';
    const splitUrl = doc.splitTextToSize(url, contentWidth);

    doc.setFont("helvetica", "bold");
    doc.text("Target URL:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(splitUrl, margin + 25, y);
    y += (splitUrl.length * 6) + 10;

    // Core Scores
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, 50, 30, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...colorSecondary);
    doc.text("Overall Score", margin + 10, y + 10);
    doc.setFontSize(18);
    doc.setTextColor(...colorPrimary);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.score || 0}`, margin + 10, y + 22);

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin + 60, y, 50, 30, 3, 3, 'F');
    resetFont();
    doc.setFontSize(10);
    doc.setTextColor(...colorSecondary);
    doc.text("Readability", margin + 70, y + 10);
    doc.setFontSize(18);
    doc.setTextColor(...colorText);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.readability?.score || 0}`, margin + 70, y + 22);
    y += 45;

    // Standard Sections
    addSectionTitle("Meta Information");
    addDetail("Title", data.title);
    addDetail("Length", `${data.title ? data.title.length : 0} chars`);
    addDetail("Description", data.description);
    addDetail("Length", `${data.description ? data.description.length : 0} chars`);
    addDetail("Canonical", data.canonical);
    addDetail("Robots", data.robots);

    addSectionTitle("Core Web Vitals");
    if (data.cwv) {
        addDetail("LCP", `${Math.round(data.cwv.lcp?.value || 0)} ms`);
        addDetail("CLS", (data.cwv.cls?.value || 0).toFixed(3));
        addDetail("INP", `${Math.round(data.cwv.inp?.value || 0)} ms`);
    } else {
        doc.text("No field data available.", margin, y); y += 7;
    }

    addSectionTitle("Content & Headings");
    if (data.headings && data.headings.length > 0) {
        // Print every single headline
        data.headings.forEach(h => {
            checkPageBreak(8);
            const indent = h.tag ? (parseInt(h.tag.replace('h', '').replace('H', '')) || 1) * 2 : 2;
            const prefix = h.tag ? h.tag.toUpperCase() : 'H?';
            const hText = doc.splitTextToSize(`${prefix}: ${h.text}`, contentWidth - indent);
            doc.text(hText, margin + indent, y);
            y += (hText.length * 5) + 2;
        });
    } else {
        doc.text("No headings detected.", margin, y);
        y += 6;
    }

    if (data.readability) {
        checkPageBreak(25);
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Content Stats:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");

        addDetail("Reading Level", data.readability.level);
        addDetail("Word Count", data.readability.words);
        addDetail("Reading Time", data.readability.readingTime);
        if (data.readability.keywordDensity) {
            const densityStr = data.readability.keywordDensity.map(k => `${k.word} (${k.count})`).join(', ');
            addDetail("Keyword Density", densityStr);
        }
    }

    addSectionTitle("Links Analysis");
    if (data.links) {
        // Print Internal Links
        if (data.links.internal && data.links.internal.length > 0) {
            checkPageBreak(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Internal Links (${data.links.internal.length}):`, margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");

            data.links.internal.forEach(l => {
                checkPageBreak(6);
                const linkText = `${l.text || '(No Text)'} -> ${l.href}`;
                const lines = doc.splitTextToSize(linkText, contentWidth - 5);
                doc.text(lines, margin + 5, y);
                y += (lines.length * 4) + 2;
            });
            y += 4;
        }

        // Print External Links
        if (data.links.external && data.links.external.length > 0) {
            checkPageBreak(10);
            doc.setFont("helvetica", "bold");
            doc.text(`External Links (${data.links.external.length}):`, margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");

            data.links.external.forEach(l => {
                checkPageBreak(6);
                const linkText = `${l.text || '(No Text)'} -> ${l.href}`;
                const lines = doc.splitTextToSize(linkText, contentWidth - 5);
                doc.text(lines, margin + 5, y);
                y += (lines.length * 4) + 2;
            });
        }
    }

    addSectionTitle("Meta & Social Tags");

    // 1. Meta Tags
    if (data.meta) {
        doc.setFont("helvetica", "bold");
        doc.text("Meta Tags:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");

        Object.entries(data.meta).forEach(([k, v]) => {
            if (k === 'title' || k === 'description') return; // Already shown
            checkPageBreak(6);
            const val = typeof v === 'object' ? (v.value || '') : v;
            const tagText = doc.splitTextToSize(`${k}: ${val}`, contentWidth - 5);
            doc.text(tagText, margin + 5, y);
            y += (tagText.length * 4) + 2;
        });
        y += 4;
    }

    // 2. Social Tags (OG / Twitter)
    if (data.social) {
        checkPageBreak(10);
        doc.setFont("helvetica", "bold");
        doc.text("Social / OpenGraph / Twitter Cards:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");

        Object.keys(data.social).forEach(key => {
            checkPageBreak(6);
            const val = data.social[key]; // Usually just a string
            const tagText = doc.splitTextToSize(`${key}: ${val}`, contentWidth - 5);
            doc.text(tagText, margin + 5, y);
            y += (tagText.length * 4) + 2;
        });
    }

    addSectionTitle("Accessibility");
    if (data.accessibility) {
        addDetail("Score", data.accessibility.score);
        addDetail("Critical Issues", data.accessibility.critical);

        if (data.accessibility.violations && data.accessibility.violations.length > 0) {
            checkPageBreak(10);
            y += 5;
            doc.setFont("helvetica", "bold");
            doc.text("All Issues:", margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            data.accessibility.violations.forEach(v => {
                checkPageBreak(8);
                const vText = doc.splitTextToSize(`• [${v.impact}] ${v.id}: ${v.description}`, contentWidth);
                doc.text(vText, margin, y);
                y += (vText.length * 5) + 2;
            });
        }
    }

    addSectionTitle("Schema / Structured Data");
    if (data.schema && data.schema.length > 0) {
        data.schema.forEach((s, i) => {
            checkPageBreak(25);
            if (i > 0) y += 5;
            doc.setFont("helvetica", "bold");
            doc.text(`Type: ${s.type}`, margin, y);
            y += 6;

            // Render JSON-LD as code block
            doc.setFont("courier", "normal");
            doc.setFontSize(8);
            doc.setTextColor(50, 50, 50);

            try {
                const codeStr = JSON.stringify(s.data || {}, null, 2);
                const codeLines = doc.splitTextToSize(codeStr, contentWidth - 10);

                // Draw code block background
                const blockHeight = (codeLines.length * 3.5) + 4;
                if (checkPageBreak(blockHeight)) {
                    // Refetch y if page break happened
                }

                doc.setFillColor(245, 245, 245);
                doc.rect(margin, y, contentWidth, blockHeight, 'F');

                doc.text(codeLines, margin + 2, y + 4);
                y += blockHeight + 5;
            } catch (e) {
                doc.text("(Invalid JSON)", margin, y);
                y += 10;
            }

            resetFont();
        });
    } else {
        doc.text("No structured data detected.", margin, y); y += 7;
    }

    // AI Analysis Section
    if (data.aiAnalysis) {
        addSectionTitle("AI Analysis");
        addDetail("Overall Rating", data.aiAnalysis.overallRating);
        addDetail("Summary", data.aiAnalysis.summary);

        if (data.aiAnalysis.strengths && data.aiAnalysis.strengths.length > 0) {
            checkPageBreak(15);
            y += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Key Strengths:", margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            data.aiAnalysis.strengths.slice(0, 5).forEach(s => {
                checkPageBreak(5);
                const sText = doc.splitTextToSize(`• ${s}`, contentWidth - 10);
                doc.text(sText, margin + 5, y);
                y += (sText.length * 5) + 1;
            });
        }
    }

    // Keywords Performance (GSC)
    if (data.keywords && data.keywords.performance) {
        addSectionTitle("Search Console Performance");
        const kData = data.keywords.performance;

        doc.text(`Results for: ${kData.domain || data.url}`, margin, y); y += 6;

        if (kData.totals) {
            addDetail("Approx. Clicks", kData.totals.clicks);
            addDetail("Approx. Impressions", kData.totals.impressions);
        }

        if (kData.queries && kData.queries.length > 0) {
            checkPageBreak(15);
            y += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Top Queries (by clicks):", margin, y);
            y += 6;

            // Table Header
            doc.setFontSize(9);
            doc.text("Query", margin, y);
            doc.text("Clicks", margin + 100, y);
            doc.text("Pos", margin + 130, y);
            doc.line(margin, y + 1, pageWidth - margin, y + 1);
            y += 6;

            doc.setFont("helvetica", "normal");
            const topQueries = [...kData.queries].sort((a, b) => b.clicks - a.clicks).slice(0, 8);

            topQueries.forEach(q => {
                checkPageBreak(6);
                const queryText = doc.splitTextToSize(q.query || (q.keys && q.keys[0]) || 'Unknown', 95);
                doc.text(queryText, margin, y);
                doc.text(String(q.clicks), margin + 100, y);
                doc.text(String(Math.round(q.position)), margin + 130, y);
                y += (queryText.length * 4) + 2;
            });
        }
    }

    // Save
    doc.save("seo-audit-report.pdf");
}
