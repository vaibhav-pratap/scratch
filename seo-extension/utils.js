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
    let content, type, filename;

    if (format === 'csv') {
        content = convertToExcelXML(data);
        type = 'application/vnd.ms-excel';
        filename = `seo-report-${new Date().getTime()}.xls`;
    } else {
        content = JSON.stringify(data, null, 2);
        type = 'application/json';
        filename = `seo-report-${new Date().getTime()}.json`;
    }

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

function convertToExcelXML(data) {
    const escapeXML = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    let xml = '<?xml version="1.0"?>\n' +
        '<?mso-application progid="Excel.Sheet"?>\n' +
        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n' +
        ' xmlns:o="urn:schemas-microsoft-com:office:office"\n' +
        ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n' +
        ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n' +
        ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';

    // Helper to create a worksheet
    const createSheet = (name, rows) => {
        let sheet = `<Worksheet ss:Name="${name}"><Table>\n`;
        // Header Row
        if (rows.length > 0) {
            sheet += '<Row>\n';
            Object.keys(rows[0]).forEach(key => {
                sheet += `<Cell><Data ss:Type="String">${escapeXML(key)}</Data></Cell>\n`;
            });
            sheet += '</Row>\n';
        }
        // Data Rows
        rows.forEach(row => {
            sheet += '<Row>\n';
            Object.values(row).forEach(val => {
                sheet += `<Cell><Data ss:Type="String">${escapeXML(val)}</Data></Cell>\n`;
            });
            sheet += '</Row>\n';
        });
        sheet += '</Table></Worksheet>\n';
        return sheet;
    };

    // 1. Overview Sheet
    const overviewData = [
        { Key: 'Title', Value: data.title },
        { Key: 'Description', Value: data.description },
        { Key: 'Keywords', Value: data.keywords },
        { Key: 'Canonical', Value: data.canonical },
        { Key: 'Robots', Value: data.robots }
    ];
    // Add OG/Twitter to Overview or separate? Let's add to Overview for now
    if (data.og) {
        Object.entries(data.og).forEach(([k, v]) => overviewData.push({ Key: `OG:${k}`, Value: v }));
    }
    if (data.twitter) {
        Object.entries(data.twitter).forEach(([k, v]) => overviewData.push({ Key: `Twitter:${k}`, Value: v }));
    }
    xml += createSheet('Overview', overviewData);

    // 2. Headings Sheet
    const headingsData = data.headings.map(h => ({ Tag: h.tag, Text: h.text }));
    xml += createSheet('Headings', headingsData);

    // 3. Images Sheet
    const imagesData = data.images.map(img => ({ Src: img.src, Alt: img.alt }));
    xml += createSheet('Images', imagesData);

    // 4. Links Sheet
    const linksData = [];
    if (data.links) {
        data.links.internal.forEach(l => linksData.push({ Type: 'Internal', Text: l.text, Href: l.href }));
        data.links.external.forEach(l => linksData.push({ Type: 'External', Text: l.text, Href: l.href }));
    }
    xml += createSheet('Links', linksData);

    // 5. Schema/Hreflang Sheet
    const schemaData = [];
    if (data.hreflang) {
        data.hreflang.forEach(h => schemaData.push({ Type: 'Hreflang', Lang: h.lang, Url: h.href }));
    }
    xml += createSheet('Schema', schemaData);

    xml += '</Workbook>';
    return xml;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
