import { getDatabase } from '../../core/db.js';
import { parseTodoInput } from '../../utils/todo-parser.js';

export class TodoModel {
    /**
     * Create a new Todo Item
     */
    static create(text, dueDate = null, priority = null, tags = [], domain = 'global', categories = [], color = null) {
        const parsed = parseTodoInput(text);

        let categoryList = Array.isArray(categories) ? categories : (categories ? [categories] : []);
        const id = crypto.randomUUID();

        // Resolve Priority: Explicit > Parsed > Default
        const finalPriority = priority || parsed.priority || 'medium';

        return {
            _id: `todo:${id}`,
            id: id, // Legacy/UI ID
            type: 'todo',
            text: parsed.text || text, // Prefer parsed (clean) text
            completed: false,
            priority: finalPriority,
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
        const db = await getDatabase();
        try {
            const result = await db.allDocs({
                include_docs: true,
                startkey: 'todo:',
                endkey: 'todo:\uffff'
            });

            return result.rows
                .map(row => row.doc)
                .filter(doc => doc.domain === domain)
                .sort((a, b) => b.createdAt - a.createdAt);
        } catch (err) {
            console.error('[TodoModel] Failed to getAll:', err);
            return [];
        }
    }

    /**
     * Add a new todo
     */
    static async add(todo, domain = 'global') {
        console.log('[TodoModel.add] Adding todo:', todo);
        const db = await getDatabase();
        const todoData = {
            ...todo,
            _id: todo._id || `todo:${crypto.randomUUID()}`,
            type: 'todo',
            domain,
            categories: todo.categories || [],
            tags: todo.tags || [],
            subtasks: todo.subtasks || [],
            createdAt: todo.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        // Populate legacy id
        if (!todoData.id) todoData.id = todoData._id.replace('todo:', '');

        await db.put(todoData);
        return todoData;
    }

    /**
     * Update a todo
     */
    static async update(id, updates, domain = 'global') {
        const db = await getDatabase();
        const docId = id.startsWith('todo:') ? id : `todo:${id}`;

        try {
            const doc = await db.get(docId);
            const updatedDoc = {
                ...doc,
                ...updates,
                updatedAt: Date.now()
            };
            await db.put(updatedDoc);
        } catch (err) {
            console.error(`[TodoModel] Failed to update todo ${docId}:`, err);
        }
    }

    /**
     * Toggle completion status
     */
    static async toggleComplete(id) {
        const db = await getDatabase();
        const docId = id.startsWith('todo:') ? id : `todo:${id}`;

        try {
            const doc = await db.get(docId);
            doc.completed = !doc.completed;
            doc.updatedAt = Date.now();
            await db.put(doc);
        } catch (err) {
            console.error(`[TodoModel] Failed to toggle complete ${docId}:`, err);
        }
    }

    /**
     * Delete a todo
     */
    static async delete(id) {
        const db = await getDatabase();
        const docId = id.startsWith('todo:') ? id : `todo:${id}`;

        try {
            const doc = await db.get(docId);
            await db.remove(doc);
        } catch (err) {
            if (err.status !== 404) console.error(`[TodoModel] Failed to delete todo ${docId}:`, err);
        }
    }

    /**
     * Get incomplete todos
     */
    static async getIncomplete(domain = 'global') {
        const all = await this.getAll(domain);
        return all.filter(t => !t.completed);
    }

    /**
     * Get todos by priority
     */
    static async getByPriority(priority, domain = 'global') {
        const all = await this.getAll(domain);
        return all.filter(t => t.priority === priority);
    }

    /**
     * Delete all todos in a category
     */
    static async deleteByCategory(categoryName, domain = 'global') {
        const db = await getDatabase();
        const all = await this.getAll(domain);
        const toDelete = all.filter(t => t.categories && t.categories.includes(categoryName));

        await Promise.all(toDelete.map(doc => db.remove(doc)));
    }
}
