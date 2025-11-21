// popup.js

document.addEventListener('DOMContentLoaded', () => {
    // Tabs Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Initialize Data Fetching
    init();
});

async function init() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.startsWith('http')) {
            showError("SEO Analyzer only works on web pages.");
            return;
        }

        // Try to load persisted data first
        const cacheKey = `seo_data_${tab.url}`;
        const savedData = localStorage.getItem(cacheKey);
        if (savedData) {
            try {
                renderData(JSON.parse(savedData));
            } catch (e) {
                console.log('Failed to load saved data', e);
            }
        }

        // Inject script if not already there (for robustness)
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {
            console.log("Script injection skipped or failed:", e);
        }

        // Request Data
        console.log("Requesting SEO Data...");
        chrome.tabs.sendMessage(tab.id, { action: "getSEOData" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Runtime Error:", chrome.runtime.lastError.message);
                // If we have saved data, we might not want to show an error immediately, 
                // but for now let's show it if we couldn't get fresh data and have no saved data?
                // Or just show it.
                if (!savedData) {
                    showError("Please refresh the page and try again. (Error: " + chrome.runtime.lastError.message + ")");
                }
                return;
            }
            console.log("Received Data:", response);
            if (response) {
                renderData(response);
            } else {
                showError("Received empty response from content script.");
            }
        });

    } catch (error) {
        console.error("Init Error:", error);
        showError("An error occurred: " + error.message);
    }
}

function showError(msg) {
    console.error("Show Error:", msg);
    const container = document.querySelector('.content-area');
    if (container) {
        container.innerHTML = `<div class="suggestion-item error">${msg}</div>`;
    }
}

let currentData = null;

function renderData(data) {
    currentData = data;

    // Save data for persistence
    try {
        chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
            if (tab && tab.url) {
                const cacheKey = `seo_data_${tab.url}`;
                localStorage.setItem(cacheKey, JSON.stringify(data));
            }
        });
    } catch (e) {
        console.log('Failed to save data', e);
    }

    // Meta
    setText('meta-title', data.title);
    setText('meta-desc', data.description || 'Missing');
    setText('meta-keywords', data.keywords || 'Missing');
    setText('meta-canonical', data.canonical || 'Missing');
    setText('meta-robots', data.robots || 'Missing');

    // Tech Stack
    const techStackEl = document.getElementById('tech-stack');
    if (techStackEl) {
        if (data.plugins && data.plugins.length > 0) {
            techStackEl.innerHTML = data.plugins.map(p => `<span class="tag">${p}</span>`).join(' ');
        } else {
            techStackEl.textContent = 'None detected';
        }
    }

    // Social
    const ogContainer = document.getElementById('og-data');
    ogContainer.innerHTML = Object.keys(data.og).length ? '' : '<div class="data-value">No Open Graph tags found.</div>';
    for (const [key, val] of Object.entries(data.og)) {
        ogContainer.innerHTML += `<div class="data-group"><label>${key}</label><div class="data-value">${val}</div></div>`;
    }

    const twContainer = document.getElementById('twitter-data');
    twContainer.innerHTML = Object.keys(data.twitter).length ? '' : '<div class="data-value">No Twitter tags found.</div>';
    for (const [key, val] of Object.entries(data.twitter)) {
        twContainer.innerHTML += `<div class="data-group"><label>${key}</label><div class="data-value">${val}</div></div>`;
    }

    // Headings
    const hContainer = document.getElementById('headings-list');
    if (!data.headings.length) {
        hContainer.innerHTML = '<div class="data-value">No headings found.</div>';
    } else {
        hContainer.innerHTML = '';

        const groups = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
        data.headings.forEach(h => {
            if (groups[h.tag]) groups[h.tag].push(h.text);
        });

        Object.keys(groups).forEach(tag => {
            const headings = groups[tag];
            if (headings.length === 0) return;

            const div = document.createElement('div');
            div.className = 'data-group';

            // Group Header with Copy All
            div.innerHTML = `
                <div class="label-row">
                    <label>${tag.toUpperCase()} (${headings.length})</label>
                    <button class="copy-icon-btn group-copy" title="Copy All">
                        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                </div>
                <div class="headings-list-group"></div>
            `;

            const listContainer = div.querySelector('.headings-list-group');
            headings.forEach(text => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'heading-item';
                itemDiv.style.display = 'flex';
                itemDiv.style.justifyContent = 'space-between';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.marginBottom = '8px';

                itemDiv.innerHTML = `
                    <span style="flex: 1; margin-right: 8px;">${text}</span>
                    <button class="copy-icon-btn individual-copy" title="Copy">
                        <svg viewBox="0 0 24 24" width="12" height="12"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                `;

                // Individual Copy
                const copyBtn = itemDiv.querySelector('.individual-copy');
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(text).then(() => {
                        const originalColor = copyBtn.style.color;
                        copyBtn.style.color = 'var(--success-color)';
                        setTimeout(() => copyBtn.style.color = originalColor || '', 1000);
                    });
                });

                listContainer.appendChild(itemDiv);
            });

            // Group Copy
            const groupCopyBtn = div.querySelector('.group-copy');
            groupCopyBtn.addEventListener('click', () => {
                const allText = headings.join('\n');
                navigator.clipboard.writeText(allText).then(() => {
                    const originalColor = groupCopyBtn.style.color;
                    groupCopyBtn.style.color = 'var(--success-color)';
                    setTimeout(() => groupCopyBtn.style.color = originalColor || '', 1000);
                });
            });

            hContainer.appendChild(div);
        });
    }

    // Calculate missing alt count early
    const missingAlt = data.images.filter(img => !img.alt).length;

    const missingEl = document.getElementById('img-missing-alt');
    if (missingEl) {
        missingEl.textContent = missingAlt;
        if (missingAlt > 0) missingEl.parentElement.classList.add('warning-text');
    }

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

    // Links
    if (data.links) {
        const intCount = document.getElementById('link-internal-count');
        if (intCount) intCount.textContent = data.links.internal.length;

        const extCount = document.getElementById('link-external-count');
        if (extCount) extCount.textContent = data.links.external.length;

        const extList = document.getElementById('external-links-list');
        if (extList) {
            extList.innerHTML = '';
            data.links.external.slice(0, 50).forEach(l => {
                extList.innerHTML += `<div class="link-item"><a href="${l.href}" target="_blank">${l.text || l.href}</a></div>`;
            });
        }

        const intList = document.getElementById('internal-links-list');
        if (intList) {
            intList.innerHTML = '';
            data.links.internal.slice(0, 50).forEach(l => {
                intList.innerHTML += `<div class="link-item"><a href="${l.href}" target="_blank">${l.text || l.href}</a></div>`;
            });
        }

        // Emails
        const emailsList = document.getElementById('emails-list');
        if (emailsList) {
            if (data.emails && data.emails.length > 0) {
                emailsList.innerHTML = '';
                data.emails.forEach(email => {
                    const div = document.createElement('div');
                    div.className = 'data-group';
                    div.style.marginBottom = '8px';
                    div.innerHTML = `
                        <div class="label-row">
                            <span style="flex: 1;">${email}</span>
                            <button class="copy-icon-btn copy-email" data-email="${email}" title="Copy">
                                <svg viewBox="0 0 24 24" width="14" height="14">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                            </button>
                        </div>
                    `;

                    const copyBtn = div.querySelector('.copy-email');
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(email).then(() => {
                            const originalHTML = copyBtn.innerHTML;
                            copyBtn.innerHTML = '✓';
                            setTimeout(() => copyBtn.innerHTML = originalHTML, 1500);
                        });
                    });

                    emailsList.appendChild(div);
                });
            } else {
                emailsList.innerHTML = '<div class="data-value">No email addresses found.</div>';
            }
        }

        // Phone Numbers
        const phonesList = document.getElementById('phones-list');
        if (phonesList) {
            if (data.phones && data.phones.length > 0) {
                phonesList.innerHTML = '';
                data.phones.forEach(phone => {
                    const div = document.createElement('div');
                    div.className = 'data-group';
                    div.style.marginBottom = '8px';
                    div.innerHTML = `
                        <div class="label-row">
                            <span style="flex: 1;">${phone.display}</span>
                            <button class="copy-icon-btn copy-phone" data-phone="${phone.number}" title="Copy">
                                <svg viewBox="0 0 24 24" width="14" height="14">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                            </button>
                        </div>
                    `;

                    const copyBtn = div.querySelector('.copy-phone');
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(phone.number).then(() => {
                            const originalHTML = copyBtn.innerHTML;
                            copyBtn.innerHTML = '✓';
                            setTimeout(() => copyBtn.innerHTML = originalHTML, 1500);
                        });
                    });

                    phonesList.appendChild(div);
                });
            } else {
                phonesList.innerHTML = '<div class="data-value">No phone numbers found.</div>';
            }
        }
    }

    // Schema Tab
    const schemaContainer = document.getElementById('schema-list');
    if (schemaContainer) {
        if (data.schema && data.schema.length) {
            schemaContainer.innerHTML = '';
            data.schema.forEach(s => {
                const statusClass = s.valid ? 'success-text' : 'error-text';
                const statusText = s.valid ? 'Valid' : 'Invalid';
                const div = document.createElement('div');
                div.className = 'data-group';
                div.style.marginBottom = '12px';
                div.style.borderLeft = s.valid ? '3px solid var(--success-color)' : '3px solid var(--error-color)';
                div.style.paddingLeft = '8px';

                div.innerHTML = `
                    <div class="label-row">
                        <label>${s.type}</label>
                        <span class="${statusClass}" style="font-size: 12px; font-weight: 500;">${statusText}</span>
                    </div>
                    <div class="data-value" style="margin-bottom: 4px;">${s.details}</div>
                    <div class="label-row" style="margin-top: 4px;">
                         <button class="action-btn secondary small copy-schema-btn">Copy Data</button>
                    </div>
                `;

                // Copy Button Logic
                const btn = div.querySelector('.copy-schema-btn');
                btn.onclick = () => {
                    const textToCopy = typeof s.data === 'string' ? s.data : JSON.stringify(s.data, null, 2);
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const originalText = btn.textContent;
                        btn.textContent = 'Copied!';
                        setTimeout(() => btn.textContent = originalText, 1500);
                    });
                };

                schemaContainer.appendChild(div);
            });
        } else {
            schemaContainer.innerHTML = '<div class="data-value">No Schema or Structured Data found.</div>';
        }
    }

    const hreflangContainer = document.getElementById('hreflang-list');
    if (hreflangContainer) {
        if (data.hreflang && data.hreflang.length) {
            hreflangContainer.innerHTML = '';
            data.hreflang.forEach(h => {
                hreflangContainer.innerHTML += `<div class="data-group" style="margin-bottom: 8px;"><div class="label-row"><label>${h.lang}</label></div><div class="data-value"><a href="${h.href}" target="_blank">${h.href}</a></div></div>`;
            });
        } else {
            hreflangContainer.innerHTML = '<div class="data-value">No hreflang tags found.</div>';
        }
    }

    const paaContainer = document.getElementById('paa-list');
    if (paaContainer) {
        if (data.paa && data.paa.length) {
            paaContainer.innerHTML = '';
            data.paa.forEach(q => {
                paaContainer.innerHTML += `<div class="suggestion-item">${q}</div>`;
            });
        } else {
            paaContainer.innerHTML = '<div class="data-value">No PAA questions found (or not on Google SERP).</div>';
        }
    }

    // Sitemap Button
    const btnSitemap = document.getElementById('btn-sitemap');
    if (btnSitemap) {
        btnSitemap.onclick = () => {
            try {
                const url = new URL(data.url);
                const sitemapUrl = `${url.origin}/sitemap.xml`;
                chrome.tabs.create({ url: sitemapUrl });
            } catch (e) {
                console.error("Invalid URL", e);
            }
        };
    }

    // Settings - Nofollow Toggle
    const toggleNofollow = document.getElementById('toggle-nofollow');
    if (toggleNofollow) {
        // Remove existing listeners to prevent duplicates if renderData is called multiple times
        const newToggle = toggleNofollow.cloneNode(true);
        toggleNofollow.parentNode.replaceChild(newToggle, toggleNofollow);

        newToggle.addEventListener('change', (e) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "toggleNofollow" });
                }
            });
        });
    }



    // Analysis & Score
    analyzeData(data);

    // Buttons
    const btnCopy = document.getElementById('btn-copy');
    if (btnCopy) btnCopy.onclick = () => copyData(data);

    const btnDownload = document.getElementById('btn-download');
    if (btnDownload) btnDownload.onclick = () => downloadData(data, 'json');

    const btnDownloadCsv = document.getElementById('btn-download-csv');
    if (btnDownloadCsv) btnDownloadCsv.onclick = () => downloadData(data, 'csv');
}

function analyzeData(data) {
    const suggestions = [];
    let score = 100;

    // Title Analysis
    const titleLen = data.title ? data.title.length : 0;
    setText('title-length', titleLen + ' chars');
    if (titleLen === 0) {
        score -= 20;
        suggestions.push({ type: 'error', msg: 'Page title is missing.' });
    } else if (titleLen < 30 || titleLen > 60) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Title length should be between 30-60 characters.' });
    } else {
        suggestions.push({ type: 'success', msg: 'Title length is optimal.' });
    }

    // Description Analysis
    const descLen = data.description ? data.description.length : 0;
    setText('desc-length', descLen + ' chars');
    if (descLen === 0) {
        score -= 20;
        suggestions.push({ type: 'error', msg: 'Meta description is missing.' });
    } else if (descLen < 120 || descLen > 160) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Description should be between 120-160 characters.' });
    } else {
        suggestions.push({ type: 'success', msg: 'Description length is optimal.' });
    }

    // Headings Analysis
    if (data.headings.length === 0) {
        score -= 10;
        suggestions.push({ type: 'error', msg: 'No headings found on the page.' });
    } else if (!data.headings.find(h => h.tag === 'h1')) {
        score -= 10;
        suggestions.push({ type: 'error', msg: 'Missing H1 tag.' });
    } else if (data.headings.filter(h => h.tag === 'h1').length > 1) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Multiple H1 tags found. Best practice is one per page.' });
    }

    // Images Analysis
    const missingAlt = data.images.filter(img => !img.alt).length;
    if (missingAlt > 0) {
        score -= 10;
        suggestions.push({ type: 'warning', msg: `${missingAlt} images are missing ALT attributes.` });
    }

    // Link Analysis
    if (data.links) {
        if (data.links.external.length > 50) {
            suggestions.push({ type: 'warning', msg: `High number of external links (${data.links.external.length}). Check for link farming.` });
        }
        if (data.links.internal.length < 5) {
            suggestions.push({ type: 'warning', msg: 'Few internal links. Consider adding more to improve navigation.' });
        }
    }

    // Tech/Meta Analysis
    if (!data.canonical) {
        score -= 5;
        suggestions.push({ type: 'warning', msg: 'Missing Canonical URL tag.' });
    }
    if (data.robots && data.robots.includes('noindex')) {
        score -= 20;
        suggestions.push({ type: 'error', msg: 'Page is blocked from indexing (noindex).' });
    }

    // Render Suggestions
    const sContainer = document.getElementById('suggestions-container');
    if (sContainer) {
        sContainer.innerHTML = '';
        suggestions.forEach(s => {
            sContainer.innerHTML += `<div class="suggestion-item ${s.type}">${s.msg}</div>`;
        });
    }

    // Render Score
    const scoreEl = document.getElementById('seo-score');
    if (scoreEl) {
        scoreEl.textContent = Math.max(0, score);
        if (score >= 90) scoreEl.style.color = 'var(--success-color)';
        else if (score >= 70) scoreEl.style.color = 'var(--warning-color)';
        else scoreEl.style.color = 'var(--error-color)';
    }
}

// Helper: Set Text
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
