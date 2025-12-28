/**
 * Input Handler Module
 * Manages state for Priority, Date, Color, Category and Text Input
 * WITH HASHTAG DETECTION
 */

import { CategoryModel } from '../../data/models/category.js';
import { processHashtags } from '../../utils/hashtags.js';

export function initInputHandler(elements, onSend, domain, onCategoryUpdate) {
    const {
        inputField, sendBtn,
        priorityPill, priorityDropdown, priorityLabel,
        datePill, dateInput, dateLabel,
        colorBtn, colorPalette, colorIndicator, customColorInput,
        addCategoryBtn, categorySelector, categoryLabel, categoryDropdown,
        categoryModal, categoryModalInput, categoryModalCancel, categoryModalCreate
    } = elements;

    // State
    const state = {
        priority: 'medium',
        dueDate: null,
        color: '#1976D2',
        categories: [],
        text: '',
        tags: []
    };

    // --- Load and Render Categories ---
    async function loadCategories() {
        const categories = await CategoryModel.getAll(domain);

        // FULL REBUILD to ensure event listeners are fresh and order is correct
        categoryDropdown.innerHTML = `
            <div class="dropdown-item" data-value=""><i class="fa-solid fa-xmark"></i> No Categories</div>
            ${categories.map(cat => `
                <div class="dropdown-item" data-value="${cat}">
                    <i class="fa-solid fa-folder"></i> ${cat}
                    <span class="delete-btn-inline" data-delete-cat="${cat}">
                        <i class="fa-solid fa-times"></i>
                    </span>
                </div>
            `).join('')}
        `;

        // Re-attach listeners to ALL items
        categoryDropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation(); // Stop bubbling to selector

                // Handle Delete
                const deleteBtn = e.target.closest('.delete-btn-inline');
                if (deleteBtn) {
                    const catToDelete = deleteBtn.dataset.deleteCat;
                    if (confirm(`Delete category "${catToDelete}"?`)) {
                        await CategoryModel.delete(catToDelete, domain);
                        state.categories = state.categories.filter(c => c !== catToDelete);
                        await loadCategories();
                        if (onCategoryUpdate) onCategoryUpdate();

                        // Update UI Label
                        if (state.categories.length === 0) {
                            categoryLabel.innerText = 'No Category';
                            categorySelector.classList.remove('has-selection');
                        } else {
                            categoryLabel.innerText = state.categories.length === 1 ? state.categories[0] : `${state.categories.length} Categories`;
                        }
                    }
                    return;
                }

                const val = item.dataset.value;
                if (val) {
                    if (!state.categories.includes(val)) {
                        state.categories.push(val);
                    } else {
                        state.categories = state.categories.filter(c => c !== val);
                    }

                    if (state.categories.length === 0) {
                        categoryLabel.innerText = 'No Category';
                        categorySelector.classList.remove('has-selection');
                    } else {
                        categoryLabel.innerText = state.categories.length === 1 ? state.categories[0] : `${state.categories.length} Categories`;
                        categorySelector.classList.add('has-selection');
                    }
                } else {
                    state.categories = [];
                    categoryLabel.innerText = 'No Category';
                    categorySelector.classList.remove('has-selection');
                }
            });
        });
    }

    // --- Load and Render Priorities ---
    async function loadPriorities() {
        const defaults = [
            { id: 'high', label: 'High', color: 'var(--md-sys-color-error)' },
            { id: 'medium', label: 'Medium', color: 'var(--md-sys-color-primary)' },
            { id: 'low', label: 'Low', color: 'var(--md-sys-color-tertiary)' }
        ];

        // Fetch custom priorities from storage
        // Assuming we store them as a simple array of strings for now, or objects
        // Let's use a simple storage key 'custom_priorities'
        // We'll treat them as simple labels.
        // For now, simpler implementation: just append custom ones.
        /* 
           NOTE: Providing a true robust custom priority system usually implies a Model. 
           For this task, we will store them in localStorage/settings simply.
        */

        // Note: Since 'CategoryModel' exists, maybe we should've had 'PriorityModel', 
        // but for now let's keep it local to this UI or settings.
        const { custom_priorities } = await chrome.storage.local.get(['custom_priorities']);
        const customs = custom_priorities || [];

        const customHtml = customs.map(p => {
            // Handle both old string format and new object format
            const prioName = typeof p === 'string' ? p : p.name;
            const prioColor = typeof p === 'string' ? '#FF9500' : (p.color || '#FF9500');

            return `
            <div class="dropdown-item" data-value="${prioName}" data-type="custom">
                <div class="priority-circle" style="background: ${prioColor};"></div> ${prioName}
                <span class="delete-prio-btn" data-prio="${prioName}" style="margin-left: auto; opacity: 0.4;"><i class="fa-solid fa-times"></i></span>
            </div>
        `;
        }).join('');

        const listContainer = document.getElementById('custom-priorities-list');
        if (listContainer) {
            listContainer.innerHTML = customHtml;
        }


        // Attach listeners to ALL dropdown items (static + custom)
        priorityDropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // If delete button clicked
                if (e.target.closest('.delete-prio-btn')) {
                    e.stopPropagation();
                    const prioToDelete = e.target.closest('.delete-prio-btn').dataset.prio;
                    deletePriority(prioToDelete);
                    return;
                }

                state.priority = item.dataset.value;
                priorityLabel.innerText = state.priority.charAt(0).toUpperCase() + state.priority.slice(1);

                // Update the priority indicator circle color
                const priorityIndicator = document.getElementById('priority-indicator');
                const circleInItem = item.querySelector('.priority-circle');
                if (priorityIndicator && circleInItem) {
                    const isCustom = item.dataset.type === 'custom';
                    if (isCustom) {
                        priorityIndicator.removeAttribute('data-prio');
                        priorityIndicator.style.background = circleInItem.style.background;
                    } else {
                        priorityIndicator.style.background = '';
                        priorityIndicator.setAttribute('data-prio', state.priority);
                    }
                }

                priorityDropdown.classList.remove('show');
                priorityPill.classList.add('active');
            });
        });
    }


    async function addPriority(name, color) {
        if (!name) return;
        const { custom_priorities } = await chrome.storage.local.get(['custom_priorities']);
        const customs = custom_priorities || [];
        // Store as object with name and color
        const existing = customs.find(c => c.name === name || c === name);
        if (!existing) {
            customs.push({ name, color: color || '#FF9500' });
            await chrome.storage.local.set({ custom_priorities: customs });
            loadPriorities();
        }
    }

    async function deletePriority(name) {
        const { custom_priorities } = await chrome.storage.local.get(['custom_priorities']);
        const customs = custom_priorities || [];
        const newCustoms = customs.filter(c => {
            const cName = typeof c === 'string' ? c : c.name;
            return cName !== name;
        });
        await chrome.storage.local.set({ custom_priorities: newCustoms });
        loadPriorities();
    }

    // Init Logic
    loadCategories();
    loadPriorities();


    // --- Priority Input Logic ---
    const addPrioBtn = document.getElementById('btn-add-priority');
    const newPrioInput = document.getElementById('input-new-priority');
    const prioColorInput = document.getElementById('input-priority-color');

    if (addPrioBtn && newPrioInput) {
        addPrioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const color = prioColorInput ? prioColorInput.value : '#FF9500';
            addPriority(newPrioInput.value.trim(), color);
            newPrioInput.value = '';
            if (prioColorInput) prioColorInput.value = '#FF9500';
        });

        newPrioInput.addEventListener('click', e => e.stopPropagation());
        newPrioInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const color = prioColorInput ? prioColorInput.value : '#FF9500';
                addPriority(newPrioInput.value.trim(), color);
                newPrioInput.value = '';
                if (prioColorInput) prioColorInput.value = '#FF9500';
            }
        });

        // Prevent color picker from closing dropdown
        if (prioColorInput) {
            prioColorInput.addEventListener('click', e => e.stopPropagation());
        }
    }



    // --- Priority Pill Logic ---
    priorityPill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('.dropdown-item')) return;
        priorityDropdown.classList.toggle('show');
        categoryDropdown.classList.remove('show');
    });

    // --- Category Selector Logic ---
    categorySelector.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('.dropdown-item')) return;
        categoryDropdown.classList.toggle('show');
        priorityDropdown.classList.remove('show');
    });

    // "No Category" (Handled in loadCategories via rebuilding)


    // --- Category Modal Logic (Insert # in input) ---
    // --- Category Modal Logic (Insert # in input) ---
    // 4. Add Category Button
    if (addCategoryBtn) {
        // Prevent focus loss when clicking the button
        addCategoryBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        addCategoryBtn.addEventListener('click', () => {
            // Check if we need a leading space
            const selection = window.getSelection();
            let needsSpace = false;

            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                // Simple heuristic: check character before cursor if possible, 
                // or just verify if text exists and doesn't end in space.
                // However, accessing context around cursor in contenteditable is tricky.
                // Simpler: If the input has text and it's not empty, prepend space just in case,
                // or rely on user. 
                // Let's try to match the "smart spacing" from before but based on innerText generally
                // if we assume appending to end, but here we insert at cursor.
                // Safest: Just insert '#'. User can type space. 
                // BUT user said "written after the text", implying flow.
                // Let's check the last char of textContent to see if we should space.
                const text = inputField.innerText;
                if (text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n')) {
                    // CAUTION: This assumes cursor is at the end. 
                    // If cursor is in middle "Hell|o", inserting " #" -> "Hell #o".
                    // Ideally we just insert "#".
                    needsSpace = false;
                }
            }

            // For now, simple insertion of "#" is most predictable.
            // If the user wants a space, they usually type it.
            // But if they just finished typing a word and click +, "Word#" is ugly. "Word #" is better.
            // Let's insert " #" (space hash) if appropriate? 
            // Let's stick to appending pure '#' but ensuring focus wasn't lost.
            // Or better: Insert "#" and let user manage space?
            // User requirement: "written after the text".

            const textToInsert = '#';
            document.execCommand('insertText', false, textToInsert);
        });
    }

    categoryModalCancel.addEventListener('click', () => {
        categoryModal.classList.remove('show');
    });

    categoryModalCreate.addEventListener('click', async () => {
        const categoryName = categoryModalInput.value.trim();
        if (categoryName) {
            const success = await CategoryModel.add(categoryName, domain);
            if (success) {
                await loadCategories();
                if (onCategoryUpdate) onCategoryUpdate();
                categoryModal.classList.remove('show');

                // Auto-select the new category
                if (!state.categories.includes(categoryName)) {
                    state.categories.push(categoryName);
                }
                categoryLabel.innerText = state.categories.length === 1 ? state.categories[0] : `${state.categories.length} Categories`;
                categorySelector.classList.add('has-selection');
            } else {
                alert('Category already exists!');
            }
        }
    });

    // Enter key in modal
    categoryModalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            categoryModalCreate.click();
        }
    });

    // Close modal on overlay click
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) {
            categoryModal.classList.remove('show');
        }
    });

    // --- Date Logic ---
    dateInput.addEventListener('change', (e) => {
        if (e.target.value) {
            state.dueDate = e.target.value;
            // No label to update anymore, just the icon state
            datePill.classList.add('active'); // datePill is now the button ID
            datePill.title = `Due: ${new Date(state.dueDate).toLocaleDateString()}`;
        } else {
            state.dueDate = null;
            datePill.classList.remove('active');
            datePill.title = "Due Date";
        }
    });

    // --- Color Logic ---
    colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorPalette.classList.toggle('show');
    });

    colorPalette.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            state.color = opt.dataset.color;
            colorIndicator.style.backgroundColor = state.color;
            colorPalette.classList.remove('show');
        });
    });

    if (customColorInput) {
        customColorInput.addEventListener('change', (e) => {
            state.color = e.target.value;
            colorIndicator.style.backgroundColor = state.color;
        });
    }

    // --- Send Logic with Hashtag Detection ---
    const handleSend = async () => {
        // Use innerHTML to capture formatting, but we might want innerText for hashtags
        const rawContent = inputField.innerHTML;
        const rawText = inputField.innerText.trim();

        if (rawText) {
            // Process hashtags from PLAIN text
            const { cleanedText, hashtags } = processHashtags(rawText);

            // For the final saved text, we prefer the HTML content.
            // However, processHashtags strips tags from 'cleanedText'.
            // If we want rich text support, we typically save HTML.
            // Todos: Save rawContent (HTML).
            // Hashtags are metadata.
            state.text = rawContent; // Save HTML

            // Treat ALL hashtags as categories
            if (hashtags.length > 0) {
                const existingCategories = await CategoryModel.getAll(domain);
                for (const hashtag of hashtags) {
                    const lowerHashtag = hashtag.toLowerCase();
                    const existingCat = existingCategories.find(c => c.toLowerCase() === lowerHashtag);

                    if (!existingCat) {
                        await CategoryModel.addOrUpdate(hashtag, domain);
                        if (!state.categories.includes(hashtag)) {
                            state.categories.push(hashtag);
                        }
                    } else {
                        if (!state.categories.includes(existingCat)) {
                            state.categories.push(existingCat);
                        }
                    }
                }
            }

            // Add all hashtags as tags
            state.tags = hashtags;

            onSend({ ...state });
            inputField.innerHTML = '';
            resetState();
        }
    };

    function resetState() {
        state.text = '';
        state.priority = 'medium';
        state.dueDate = null;
        state.categories = [];
        state.tags = [];

        priorityLabel.innerText = 'Medium';
        priorityPill.classList.remove('active');

        // Update priority indicator circle back to medium color
        const priorityIndicator = document.getElementById('priority-indicator');
        if (priorityIndicator) {
            priorityIndicator.style.background = '';
            priorityIndicator.setAttribute('data-prio', 'medium');
        }

        datePill.classList.remove('active');
        datePill.title = "Due Date";
        dateInput.value = '';

        categoryLabel.innerText = 'No Category';
        categorySelector.classList.remove('has-selection');
    }

    sendBtn.addEventListener('click', handleSend);

    inputField.addEventListener('keydown', async (e) => { // keydown handles Enter better than keypress
        if (e.key === 'Enter') {
            if (!e.shiftKey) {
                e.preventDefault(); // Send
                await handleSend();
            }
            // If Shift+Enter, allow default (new line)
        }
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!priorityPill.contains(e.target)) {
            priorityDropdown.classList.remove('show');
        }
        if (!categorySelector.contains(e.target)) {
            categoryDropdown.classList.remove('show');
        }
        if (!colorBtn.contains(e.target) && !colorPalette.contains(e.target)) {
            colorPalette.classList.remove('show');
        }
    });

    return {
        refreshCategories: loadCategories
    };
}
