/**
 * PouchDB Database Instance (Native)
 * Manages the PouchDB database for the SEO extension.
 */

let dbInstance = null;
let dbPromise = null;

export async function initDatabase() {
    if (dbInstance) return dbInstance;
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        try {
            console.log('[PouchDB] Initializing database...');

            if (!window.PouchDB) {
                throw new Error('PouchDB library not loaded');
            }

            // Initialize PouchDB directly
            // 'seo_extension_db' will use IndexedDB by default in the browser
            const db = new window.PouchDB('seo_extension_db', {
                auto_compaction: true
            });

            console.log('[PouchDB] Database created/opened successfully');

            // Basic verification
            try {
                const info = await db.info();
                console.log('[PouchDB] DB Info:', info);
            } catch (err) {
                console.error('[PouchDB] Failed to get DB info:', err);
            }

            dbInstance = db;
            return db;
        } catch (error) {
            console.error('[PouchDB] Failed to initialize:', error);
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
        // PouchDB doesn't strictly need 'closing' like RxDB, but we can clear the reference
        // or call close() if we want to stop event listeners.
        // await dbInstance.close(); 
        dbInstance = null;
        console.log('[PouchDB] Database reference cleared');
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
        console.error('[PouchDB] Changes feed error:', err);
    });
}
