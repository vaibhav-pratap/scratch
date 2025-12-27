/**
 * Category Model
 * Manages categories for tasks
 */

import { getSettings, saveSettings } from '../../core/storage.js';

export class CategoryModel {
    /**
     * Get all categories for a domain
     */
    static async getAll(domain = 'global') {
        const storageKey = `categories_${domain}`;
        const settings = await getSettings([storageKey]);
        return settings[storageKey] || [];
    }

    /**
     * Add a new category
     */
    static async add(categoryName, domain = 'global') {
        const categories = await CategoryModel.getAll(domain);

        // Check if already exists
        if (categories.includes(categoryName)) {
            return false;
        }

        categories.push(categoryName);
        const storageKey = `categories_${domain}`;
        await saveSettings({ [storageKey]: categories });
        return true;
    }

    /**
     * Delete a category
     */
    static async delete(categoryName, domain = 'global') {
        const categories = await CategoryModel.getAll(domain);
        const filtered = categories.filter(c => c !== categoryName);
        const storageKey = `categories_${domain}`;
        await saveSettings({ [storageKey]: filtered });
    }

    /**
     * Rename a category
     */
    static async rename(oldName, newName, domain = 'global') {
        const categories = await CategoryModel.getAll(domain);
        const index = categories.indexOf(oldName);
        if (index !== -1) {
            categories[index] = newName;
            const storageKey = `categories_${domain}`;
            await saveSettings({ [storageKey]: categories });
            return true;
        }
        return false;
    }
}
