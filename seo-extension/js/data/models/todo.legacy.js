/**
 * Todo Model
 * Factory and helpers for Todo objects with storage
 */

import { parseTodoInput } from '../../utils/nlp-date.js';
import { getSettings, saveSettings } from '../../core/storage.js';

export class TodoModel {
    /**
     * Create a new Todo Item from raw text or explicit params
     */
    static create(text, dueDate = null, priority = 'medium', tags = [], domain = 'global', categories = [], color = null) {
        // If text has NLP markers, parse it
        const parsed = parseTodoInput(text);

        // Ensure categories is an array
        let categoryList = [];
        if (Array.isArray(categories)) {
            categoryList = categories;
        } else if (categories) {
            categoryList = [categories];
        }

        return {
            id: crypto.randomUUID(),
            text: text || parsed.text, // Prefer passed text if available (already cleaned)
            completed: false,
            priority: priority || parsed.priority,
            dueDate: dueDate || parsed.dueDate,
            tags: (tags && tags.length > 0) ? tags : parsed.tags,
            categories: categoryList,
            color: color,
            subtasks: [],
            notes: '',
            domain: domain,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    /**
     * Get all todos for a domain
     */
    static async getAll(domain = 'global') {
        const storageKey = `todos_${domain}`;
        const settings = await getSettings([storageKey]);
        return settings[storageKey] || [];
    }

    /**
     * Add a new todo
     */
    static async add(todo, domain = 'global') {
        const todos = await TodoModel.getAll(domain);
        todos.push(todo);
        const storageKey = `todos_${domain}`;
        await saveSettings({ [storageKey]: todos });
    }

    /**
     * Delete a todo by ID
     */
    static async delete(id, domain = 'global') {
        const todos = await TodoModel.getAll(domain);
        const filtered = todos.filter(t => t.id !== id);
        const storageKey = `todos_${domain}`;
        await saveSettings({ [storageKey]: filtered });
    }

    /**
     * Delete all todos in a category (Cascading)
     */
    static async deleteByCategory(categoryName, domain = 'global') {
        const todos = await TodoModel.getAll(domain);
        const filtered = todos.filter(t => {
            if (t.categories && Array.isArray(t.categories)) {
                return !t.categories.includes(categoryName);
            }
            return t.category !== categoryName; // Backward compatibility
        });
        const storageKey = `todos_${domain}`;
        await saveSettings({ [storageKey]: filtered });
    }

    /**
     * Toggle completion status
     */
    static async toggleComplete(id, domain = 'global') {
        const todos = await TodoModel.getAll(domain);
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.updatedAt = Date.now();
            const storageKey = `todos_${domain}`;
            await saveSettings({ [storageKey]: todos });
        }
    }

    /**
     * Update a todo
     */
    static async update(id, updates, domain = 'global') {
        const todos = await TodoModel.getAll(domain);
        const todo = todos.find(t => t.id === id);
        if (todo) {
            Object.assign(todo, updates);
            todo.updatedAt = Date.now();
            const storageKey = `todos_${domain}`;
            await saveSettings({ [storageKey]: todos });
        }
    }

    /**
     * Add a subtask to a todo
     */
    static addSubtask(todo, text) {
        const subtask = {
            id: crypto.randomUUID(),
            text: text,
            completed: false
        };
        todo.subtasks.push(subtask);
        todo.updatedAt = Date.now();
        return todo;
    }

    /**
     * Toggle completion status (in-memory, for legacy support)
     */
    static toggle(todo) {
        todo.completed = !todo.completed;
        todo.updatedAt = Date.now();
        return todo;
    }
}
