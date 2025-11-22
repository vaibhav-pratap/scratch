document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 2. Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlEl.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        htmlEl.setAttribute('data-theme', 'dark');
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // 3. Initialize Data Fetching
    init();

    // 4. Setup Static Copy Buttons
    setupStaticCopyButtons();

    // 5. Setup Toggles
    setupToggles();
    setupSidePanelToggle();

    // 6. Real-time Updates Listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "seoDataUpdated") {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && sender.tab && tabs[0].id === sender.tab.id) {
                    renderData(request.data);
                }
            });
        } else if (request.action === "cwvUpdated") {
            // Lightweight update for CWV only
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && sender.tab && tabs[0].id === sender.tab.id) {
                    renderCWVChart(request.data);
                }
            });
        }
    });
});

async function init() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || !tab.url.startsWith('http')) {
            showError("SEO Analyzer only works on web pages (http/https).");
            return;
        }

        // Try to load cached data first for instant render
        const cacheKey = `seo_data_${tab.url}`;
        const savedData = localStorage.getItem(cacheKey);
        if (savedData) {
            try {
                renderData(JSON.parse(savedData));
            } catch (e) {
                console.warn('Failed to parse cached data', e);
            }
        }

        // Inject content script if needed (robustness)
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {
            // Script might already be there, ignore
        }

        // Request fresh data
        chrome.tabs.sendMessage(tab.id, { action: "getSEOData" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Runtime Error:", chrome.runtime.lastError.message);
                if (!savedData) {
                    showError("Please refresh the page and try again.");
                }
                return;
            }

            if (response) {
                renderData(response);
                // Cache valid response
                localStorage.setItem(cacheKey, JSON.stringify(response));
            } else {
                showError("Received empty response from page.");
            }
        });

    } catch (error) {
        console.error("Init Error:", error);
        showError("An unexpected error occurred: " + error.message);
    }
}

function showError(msg) {
    const container = document.getElementById('suggestions-container');
    if (container) {
        container.innerHTML = `<div class="suggestion-item error">${msg}</div>`;
    }
}

function renderData(data) {

    if (!data) return;

    // --- Overview Tab ---
    // Score Calculation (Simple logic for demo)
    let score = 100;
    const suggestions = [];

    // Title
    const titleLen = data.title ? data.title.length : 0;
    setText('title-length', `${titleLen} chars`);
    if (titleLen === 0) { score -= 20; suggestions.push({ type: 'error', msg: 'Missing Title tag.' }); }
    else if (titleLen < 30 || titleLen > 60) { score -= 5; suggestions.push({ type: 'warning', msg: 'Title should be 30-60 chars.' }); }

    // Description
    const descLen = data.description ? data.description.length : 0;
    setText('desc-length', `${descLen} chars`);
    if (descLen === 0) { score -= 20; suggestions.push({ type: 'error', msg: 'Missing Meta Description.' }); }
    else if (descLen < 120 || descLen > 160) { score -= 5; suggestions.push({ type: 'warning', msg: 'Description should be 120-160 chars.' }); }

    // H1
    const h1Count = data.headings.filter(h => h.tag === 'h1').length;
    if (h1Count === 0) { score -= 10; suggestions.push({ type: 'error', msg: 'Missing H1 tag.' }); }
    else if (h1Count > 1) { score -= 5; suggestions.push({ type: 'warning', msg: 'Multiple H1 tags found.' }); }

    // Images
    const missingAlt = data.images.filter(i => !i.alt).length;
    if (missingAlt > 0) { score -= 10; suggestions.push({ type: 'warning', msg: `${missingAlt} images missing Alt text.` }); }

    // Tech Stack
    const techStackEl = document.getElementById('tech-stack');
    if (techStackEl) {
        techStackEl.textContent = (data.plugins && data.plugins.length) ? data.plugins.join(', ') : 'None detected';
    }

    // Render Score
    const scoreEl = document.getElementById('seo-score');
    if (scoreEl) {
        scoreEl.textContent = Math.max(0, score);
        scoreEl.style.color = score >= 90 ? 'var(--success-color)' : (score >= 70 ? 'var(--warning-color)' : 'var(--error-color)');
    }

    // Render Suggestions
    const suggContainer = document.getElementById('suggestions-container');
    if (suggContainer) {
        suggContainer.innerHTML = '';
        suggestions.forEach(s => {
            suggContainer.innerHTML += `<div class="suggestion-item ${s.type}">${s.msg}</div>`;
        });
    }

    // Store score and suggestions in data object for Excel export
    data.score = score;
    data.suggestions = suggestions;

    // --- CWV & Readability ---
    if (data.cwv) {
        renderCWVChart(data.cwv);
    }
    if (data.readability) {
        setText('readability-score', `${data.readability.score} (${data.readability.level})`);
    }

    // --- Meta Tab ---
    setText('meta-title', data.title || 'Missing');
    setText('meta-desc', data.description || 'Missing');
    setText('meta-keywords', data.keywords || 'Missing');
    setText('meta-canonical', data.canonical || 'Missing');
    setText('meta-robots', data.robots || 'Missing');

    renderKeyValueList('og-data', data.og, 'Open Graph');
    renderKeyValueList('twitter-data', data.twitter, 'Twitter Card');

    // --- Headings Tab ---
    const headingsContainer = document.getElementById('headings-list');
    if (headingsContainer) {
        if (!data.headings.length) {
            headingsContainer.innerHTML = '<div class="data-value">No headings found.</div>';
        } else {
            headingsContainer.innerHTML = '';
            data.headings.forEach(h => {
                const div = document.createElement('div');
                div.className = 'heading-item';
                div.innerHTML = `
                    <span class="${h.tag}">${h.tag.toUpperCase()}: ${h.text}</span>
                    <button class="copy-icon-btn" title="Copy">
                        <svg viewBox="0 0 24 24" width="12" height="12"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                `;
                div.querySelector('button').addEventListener('click', (e) => copyToClipboard(h.text, e.currentTarget));
                headingsContainer.appendChild(div);
            });
        }
    }

    // Headings Chart
    if (data.headings) {
        renderHeadingsChart(data.headings);
    }

    // --- Images Tab ---
    setText('img-total', data.images.length);
    setText('img-missing-alt', missingAlt);
    if (missingAlt > 0) document.getElementById('img-missing-alt').classList.add('warning-text');

    const imgGrid = document.getElementById('images-list');
    if (imgGrid) {
        imgGrid.innerHTML = '';
        data.images.forEach(img => {
            const div = document.createElement('div');
            div.className = `img-card ${!img.alt ? 'missing-alt' : ''}`;
            div.innerHTML = `
                <img src="${img.src}" class="img-preview" loading="lazy">
                <div class="img-info">${img.alt || '<span class="warning-text">No Alt</span>'}</div>
            `;
            imgGrid.appendChild(div);
        });
    }

    // --- Links Tab ---
    if (data.links) {
        setText('link-internal-count', data.links.internal.length);
        setText('link-external-count', data.links.external.length);

        renderLinkList('external-links-list', data.links.external);
        renderLinkList('internal-links-list', data.links.internal);

        // Links Chart
        renderLinksChart(data.links);
    }

    // Emails & Phones
    renderSimpleList('emails-list', data.emails, 'mailto:');
    renderSimpleList('phones-list', data.phones.map(p => p.number), 'tel:');

    // --- Schema Tab ---
    const schemaList = document.getElementById('schema-list');
    if (schemaList) {
        if (data.schema && data.schema.length) {
            schemaList.innerHTML = '';
            data.schema.forEach(s => {
                const div = document.createElement('div');
                div.className = 'data-group';
                div.style.borderLeftColor = s.valid ? 'var(--success-color)' : 'var(--error-color)';
                // Create label and value with copy button
                const label = document.createElement('label');
                label.textContent = s.type;
                const valueDiv = document.createElement('div');
                valueDiv.className = 'data-value';
                valueDiv.textContent = s.details;
                // Copy button
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-icon-btn';
                copyBtn.title = 'Copy';
                copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
                copyBtn.onclick = () => copyToClipboard(JSON.stringify(s.data, null, 2), copyBtn);
                // Assemble
                const row = document.createElement('div');
                row.className = 'label-row';
                row.appendChild(valueDiv);
                row.appendChild(copyBtn);
                div.appendChild(label);
                div.appendChild(row);
                schemaList.appendChild(div);
            });
        } else {
            schemaList.innerHTML = '<div class="data-value">No Schema found.</div>';
        }
    }

    const hreflangList = document.getElementById('hreflang-list');
    if (hreflangList) {
        if (data.hreflang && data.hreflang.length) {
            hreflangList.innerHTML = '';
            data.hreflang.forEach(h => {
                hreflangList.innerHTML += `<div class="data-value"><b>${h.lang}</b>: ${h.href}</div>`;
            });
        } else {
            hreflangList.innerHTML = '<div class="data-value">No hreflang tags.</div>';
        }
    }

    const paaList = document.getElementById('paa-list');
    if (paaList) {
        if (data.paa && data.paa.length) {
            paaList.innerHTML = '';
            data.paa.forEach(q => {
                paaList.innerHTML += `<div class="suggestion-item">${q}</div>`;
            });
        } else {
            paaList.innerHTML = '<div class="data-value">No PAA found.</div>';
        }
    }

    // Footer Buttons
    document.getElementById('btn-copy').onclick = () => copyToClipboard(JSON.stringify(data, null, 2), document.getElementById('btn-copy'));
    document.getElementById('btn-download').onclick = () => downloadData(data, 'json');
    document.getElementById('btn-download-csv').onclick = () => downloadData(data, 'excel');
    document.getElementById('btn-download-pdf').onclick = () => downloadPDF(data);
}

// --- Helpers ---

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderKeyValueList(containerId, obj, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (Object.keys(obj).length === 0) {
        container.innerHTML = ''; // Hide if empty
        return;
    }

    // Create the main group container
    const groupDiv = document.createElement('div');
    groupDiv.className = 'data-group';
    groupDiv.style.marginTop = '16px';

    // Title
    const titleLabel = document.createElement('label');
    titleLabel.textContent = title;
    groupDiv.appendChild(titleLabel);

    // Items
    for (const [key, val] of Object.entries(obj)) {
        const row = document.createElement('div');
        row.className = 'label-row';
        row.style.marginBottom = '8px';
        row.style.borderBottom = '1px solid var(--surface-color)';
        row.style.paddingBottom = '8px';

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';
        contentDiv.style.wordBreak = 'break-word';
        contentDiv.innerHTML = `
            <div style="color:var(--text-secondary); font-size: 11px; font-weight: 700; margin-bottom: 2px; text-transform: uppercase;">${key}</div>
            <div class="data-value">${val}</div>
        `;

        // Copy Button
        const btn = document.createElement('button');
        btn.className = 'copy-icon-btn';
        btn.title = 'Copy';
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
        btn.onclick = () => copyToClipboard(val, btn);

        row.appendChild(contentDiv);
        row.appendChild(btn);
        groupDiv.appendChild(row);
    }

    container.innerHTML = '';
    container.appendChild(groupDiv);
}

function renderLinkList(containerId, links) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    links.slice(0, 100).forEach(l => {
        container.innerHTML += `<div class="link-item"><a href="${l.href}" target="_blank">${l.text || l.href}</a></div>`;
    });
}

function renderSimpleList(containerId, items, prefix = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="data-value" style="padding: 8px;">None found.</div>';
        return;
    }

    container.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'data-group';
        div.innerHTML = `
            <div class="label-row">
                <div class="data-value" style="word-break: break-all;">${item}</div>
                <button class="copy-icon-btn" title="Copy">
                    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
            </div>
        `;
        div.querySelector('button').addEventListener('click', (e) => copyToClipboard(`${prefix}${item}`, e.currentTarget));
        container.appendChild(div);
    });
}

function setupStaticCopyButtons() {
    const map = {
        'btn-copy-title': 'meta-title',
        'btn-copy-desc': 'meta-desc',
        'btn-copy-keywords': 'meta-keywords',
        'btn-copy-canonical': 'meta-canonical',
        'btn-copy-robots': 'meta-robots'
    };

    for (const [btnId, targetId] of Object.entries(map)) {
        const btn = document.getElementById(btnId);
        const target = document.getElementById(targetId);
        if (btn && target) {
            btn.addEventListener('click', () => copyToClipboard(target.textContent, btn));
        }
    }
}

async function copyToClipboard(text, btnElement) {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        showCopySuccess(btnElement);
    } catch (err) {
        console.error('Copy failed', err);
    }
}

function showCopySuccess(btn) {
    if (!btn) return;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" style="fill: var(--success-color);"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
    setTimeout(() => {
        btn.innerHTML = originalHtml;
    }, 1500);
}

function setupToggles() {
    const types = ['nofollow', 'follow', 'external', 'internal', 'mailto', 'tel'];

    types.forEach(type => {
        const toggle = document.getElementById(`toggle-${type}`);
        if (!toggle) return;

        // Load state
        chrome.storage.local.get([`highlight_${type}`], (result) => {
            const isChecked = result[`highlight_${type}`] === true;
            toggle.checked = isChecked;
            updateToggleVisuals(toggle, type, isChecked);

            // Apply if enabled (re-inject on popup open)
            if (isChecked) {
                sendToggleMessage(type, true);
            }
        });

        // Change listener
        toggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            chrome.storage.local.set({ [`highlight_${type}`]: isChecked });
            updateToggleVisuals(toggle, type, isChecked);
            sendToggleMessage(type, isChecked);
        });
    });
}

function setupSidePanelToggle() {
    const toggle = document.getElementById('toggle-sidepanel');
    if (!toggle) return;

    // Load state
    chrome.storage.local.get(['openInSidePanel'], (result) => {
        toggle.checked = result.openInSidePanel === true;
    });

    // Change listener
    toggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        chrome.storage.local.set({ openInSidePanel: isChecked });

        // Set panel behavior
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: isChecked })
            .catch((error) => console.error(error));
    });
}

function updateToggleVisuals(toggle, type, isChecked) {
    // Ensure toggle and its parent group exist before manipulating classes
    if (!toggle) return;
    const group = toggle.closest('.data-group');
    if (!group) return;
    if (isChecked) {
        group.classList.add('active-highlight', type);
    } else {
        group.classList.remove('active-highlight', type);
    }
}

function sendToggleMessage(type, enabled) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleHighlight",
                linkType: type,
                enabled: enabled
            });
        }
    });
}

function downloadData(data, format) {
    if (format === 'excel') {
        // Generate multi‑sheet Excel workbook using XLSX library
        try {
            const wb = XLSX.utils.book_new();
            // Helper to add a sheet from an object or array
            const addSheet = (name, content) => {
                let ws;
                if (Array.isArray(content)) {
                    ws = XLSX.utils.json_to_sheet(content);
                } else {
                    // Convert object to key/value array
                    const rows = Object.entries(content).map(([k, v]) => ({ key: k, value: v }));
                    ws = XLSX.utils.json_to_sheet(rows);
                }
                XLSX.utils.book_append_sheet(wb, ws, name);
            };
            // Overview sheet (score & suggestions)
            const overview = {
                score: data.score || 0,
                suggestions: (data.suggestions || []).map((s, i) => `${i + 1}. ${s.msg}`)
            };
            addSheet('Overview', overview);
            // Meta sheet
            const meta = {
                title: data.title || '',
                description: data.description || '',
                keywords: data.keywords || '',
                canonical: data.canonical || '',
                robots: data.robots || ''
            };
            addSheet('Meta', meta);
            // Open Graph & Twitter sheets
            addSheet('Open Graph', data.og || {});
            addSheet('Twitter Card', data.twitter || {});
            // Headings sheet
            addSheet('Headings', data.headings || []);
            // Images sheet
            addSheet('Images', data.images || []);
            // Links sheet (internal & external combined)
            const links = [];
            (data.links?.internal || []).forEach(l => links.push({ type: 'internal', href: l.href, text: l.text }));
            (data.links?.external || []).forEach(l => links.push({ type: 'external', href: l.href, text: l.text }));
            addSheet('Links', links);
            // Schema sheet
            addSheet('Schema', data.schema || []);
            // Hreflang sheet
            addSheet('Hreflang', data.hreflang || []);
            // PAA sheet
            addSheet('PAA', (data.paa || []).map(q => ({ question: q })));
            // Emails sheet
            addSheet('Emails', (data.emails || []).map(e => ({ email: e })));
            // Phones sheet
            addSheet('Phones', (data.phones || []).map(p => ({ number: p.number, display: p.display })));
            // Generate workbook binary
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
            // Fallback to JSON download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `seo-data-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    } else if (format === 'csv') {
        // Existing CSV fallback (kept for compatibility)
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
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `seo-data-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    } else {
        // Default JSON download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seo-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// --- Chart Functions ---

let cwvChartInstance = null;
let linksChartInstance = null;
let headingsChartInstance = null;

function renderCWVChart(cwv) {
    const ctx = document.getElementById('cwv-chart');
    if (!ctx) return;

    if (cwvChartInstance) {
        cwvChartInstance.destroy();
    }

    const labels = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'];
    const values = [
        cwv.lcp || 0,
        cwv.cls || 0,
        cwv.inp || 0,
        cwv.fcp || 0,
        cwv.ttfb || 0
    ];

    // Normalize values for visualization (e.g., CLS is small, others are ms)
    // For simplicity, we'll just plot raw values but maybe scale CLS x 1000 for visibility if mixed
    // Or better, just show them as is and let user interpret. 
    // Actually, CLS is unitless (0-1), others are ms (0-5000+). 
    // A multi-axis chart would be better, but for now let's just plot them.
    // To make CLS visible, we'll scale it up in the chart but show real value in tooltip.

    cwvChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Metric Value',
                data: values.map((v, i) => i === 1 ? v * 1000 : v), // Scale CLS * 1000
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            let value = context.raw;
                            if (context.dataIndex === 1) { // CLS
                                value = value / 1000;
                                label += value.toFixed(3);
                            } else {
                                label += Math.round(value) + ' ms';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value (ms) / CLS (*1000)'
                    }
                }
            }
        }
    });
}

function renderLinksChart(links) {
    const ctx = document.getElementById('links-chart');
    if (!ctx) return;

    if (linksChartInstance) {
        linksChartInstance.destroy();
    }

    linksChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Internal', 'External'],
            datasets: [{
                data: [links.internal.length, links.external.length],
                backgroundColor: ['#36A2EB', '#FF6384'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderHeadingsChart(headings) {
    const ctx = document.getElementById('headings-chart');
    if (!ctx) return;

    if (headingsChartInstance) {
        headingsChartInstance.destroy();
    }

    const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    headings.forEach(h => {
        const tag = h.tag.toLowerCase();
        if (counts[tag] !== undefined) counts[tag]++;
    });

    headingsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(counts).map(k => k.toUpperCase()),
            datasets: [{
                label: 'Count',
                data: Object.values(counts),
                backgroundColor: '#4BC0C0'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

function downloadPDF(data) {
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
    // Handle long text wrapping for description if needed, but keeping simple for now

    y += 4;

    // CWV
    if (data.cwv) {
        doc.setFontSize(14);
        doc.text("Core Web Vitals", 10, y);
        y += 6;
        doc.setFontSize(10);
        doc.text(`LCP: ${Math.round(data.cwv.lcp?.value || 0)} ms`, 10, y); y += 6;
        doc.text(`CLS: ${(data.cwv.cls?.value || 0).toFixed(3)}`, 10, y); y += 6;
        doc.text(`INP: ${Math.round(data.cwv.inp?.value || 0)} ms`, 10, y); y += 6;
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
