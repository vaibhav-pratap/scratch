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
        content = convertToCSV(data);
        type = 'text/csv';
        filename = `seo-report-${new Date().getTime()}.csv`;
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

function convertToCSV(data) {
    const rows = [];

    // General Info
    rows.push(['Type', 'Key', 'Value']);
    rows.push(['Meta', 'Title', `"${(data.title || '').replace(/"/g, '""')}"`]);
    rows.push(['Meta', 'Description', `"${(data.description || '').replace(/"/g, '""')}"`]);
    rows.push(['Meta', 'Keywords', `"${(data.keywords || '').replace(/"/g, '""')}"`]);
    rows.push(['Meta', 'Canonical', `"${(data.canonical || '').replace(/"/g, '""')}"`]);
    rows.push(['Meta', 'Robots', `"${(data.robots || '').replace(/"/g, '""')}"`]);

    // OG
    for (const [key, val] of Object.entries(data.og)) {
        rows.push(['Open Graph', key, `"${val.replace(/"/g, '""')}"`]);
    }

    // Headings
    data.headings.forEach(h => {
        rows.push(['Heading', h.tag, `"${h.text.replace(/"/g, '""')}"`]);
    });

    // Images
    data.images.forEach(img => {
        rows.push(['Image', 'Src', `"${img.src}"`]);
        rows.push(['Image', 'Alt', `"${(img.alt || '').replace(/"/g, '""')}"`]);
    });

    // Links
    if (data.links) {
        data.links.internal.forEach(l => {
            rows.push(['Link (Internal)', 'Href', `"${l.href}"`]);
            rows.push(['Link (Internal)', 'Text', `"${l.text.replace(/"/g, '""')}"`]);
        });
        data.links.external.forEach(l => {
            rows.push(['Link (External)', 'Href', `"${l.href}"`]);
            rows.push(['Link (External)', 'Text', `"${l.text.replace(/"/g, '""')}"`]);
        });
    }

    return rows.map(row => row.join(',')).join('\n');
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
