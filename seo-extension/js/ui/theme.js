/**
 * Theme module for dark/light mode switching
 */

import { saveTheme, getTheme } from '../core/storage.js';

/**
 * Initialize theme toggle functionality
 */
export function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    // Load saved theme
    const savedTheme = getTheme();
    htmlEl.setAttribute('data-theme', savedTheme);

    // Add click listener
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

/**
 * Set the current theme
 */
export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
}

/**
 * Get the current active theme
 */
export function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}
