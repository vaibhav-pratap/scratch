/**
 * Todo List Logic - iOS 18 Style
 */

import { TodoModel } from '../../data/models/todo.js';
import { getSettings, saveSettings } from '../../core/storage.js';
import { parseTodoInput } from '../../utils/todo-parser.js';

export async function renderTodoList(container, domain, categoryFilter = null, dateFilter = null) {
    const todos = await TodoModel.getAll(domain);

    // 1. Sort by Date (Upcoming first)
    // - Overdue/Today first
    // - No date at the end, sorted by creation time
    let sortedTodos = [...todos].sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt - a.createdAt;
    });

    // 2. Apply category filter
    let filteredTodos = sortedTodos;
    if (categoryFilter) {
        filteredTodos = filteredTodos.filter(t => {
            if (t.categories && Array.isArray(t.categories)) {
                return t.categories.includes(categoryFilter);
            }
            return t.category === categoryFilter; // Backward compatibility
        });
    }

    // 3. Apply date range filter
    if (dateFilter && dateFilter.start && dateFilter.end) {
        const start = new Date(dateFilter.start).setHours(0, 0, 0, 0);
        const end = new Date(dateFilter.end).setHours(23, 59, 59, 999);
        filteredTodos = filteredTodos.filter(t => {
            if (!t.dueDate) return false;
            return t.dueDate >= start && t.dueDate <= end;
        });
    } else if (dateFilter === 'today') {
        const today = new Date().setHours(0, 0, 0, 0);
        const tonight = new Date().setHours(23, 59, 59, 999);
        filteredTodos = filteredTodos.filter(t => t.dueDate >= today && t.dueDate <= tonight);
    } else if (dateFilter === 'upcoming') {
        const tonight = new Date().setHours(23, 59, 59, 999);
        filteredTodos = filteredTodos.filter(t => t.dueDate > tonight);
    }


    // Filters logic
    const activeTodos = filteredTodos.filter(t => !t.completed);
    const completedTodos = filteredTodos.filter(t => t.completed);

    const listHtml = document.createElement('div');
    listHtml.className = 'todo-list-container';

    if (filteredTodos.length === 0) {
        const message = categoryFilter
            ? `No tasks in "${categoryFilter}"`
            : 'No tasks yet.';
        listHtml.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-inbox"></i>
                </div>
                <p class="empty-message">${message}</p>
                <p class="empty-hint">Tap below to add your first task</p>
            </div>`;
    } else {
        // Render Active Tasks
        if (activeTodos.length > 0) {
            const activeGroup = document.createElement('div');
            activeGroup.className = 'todo-group';

            activeTodos.forEach(todo => {
                activeGroup.appendChild(createTodoCard(todo, domain, container));
            });

            listHtml.appendChild(activeGroup);
        }

        // Render Completed Tasks
        if (completedTodos.length > 0) {
            const completedHeader = document.createElement('div');
            completedHeader.className = 'section-header';
            completedHeader.innerHTML = `<span>Completed</span><span class="count">${completedTodos.length}</span>`;
            listHtml.appendChild(completedHeader);

            const completedGroup = document.createElement('div');
            completedGroup.className = 'todo-group';

            completedTodos.forEach(todo => {
                completedGroup.appendChild(createTodoCard(todo, domain, container));
            });

            listHtml.appendChild(completedGroup);
        }
    }

    container.innerHTML = '';
    container.appendChild(listHtml);
}

function createTodoCard(todo, domain, container) {
    const card = document.createElement('div');
    card.className = `todo-card ${todo.completed ? 'completed' : ''}`;

    // Priority indicator (left border)
    const priorityColors = {
        high: '#FF3B30',
        medium: '#007AFF',
        low: '#34C759'
    };

    if (todo.color) {
        card.style.borderLeftColor = todo.color;
    } else {
        card.style.borderLeftColor = priorityColors[todo.priority] || priorityColors.medium;
    }

    card.innerHTML = `
        <div class="card-content">
            <label class="checkbox-container">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
            
            <div class="task-details">
                <div class="task-text">${todo.text}</div>
                
                ${(todo.category || todo.dueDate || todo.tags?.length > 0 || (todo.priority && todo.priority !== 'medium')) ? `
                    <div class="task-meta">
                        ${(todo.priority && todo.priority !== 'medium') ? `
                            <span class="meta-chip priority-chip ${todo.priority}" style="color: ${priorityColors[todo.priority]}; border-color: ${priorityColors[todo.priority]}20; background-color: ${priorityColors[todo.priority]}10;">
                                <i class="fa-solid fa-flag"></i>
                                ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                            </span>
                        ` : ''}

                        ${(todo.categories && todo.categories.length > 0) ? todo.categories.map(cat => `
                            <span class="meta-chip category-chip">
                                <i class="fa-solid fa-folder"></i>
                                ${cat}
                            </span>
                        `).join('') : (todo.category ? `
                            <span class="meta-chip category-chip">
                                <i class="fa-solid fa-folder"></i>
                                ${todo.category}
                            </span>
                        ` : '')}
                        
                        ${todo.dueDate ? `
                            <span class="meta-chip date-chip">
                                <i class="fa-regular fa-calendar"></i>
                                ${new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        ` : ''}
                        
                        ${todo.tags && todo.tags.length > 0 ? todo.tags
                .filter(tag => {
                    const cleanTag = tag.replace(/^#/, '');
                    const lowerTag = cleanTag.toLowerCase();
                    const isInCategory = (todo.categories || []).some(cat => cat.toLowerCase() === lowerTag);
                    const isOldCategory = (todo.category || '').toLowerCase() === lowerTag;
                    return !isInCategory && !isOldCategory;
                })
                .map(tag => `
                            <span class="meta-chip tag-chip">
                                ${tag.startsWith('#') ? tag : '#' + tag}
                            </span>
                        `).join('') : ''}
                    </div>
                ` : ''}
            </div>
            
            <button class="delete-btn">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;

    // Events
    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', async () => {
        await TodoModel.toggleComplete(todo.id, domain);
        renderTodoList(container, domain, container.dataset.categoryFilter);
    });

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async () => {
        await TodoModel.delete(todo.id, domain);
        renderTodoList(container, domain, container.dataset.categoryFilter);
    });

    return card;
}

export async function handleTodoInput(inputData, domain) {
    // inputData is { text, priority, dueDate, color, category }
    console.log('[handleTodoInput] Received input:', inputData);

    // 1. NLP Parse (still useful for tags)
    const nlpResult = parseTodoInput(inputData.text);

    // 2. Use manual overrides
    const finalPriority = inputData.priority || nlpResult.priority;

    // Date: Convert YYYY-MM-DD to timestamp
    let finalDueDate = null;
    if (inputData.dueDate) {
        const parts = inputData.dueDate.split('-');
        finalDueDate = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
    } else {
        finalDueDate = nlpResult.dueDate;
    }

    // 3. Create todo with explicit parameters
    const newTodo = TodoModel.create(
        inputData.text, // Use the cleaned text passed from input handler
        finalDueDate,
        finalPriority,
        inputData.tags || nlpResult.tags, // Prefer passed tags from hashtag detection
        domain,
        inputData.categories, // Pass categories array directly
        inputData.color // Pass color directly
    );

    // 4. Save
    await TodoModel.add(newTodo, domain);
}
