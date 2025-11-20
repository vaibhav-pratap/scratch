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
        chrome.tabs.sendMessage(tab.id, { action: "getSEOData" }, (response) => {
            if (chrome.runtime.lastError) {
                showError("Please refresh the page and try again.");
                return;
            }
            if (response) {
                renderData(response);
            }
        });

    } catch (error) {
        showError("An error occurred: " + error.message);
    }
}

function showError(msg) {
    document.querySelector('.content-area').innerHTML = `<div class="suggestion-item error">${msg}</div>`;
}

let currentData = null;

function renderData(data) {
    currentData = data;

    // Meta
    setText('meta-title', data.title);
    setText('meta-desc', data.description || 'Missing');
    setText('meta-keywords', data.keywords || 'Missing');
    setText('meta-canonical', data.canonical || 'Missing');
    setText('meta-robots', data.robots || 'Missing');

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
    hContainer.innerHTML = data.headings.length ? '' : '<div class="data-value">No headings found.</div>';
    data.headings.forEach(h => {
        hContainer.innerHTML += `<div class="heading-item ${h.tag}">${h.tag.toUpperCase()}: ${h.text}</div>`;
    });

    // Images
    document.getElementById('img-total').textContent = data.images.length;
    const missingAlt = data.images.filter(img => !img.alt).length;
    const missingEl = document.getElementById('img-missing-alt');
    missingEl.textContent = missingAlt;
    if (missingAlt > 0) missingEl.parentElement.classList.add('warning-text');

    const imgGrid = document.getElementById('images-list');
    imgGrid.innerHTML = '';
    data.images.slice(0, 20).forEach(img => { // Limit to 20 previews
        const div = document.createElement('div');
        div.className = `img-card ${!img.alt ? 'missing-alt' : ''}`;
        div.innerHTML = `
      <img src="${img.src}" class="img-preview" loading="lazy">
      <div class="img-info">${img.alt || '<span class="warning-text">No Alt</span>'}</div>
    `;
        imgGrid.appendChild(div);
    });

    // Links
    if (data.links) {
        document.getElementById('link-internal-count').textContent = data.links.internal.length;
        document.getElementById('link-external-count').textContent = data.links.external.length;

        const extList = document.getElementById('external-links-list');
        extList.innerHTML = '';
        data.links.external.slice(0, 50).forEach(l => {
            extList.innerHTML += `<div class="link-item"><a href="${l.href}" target="_blank">${l.text || l.href}</a></div>`;
        });

        const intList = document.getElementById('internal-links-list');
        intList.innerHTML = '';
        data.links.internal.slice(0, 50).forEach(l => {
            intList.innerHTML += `<div class="link-item"><a href="${l.href}" target="_blank">${l.text || l.href}</a></div>`;
        });
    }

    // Analysis & Score
    analyzeData(data);

    // Buttons
    document.getElementById('btn-copy').onclick = () => copyData(data);
    document.getElementById('btn-download').onclick = () => downloadData(data, 'json');
    document.getElementById('btn-download-csv').onclick = () => downloadData(data, 'csv');

    // Copy Icons
    document.querySelectorAll('.copy-icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.dataset.copy;
            const text = document.getElementById(targetId).innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalColor = btn.style.color;
                btn.style.color = 'var(--success-color)';
                setTimeout(() => btn.style.color = originalColor, 1000);
            });
        });
    });
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
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
    sContainer.innerHTML = '';
    suggestions.forEach(s => {
        sContainer.innerHTML += `<div class="suggestion-item ${s.type}">${s.msg}</div>`;
    });

    // Render Score
    const scoreEl = document.getElementById('seo-score');
    scoreEl.textContent = Math.max(0, score);
    if (score >= 90) scoreEl.style.color = 'var(--success-color)';
    else if (score >= 70) scoreEl.style.color = 'var(--warning-color)';
    else scoreEl.style.color = 'var(--error-color)';
}
