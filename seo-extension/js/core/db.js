/**
 * PouchDB Database Instance
 * Manages the PouchDB database for the SEO extension.
 */

let dbInstance = null;
let dbPromise = null;

export async function initDatabase() {
    if (dbInstance) return dbInstance;
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        try {
            if (!window.PouchDB) {
                throw new Error('PouchDB library not loaded');
            }

            // Initialize PouchDB directly
            // 'seo_extension_db' will use IndexedDB by default in the browser
            const db = new window.PouchDB('seo_extension_db', {
                auto_compaction: true
            });

            // Basic verification
            try {
                await db.info();
            } catch (err) {
                // strict console cleanup
            }

            dbInstance = db;
            return db;
        } catch (error) {
            dbPromise = null;
            throw error;
        }
    })();

    return dbPromise;
}

export async function getDatabase() {
    if (!dbInstance) {
        await initDatabase();
    }
    return dbInstance;
}

export async function closeDatabase() {
    if (dbInstance) {
        dbInstance = null;
    }
}

export async function subscribeToChanges(callback) {
    const db = await getDatabase();
    return db.changes({
        since: 'now',
        live: true,
        include_docs: true
    }).on('change', (change) => {
        callback(change);
    }).on('error', (err) => {
        // strict console cleanup
    });
}
