import { getDatabase } from '../../core/db.js';

export class NoteModel {
    /**
     * Create a new note object (does not save to DB)
     */
    static create(content = '', color = '#FFD95A', domain = 'global', categories = []) {
        const id = crypto.randomUUID();
        return {
            _id: `note:${id}`, // PouchDB ID
            id: id,            // Legacy/UI ID
            type: 'note',
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
        const db = await getDatabase();
        try {
            // Fetch all docs with 'note:' prefix
            const result = await db.allDocs({
                include_docs: true,
                startkey: 'note:',
                endkey: 'note:\uffff'
            });

            const notes = result.rows
                .map(row => row.doc)
                .filter(doc => doc.domain === domain)
                .sort((a, b) => b.updatedAt - a.updatedAt); // Descending sort

            return notes;
        } catch (err) {
            return [];
        }
    }

    /**
     * Add a new note
     */
    static async add(note, domain = 'global') {
        const db = await getDatabase();

        // Ensure structure
        const noteData = {
            ...note,
            _id: note._id || `note:${note.id || crypto.randomUUID()}`,
            type: 'note',
            domain,
            categories: note.categories || [],
            createdAt: note.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        // Remove legacy 'id' if present to avoid confusion
        if (!noteData.id) noteData.id = noteData._id.replace('note:', '');

        try {
            await db.put(noteData);
            return noteData;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Update a note
     */
    static async update(id, updates, domain = 'global') {
        const db = await getDatabase();
        const docId = id.startsWith('note:') ? id : `note:${id}`;

        try {
            const doc = await db.get(docId);

            const updatedDoc = {
                ...doc,
                ...updates,
                updatedAt: Date.now()
            };

            await db.put(updatedDoc);
        } catch (err) {
            // silent fail
        }
    }

    /**
     * Delete a note
     */
    static async delete(id) {
        const db = await getDatabase();
        const docId = id.startsWith('note:') ? id : `note:${id}`;

        try {
            const doc = await db.get(docId);
            await db.remove(doc);
        } catch (err) {
            // silent fail
        }
    }

    /**
     * Delete all notes in a category
     */
    static async deleteByCategory(categoryName, domain = 'global') {
        const db = await getDatabase();

        try {
            const allNotes = await this.getAll(domain);
            const notesToDelete = allNotes.filter(n => n.categories && n.categories.includes(categoryName));

            await Promise.all(notesToDelete.map(doc => db.remove(doc)));
        } catch (err) {
            // silent fail
        }
    }
}
