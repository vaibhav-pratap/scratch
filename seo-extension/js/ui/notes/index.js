/**
 * Notes Module Entry Point
 * Orchestrates layout, modes, and input handling
 */

import { renderLayout } from './layout.js';
import { renderTodoList, handleTodoInput } from './todos.js';
import { renderScratchpad, handleScratchpadInput } from './scratchpad.js';
import { initInputHandler } from './input.js';
import { CategoryModel } from '../../data/models/category.js';
import { TodoModel } from '../../data/models/todo.js';
import { NoteModel } from '../../data/models/note.js';

let currentContainer = null;
let currentMode = 'todo'; // 'todo' | 'scratchpad'
let currentDomain = 'global';
let currentCategory = null; // Track selected category filter
let currentDateFilter = 'all'; // 'all' | 'today' | 'upcoming' | {start, end}

// Helper to get domain
function getCurrentDomain() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    resolve(url.hostname);
                } catch (e) {
                    resolve('global');
                }
            } else {
                resolve('global');
            }
        });
    });
}

export async function renderNotes(container) {
    currentContainer = container;
    currentDomain = await getCurrentDomain();

    // IMPORTANT: Hide app footer when Notes is active
    const appFooter = document.querySelector('.app-footer');
    if (appFooter) {
        appFooter.style.display = 'none';
    }

    // 1. Render Basic Layout with category tabs
    const categories = await CategoryModel.getAll(currentDomain);
    const elements = renderLayout(container, {
        mode: currentMode,
        domain: currentDomain,
        categories: categories
    });

    // 2. Initial Content Render
    updateContent(elements.contentArea);

    // Set initial visibility based on mode
    const inputBar = container.querySelector('.notes-input-bar');
    const filtersContainer = container.querySelector('.notes-filters');

    if (currentMode === 'scratchpad') {
        if (inputBar) inputBar.style.display = 'none';
        if (filtersContainer) filtersContainer.style.display = 'none';
    } else {
        if (inputBar) inputBar.style.display = 'flex';
        if (filtersContainer) filtersContainer.style.display = 'block';
    }


    // 3. Setup Mode Toggles (Tasks/Notes)
    elements.toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newMode = e.currentTarget.dataset.mode;
            if (newMode !== currentMode) {
                currentMode = newMode;

                // Update Toggle UI
                elements.toggleBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');

                // Show/hide components based on mode
                const inputBar = document.querySelector('.notes-input-bar');
                const filters = document.querySelector('.notes-filters');

                if (newMode === 'scratchpad') {
                    if (inputBar) inputBar.style.display = 'none';
                    if (filters) filters.style.display = 'none';
                } else {
                    if (inputBar) inputBar.style.display = 'flex';
                    if (filters) filters.style.display = 'block';
                }

                // Update Content
                updateContent(elements.contentArea);
            }
        });
    });

    // 4. Setup Category Tabs
    if (elements.categoryTabs) {
        const categoryTabsContainer = container.querySelector('.category-tabs');

        // Tab Clicks
        elements.categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.closest('.delete-cat-btn')) return;

                const categoryName = e.currentTarget.dataset.category;
                currentCategory = categoryName === 'all' ? null : categoryName;

                // Update Tab UI
                elements.categoryTabs.forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');

                // Re-render with filter
                updateContent(elements.contentArea);
            });
        });

        // Delete Clicks (Initial Render)
        if (categoryTabsContainer) {
            categoryTabsContainer.addEventListener('click', async (e) => {
                const deleteBtn = e.target.closest('.delete-cat-btn');
                if (deleteBtn) {
                    e.stopPropagation();
                    const catToDelete = deleteBtn.dataset.deleteCat;
                    if (confirm(`Delete category "${catToDelete}"? This will also delete all tasks and notes assigned to it.`)) {
                        await CategoryModel.delete(catToDelete, currentDomain);
                        await TodoModel.deleteByCategory(catToDelete, currentDomain);
                        await NoteModel.deleteByCategory(catToDelete, currentDomain);
                        if (currentCategory === catToDelete) {
                            currentCategory = null;
                        }
                        await refreshCategories();
                        updateContent(currentContainer.querySelector('#notes-content-area'));
                    }
                }
            });
        }
    }

    // 4.5. Setup Date Filters
    const dateFilterBar = container.querySelector('.date-filter-bar');
    if (dateFilterBar) {
        const btns = dateFilterBar.querySelectorAll('.date-filter-btn');
        const customTrigger = dateFilterBar.querySelector('.custom-range-trigger');
        const applyBtn = dateFilterBar.querySelector('#btn-apply-range');
        const startInput = dateFilterBar.querySelector('#filter-start-date');
        const endInput = dateFilterBar.querySelector('#filter-end-date');

        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = btn.dataset.dateFilter;

                if (type === 'custom') {
                    customTrigger.classList.toggle('show');
                    return;
                }

                customTrigger.classList.remove('show');
                currentDateFilter = type;

                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateContent(elements.contentArea);
            });
        });

        // Close popover on outside click
        document.addEventListener('click', (e) => {
            if (customTrigger && !customTrigger.contains(e.target)) {
                customTrigger.classList.remove('show');
            }
        });

        // Prevent closing when clicking inside popover
        if (customTrigger) {
            const popover = customTrigger.querySelector('.range-inputs-popover');
            if (popover) {
                popover.addEventListener('click', (e) => e.stopPropagation());
            }
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const start = startInput.value;
                const end = endInput.value;
                if (start && end) {
                    currentDateFilter = { start, end };
                    customTrigger.classList.remove('show');

                    btns.forEach(b => b.classList.remove('active'));
                    dateFilterBar.querySelector('[data-date-filter="custom"]').classList.add('active');

                    updateContent(elements.contentArea);
                } else {
                    alert('Please select both start and end dates');
                }
            });
        }
    }

    // 5. Setup Input
    const inputHandler = initInputHandler(elements, async (inputData) => {
        if (currentMode === 'todo') {
            await handleTodoInput(inputData, currentDomain);
            await refreshCategories(); // Reload tabs
            if (inputHandler) await inputHandler.refreshCategories(); // Reload dropdown
            renderTodoList(elements.contentArea, currentDomain, currentCategory);
        } else {
            const textToWrite = typeof inputData === 'string' ? inputData : inputData.text;
            await handleScratchpadInput(textToWrite, currentDomain);
            renderScratchpad(elements.contentArea, currentDomain);
        }
    }, currentDomain, async () => {
        // Callback for category updates (Add/Delete from input side)
        await refreshCategories();
    });

    window.currentInputHandler = inputHandler;

    // Listen for category changes from other modules (e.g. scratchpad)
    document.addEventListener('categoriesUpdated', async () => {
        await refreshCategories();
    });
}

async function refreshCategories() {
    const categories = await CategoryModel.getAll(currentDomain);
    let categoryTabsContainer = document.querySelector('.category-tabs');

    // If container for some reason isn't there (though layout.js should now always render it)
    if (!categoryTabsContainer && currentContainer) {
        const filtersContainer = currentContainer.querySelector('.notes-filters');
        if (filtersContainer) {
            const tabsDiv = document.createElement('div');
            tabsDiv.className = 'category-tabs';
            filtersContainer.insertBefore(tabsDiv, filtersContainer.firstChild); // Keep it at top of filters
            categoryTabsContainer = tabsDiv;
        }
    }

    if (categoryTabsContainer) {
        // Rebuild category tabs
        categoryTabsContainer.innerHTML = `
            <div class="category-tab ${currentCategory === null ? 'active' : ''}" data-category="all">
                <i class="fa-solid fa-list"></i> All
            </div>
            ${categories.map(cat => `
                <div class="category-tab ${currentCategory === cat ? 'active' : ''}" data-category="${cat}">
                    <i class="fa-solid fa-folder"></i> ${cat}
                    <span class="delete-cat-btn" data-delete-cat="${cat}">
                        <i class="fa-solid fa-times"></i>
                    </span>
                </div>
            `).join('')}
        `;

        // Re-attach event listeners
        categoryTabsContainer.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // If clicked on delete button, do nothing (handled separately)
                if (e.target.closest('.delete-cat-btn')) return;

                const categoryName = e.currentTarget.dataset.category;
                currentCategory = categoryName === 'all' ? null : categoryName;

                categoryTabsContainer.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');

                updateContent(currentContainer.querySelector('#notes-content-area'));
            });
        });

        // Attach Delete Listeners (using delegation or individual)
        categoryTabsContainer.querySelectorAll('.delete-cat-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const catToDelete = e.currentTarget.dataset.deleteCat;
                if (confirm(`Delete category "${catToDelete}"? This will also delete all tasks and notes assigned to it.`)) {
                    await CategoryModel.delete(catToDelete, currentDomain);
                    await TodoModel.deleteByCategory(catToDelete, currentDomain);
                    await NoteModel.deleteByCategory(catToDelete, currentDomain);
                    if (currentCategory === catToDelete) {
                        currentCategory = null;
                    }
                    await refreshCategories();
                    if (window.currentInputHandler) {
                        window.currentInputHandler.refreshCategories();
                    }
                    updateContent(currentContainer.querySelector('#notes-content-area'));
                }
            });
        });
    }
}

function updateContent(contentArea) {
    if (!contentArea) return;
    contentArea.innerHTML = '';
    if (currentMode === 'todo') {
        renderTodoList(contentArea, currentDomain, currentCategory, currentDateFilter);
    } else {
        renderScratchpad(contentArea, currentDomain);
    }
}
