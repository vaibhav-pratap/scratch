import { copyToClipboard } from '../../utils/clipboard.js';

/**
 * Links Tab Renderer
 * Renders an interactive links dashboard with filtering and search
 */

let allLinks = [];
let currentFilter = 'all';
let searchQuery = '';

export function renderLinksTab(data) {
    const container = document.getElementById('links-list-container');
    if (!container) return;

    // Combine and cache links
    allLinks = [
        ...(data.links?.internal || []).map(l => ({ ...l, type: 'internal' })),
        ...(data.links?.external || []).map(l => ({ ...l, type: 'external' }))
    ];

    // Initial render
    renderStaticStructure(container);
    updateStats(data.links);
    applyFilters();
    attachGlobalListeners(container);
}

function renderStaticStructure(container) {
    container.innerHTML = `
        <div class="links-tab-container">
            <!-- Stats -->
            <div class="links-stats-grid" id="links-stats">
                <!-- Injected by updateStats -->
            </div>

            <!-- Toolbar -->
            <div class="links-toolbar">
                <div class="links-search-container">
                    <svg class="search-icon-mini" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input type="text" class="links-search-input" placeholder="Search links or anchor text..." id="links-search">
                </div>
                <div class="links-filter-row">
                    <button class="filter-chip active" data-filter="all"><i class="fa-solid fa-layer-group"></i> All</button>
                    <button class="filter-chip" data-filter="internal"><i class="fa-solid fa-link"></i> Internal</button>
                    <button class="filter-chip" data-filter="external"><i class="fa-solid fa-arrow-up-right-from-square"></i> External</button>
                    <button class="filter-chip" data-filter="nofollow"><i class="fa-solid fa-shield-halved"></i> Nofollow</button>
                </div>
            </div>

            <!-- List -->
            <div class="links-list" id="links-render-target">
                <!-- Injected by applyFilters -->
            </div>
        </div>
    `;
}

function updateStats(links) {
    const statsContainer = document.getElementById('links-stats');
    if (!statsContainer || !links) return;

    const total = (links.internal?.length || 0) + (links.external?.length || 0);
    const internal = links.internal?.length || 0;
    const external = links.external?.length || 0;
    const nofollow = [...(links.internal || []), ...(links.external || [])].filter(l => l.rel?.includes('nofollow')).length;

    statsContainer.innerHTML = `
        <div class="link-stat-card">
            <span class="link-stat-value">${internal}</span>
            <span class="link-stat-label">Internal</span>
        </div>
        <div class="link-stat-card">
            <span class="link-stat-value">${external}</span>
            <span class="link-stat-label">External</span>
        </div>
        <div class="link-stat-card">
            <span class="link-stat-value">${nofollow}</span>
            <span class="link-stat-label">Nofollow</span>
        </div>
        <div class="link-stat-card">
            <span class="link-stat-value">${total}</span>
            <span class="link-stat-label">Total</span>
        </div>
    `;
}

function applyFilters() {
    const target = document.getElementById('links-render-target');
    if (!target) return;

    let filtered = allLinks;

    // Filter by type
    if (currentFilter === 'internal') {
        filtered = filtered.filter(l => l.type === 'internal');
    } else if (currentFilter === 'external') {
        filtered = filtered.filter(l => l.type === 'external');
    } else if (currentFilter === 'nofollow') {
        filtered = filtered.filter(l => l.rel?.includes('nofollow'));
    }

    // Filter by search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(l => 
            l.text.toLowerCase().includes(query) || 
            l.href.toLowerCase().includes(query)
        );
    }

    if (filtered.length === 0) {
        target.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔗</div>
                <p>No links found matching your criteria</p>
            </div>
        `;
        return;
    }

    // Render cards (limit to early performance, maybe 200)
    target.innerHTML = filtered.slice(0, 200).map(l => renderLinkCard(l)).join('');
}

function renderLinkCard(link) {
    const isInternal = link.type === 'internal';
    const isNofollow = link.rel?.includes('nofollow');
    const isBlank = link.target === '_blank';

    return `
        <div class="link-card">
            <div class="link-card-header">
                <span class="link-anchor" title="${link.text}">${link.text || '<span class="text-muted">No anchor text</span>'}</span>
                <div class="link-badges">
                    <span class="link-badge ${isInternal ? 'badge-internal' : 'badge-external'}">${link.type}</span>
                    ${isNofollow ? '<span class="link-badge badge-nofollow">nofollow</span>' : ''}
                    ${isBlank ? '<span class="link-badge badge-blank">_blank</span>' : ''}
                </div>
            </div>
            <div class="link-url-row">
                <a href="${link.href}" target="_blank" class="link-url" title="${link.href}">${link.href}</a>
                <div class="link-actions">
                    <button class="link-action-btn copy-url" data-url="${link.href}" title="Copy URL">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function attachGlobalListeners(container) {
    // Search
    const searchInput = document.getElementById('links-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFilters();
        });
    }

    // Filters
    container.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            applyFilters();
        });
    });

    // Delegated actions
    const target = document.getElementById('links-render-target');
    if (target) {
        target.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('.copy-url');
            if (copyBtn) {
                const url = copyBtn.dataset.url;
                copyToClipboard(url, copyBtn);
            }
        });
    }
}
