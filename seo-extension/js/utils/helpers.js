// utils.js

function copyData(data) {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Copied!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    });
}

function downloadData(data, format = 'json') {
    if (format === 'csv') {
        // Use SheetJS to create a workbook with multiple sheets
        const wb = XLSX.utils.book_new();

        // 1. Overview Sheet
        const overviewData = [
            { Key: 'Title', Value: data.title },
            { Key: 'Description', Value: data.description },
            { Key: 'Keywords', Value: data.keywords },
            { Key: 'Canonical', Value: data.canonical },
            { Key: 'Robots', Value: data.robots }
        ];
        if (data.og) {
            Object.entries(data.og).forEach(([k, v]) => overviewData.push({ Key: `OG:${k}`, Value: v }));
        }
        if (data.twitter) {
            Object.entries(data.twitter).forEach(([k, v]) => overviewData.push({ Key: `Twitter:${k}`, Value: v }));
        }
        const wsOverview = XLSX.utils.json_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

        // 2. Headings Sheet
        const headingsData = data.headings.map(h => ({ Tag: h.tag, Text: h.text }));
        const wsHeadings = XLSX.utils.json_to_sheet(headingsData);
        XLSX.utils.book_append_sheet(wb, wsHeadings, "Headings");

        // 3. Images Sheet
        const imagesData = data.images.map(img => ({ Src: img.src, Alt: img.alt }));
        const wsImages = XLSX.utils.json_to_sheet(imagesData);
        XLSX.utils.book_append_sheet(wb, wsImages, "Images");

        // 4. Links Sheet
        const linksData = [];
        if (data.links) {
            data.links.internal.forEach(l => linksData.push({ Type: 'Internal', Text: l.text, Href: l.href }));
            data.links.external.forEach(l => linksData.push({ Type: 'External', Text: l.text, Href: l.href }));
        }
        const wsLinks = XLSX.utils.json_to_sheet(linksData);
        XLSX.utils.book_append_sheet(wb, wsLinks, "Links");

        // 5. Schema/Hreflang Sheet
        const schemaData = [];
        if (data.hreflang) {
            data.hreflang.forEach(h => schemaData.push({ Type: 'Hreflang', Lang: h.lang, Url: h.href }));
        }
        const wsSchema = XLSX.utils.json_to_sheet(schemaData);
        XLSX.utils.book_append_sheet(wb, wsSchema, "Schema");

        // Write file
        XLSX.writeFile(wb, `seo-report-${new Date().getTime()}.xlsx`);

    } else {
        const content = JSON.stringify(data, null, 2);
        const type = 'application/json';
        const filename = `seo-report-${new Date().getTime()}.json`;
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
