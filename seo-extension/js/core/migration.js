/**
 * Data Migration Utility
 * Migrates data from chrome.storage.local to SQLite
 */

import { getSettings } from './storage.js';

import { NoteModel } from '../data/models/note.js';
import { TodoModel } from '../data/models/todo.js';
import { CategoryModel } from '../data/models/category.js';

/**
 * Migrates data from chrome.storage.local to RxDB
 */
export async function migrateAllToDB(domain = 'global') {
    console.log(`[Migration] Starting DB migration for domain: ${domain}`);

    try {
        // 1. Migrate Categories
        const categoriesKey = `categories_${domain}`;
        const { [categoriesKey]: categories } = await getSettings([categoriesKey]);
        if (categories && Array.isArray(categories)) {
            console.log(`[Migration] Migrating ${categories.length} categories...`);
            for (const cat of categories) {
                await CategoryModel.addOrUpdate(cat, domain);
            }
        }

        // 2. Migrate Notes
        const notesKey = `sticky_notes_${domain}`;
        const { [notesKey]: notes } = await getSettings([notesKey]);
        if (notes && Array.isArray(notes)) {
            console.log(`[Migration] Migrating ${notes.length} notes...`);
            for (const note of notes) {
                // Check if already exists/valid structure or just add
                // We'll use add() which handles it (NoteModel now uses RxDB)
                await NoteModel.add(note, domain);
            }
        }

        // 3. Migrate Todos
        const todosKey = `todos_${domain}`;
        const { [todosKey]: todos } = await getSettings([todosKey]);
        if (todos && Array.isArray(todos)) {
            console.log(`[Migration] Migrating ${todos.length} todos...`);
            for (const todo of todos) {
                await TodoModel.add(todo, domain);
            }
        }

        console.log(`[Migration] Migration completed for domain: ${domain}`);
        return true;
    } catch (error) {
        console.error(`[Migration] Migration failed for domain: ${domain}`, error);
        return false;
    }
}
