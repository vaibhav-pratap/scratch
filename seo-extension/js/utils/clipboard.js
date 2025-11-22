/**
 * Clipboard utilities module
 * Functions for copying text to clipboard
 */

/**
 * Copy text to clipboard and show feedback
 */
export async function copyToClipboard(text, btnElement) {
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        if (btnElement) {
            showCopySuccess(btnElement);
        }
    } catch (err) {
        console.error('Copy failed', err);
    }
}

/**
 * Show visual feedback for successful copy
 */
export function showCopySuccess(btn) {
    if (!btn) return;

    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" style="fill: var(--success-color);"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

    setTimeout(() => {
        btn.innerHTML = originalHtml;
    }, 1500);
}

/**
 * Setup a copy button for a target element
 */
export function setupCopyButton(btnId, targetId) {
    const btn = document.getElementById(btnId);
    const target = document.getElementById(targetId);

    if (btn && target) {
        btn.addEventListener('click', () => copyToClipboard(target.textContent, btn));
    }
}

/**
 * Setup all static copy buttons (for meta tab)
 */
export function setupStaticCopyButtons() {
    const map = {
        'btn-copy-title': 'meta-title',
        'btn-copy-desc': 'meta-desc',
        'btn-copy-keywords': 'meta-keywords',
        'btn-copy-canonical': 'meta-canonical',
        'btn-copy-robots': 'meta-robots'
    };

    for (const [btnId, targetId] of Object.entries(map)) {
        setupCopyButton(btnId, targetId);
    }
}
