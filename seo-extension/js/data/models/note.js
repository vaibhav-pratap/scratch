/**
 * Note Model
 * Manages sticky notes with rich text content
 */

import { getSettings, saveSettings } from '../../core/storage.js';

export class NoteModel {
    /**
     * Create a new note
     */
    static create(content = '', color = '#FFD95A', domain = 'global', categories = []) {
        return {
            id: crypto.randomUUID(),
            content: content,
            color: color,
            categories: categories,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            domain: domain
        };
    }

    /**
     * Get all notes for a domain
     */
    static async getAll(domain = 'global') {
        const storageKey = `sticky_notes_${domain}`;
        const settings = await getSettings([storageKey]);
        const result = settings[storageKey];

        // Ensure we always return an array
        if (!result || !Array.isArray(result)) {
            return [];
        }
        return result;
    }

    /**
     * Add a new note
     */
    static async add(note, domain = 'global') {
        const notes = await NoteModel.getAll(domain);
        notes.push(note);
        const storageKey = `sticky_notes_${domain}`;
        await saveSettings({ [storageKey]: notes });
    }

    /**
     * Update a note's content or color
     */
    static async update(id, updates, domain = 'global') {
        const notes = await NoteModel.getAll(domain);
        const note = notes.find(n => n.id === id);
        if (note) {
            Object.assign(note, updates);
            note.updatedAt = Date.now();
            const storageKey = `sticky_notes_${domain}`;
            await saveSettings({ [storageKey]: notes });
        }
    }

    /**
     * Delete a note
     */
    static async delete(id, domain = 'global') {
        const notes = await NoteModel.getAll(domain);
        const filtered = notes.filter(n => n.id !== id);
        const storageKey = `sticky_notes_${domain}`;
        await saveSettings({ [storageKey]: filtered });
    }

    /**
     * Delete all notes in a category
     */
    static async deleteByCategory(categoryName, domain = 'global') {
        const notes = await NoteModel.getAll(domain);
        const filtered = notes.filter(n => {
            if (n.categories && Array.isArray(n.categories)) {
                return !n.categories.includes(categoryName);
            }
            return true;
        });
        const storageKey = `sticky_notes_${domain}`;
        await saveSettings({ [storageKey]: filtered });
    }
}
