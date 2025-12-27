/**
 * Settings toggles module
 * Handles highlight toggles and sidepanel toggle
 */

import { getSettings, saveSettings } from '../core/storage.js';
import { sendToggleMessage } from '../core/messaging.js';

/**
 * Setup highlight toggles for link types
 */
export function setupHighlightToggles() {
    const types = ['nofollow', 'follow', 'external', 'internal', 'mailto', 'tel'];

    types.forEach(type => {
        const toggle = document.getElementById(`toggle-${type}`);
        if (!toggle) return;

        // Load state
        getSettings([`highlight_${type}`]).then((result) => {
            const isChecked = result[`highlight_${type}`] === true;
            toggle.checked = isChecked;
            updateToggleVisuals(toggle, type, isChecked);

            // Apply if enabled (re-inject on popup open)
            if (isChecked) {
                sendToggleMessage(type, true);
            }
        });

        // Change listener
        toggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            saveSettings({ [`highlight_${type}`]: isChecked });
            updateToggleVisuals(toggle, type, isChecked);
            sendToggleMessage(type, isChecked);
        });
    });
}

/**
 * Setup sidepanel toggle
 */
export function setupSidePanelToggle() {
    const toggle = document.getElementById('toggle-sidepanel');
    if (!toggle) return;

    // Load state
    getSettings(['openInSidePanel']).then((result) => {
        toggle.checked = result.openInSidePanel === true;
    });

    // Change listener
    toggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        saveSettings({ openInSidePanel: isChecked });

        // Set panel behavior
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: isChecked })
            .catch((error) => console.error(error));
    });

    // Setup Default Notes Toggle
    const toggleNotes = document.getElementById('toggle-default-notes');
    if (toggleNotes) {
        // Load state
        getSettings(['defaultToNotes']).then((result) => {
            toggleNotes.checked = result.defaultToNotes === true;
        });

        // Change listener
        toggleNotes.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            saveSettings({ defaultToNotes: isChecked });
        });
    }
}

/**
 * Update visual state of toggle
 */
function updateToggleVisuals(toggle, type, isChecked) {
    if (!toggle) return;
    const group = toggle.closest('.data-group');
    if (!group) return;

    if (isChecked) {
        group.classList.add('active-highlight', type);
    } else {
        group.classList.remove('active-highlight', type);
    }
}
