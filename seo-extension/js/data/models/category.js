import { getDatabase } from '../../core/db.js';

export class CategoryModel {
    /**
     * Get all categories for a domain
     */
    static async getAll(domain = 'global') {
        const db = await getDatabase();
        try {
            const result = await db.allDocs({
                include_docs: true,
                startkey: 'category:',
                endkey: 'category:\uffff'
            });

            return result.rows
                .map(row => row.doc)
                .filter(doc => doc.domain === domain)
                .sort((a, b) => b.usageCount - a.usageCount)
                .map(doc => doc.name); // Return names only to match legacy string[] interface
        } catch (err) {
            return [];
        }
    }

    /**
     * Add or update a category (Legacy Compatibility: aliased as 'add')
     */
    static async add(name, domain = 'global') {
        return this.addOrUpdate(name, domain);
    }

    /**
     * Add or update a category
     */
    static async addOrUpdate(name, domain = 'global') {
        const db = await getDatabase();
        const id = `category:${name}`; // Using name as part of ID for uniqueness

        try {
            try {
                const existing = await db.get(id);
                // Update existing
                existing.usageCount += 1;
                await db.put(existing);
            } catch (err) {
                if (err.status === 404) {
                    // Create new
                    await db.put({
                        _id: id,
                        type: 'category',
                        name: name,
                        domain: domain,
                        usageCount: 1
                    });
                } else {
                    throw err;
                }
            }
        } catch (err) {
            // silent fail
        }
    }

    /**
     * Delete a category
     */
    static async delete(name) {
        const db = await getDatabase();
        const id = `category:${name}`;
        try {
            const doc = await db.get(id);
            await db.remove(doc);
        } catch (err) {
            // silent fail
        }
    }

    /**
     * Get category by name
     */
    static async get(name) {
        const db = await getDatabase();
        const id = `category:${name}`;
        try {
            return await db.get(id);
        } catch (err) {
            return null;
        }
    }
}
