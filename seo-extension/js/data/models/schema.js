import { getDatabase } from '../../core/db.js';

export class SchemaModel {
    /**
     * Create a new Schema object
     */
    static create(type, name, data, domain = 'global') {
        const id = crypto.randomUUID();
        return {
            _id: `schema:${id}`,
            id: id,
            type: 'schema',
            schemaType: type, // Organization, LocalBusiness, etc.
            name: name || `${type} Schema`,
            data: data, // The JSON-LD content string or object
            domain: domain,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    /**
     * Get all schemas for a domain
     */
    static async getAll(domain = 'global') {
        const db = await getDatabase();
        try {
            const result = await db.allDocs({
                include_docs: true,
                startkey: 'schema:',
                endkey: 'schema:\uffff'
            });

            return result.rows
                .map(row => row.doc)
                .filter(doc => doc.domain === domain)
                .sort((a, b) => b.createdAt - a.createdAt);
        } catch (err) {
            console.error('[SchemaModel] getAll error:', err);
            return [];
        }
    }

    /**
     * Add a new schema
     */
    static async add(schemaData, domain = 'global') {
        const db = await getDatabase();
        const doc = {
            ...schemaData,
            _id: schemaData._id || `schema:${crypto.randomUUID()}`,
            type: 'schema',
            domain,
            createdAt: schemaData.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        if (!doc.id) doc.id = doc._id.replace('schema:', '');

        await db.put(doc);
        return doc;
    }

    /**
     * Delete a schema
     */
    static async delete(id) {
        const db = await getDatabase();
        const docId = id.startsWith('schema:') ? id : `schema:${id}`;

        try {
            const doc = await db.get(docId);
            await db.remove(doc);
        } catch (err) {
            console.error('[SchemaModel] delete error:', err);
        }
    }

    /**
     * Get schema by ID
     */
    static async getById(id) {
        const db = await getDatabase();
        const docId = id.startsWith('schema:') ? id : `schema:${id}`;
        try {
            return await db.get(docId);
        } catch (err) {
            return null;
        }
    }
}
