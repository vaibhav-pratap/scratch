/**
 * Sticky Notes Module - iOS 18 Style
 * Multiple rich text note cards with formatting
 */

import { NoteModel } from '../../data/models/note.js';
import { CategoryModel } from '../../data/models/category.js';
import { processHashtags } from '../../utils/hashtags.js';

const NOTE_COLORS = [
    '#FFD95A', // Yellow
    '#FFB5E8', // Pink
    '#B5DEFF', // Blue
    '#C7FFED', // Mint
    '#FFC9A0', // Peach
    '#E7C6FF', // Purple
];

// Selection State
let isSelectionMode = false;
let selectedNotes = new Set();

export async function renderScratchpad(container, domain) {
    let notes = await NoteModel.getAll(domain);

    // 1. Sort by Date (Most recent first)
    notes.sort((a, b) => b.updatedAt - a.updatedAt);

    // Default: Show Empty State if no notes
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="notes-grid-container">
                <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--md-sys-color-on-surface-variant);">
                    <i class="fa-solid fa-note-sticky" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                    <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px; color: var(--md-sys-color-on-surface);">No sticky notes yet</div>
                    <div style="font-size: 14px; margin-bottom: 24px;">Create your first note to get started</div>
                </div>
            </div>
            <div class="scratchpad-button-wrapper">
                <button class="add-note-pill" id="add-note-btn">
                    <i class="fa-solid fa-plus"></i>
                    <span>Add Note</span>
                </button>
            </div>
        `;
        attachNoteEventListeners(container, domain);
        return;
    }

    container.innerHTML = `
        <div class="notes-grid-container">
            <div class="notes-grid" id="notes-grid">
                ${notes.map(note => createNoteCardHTML(note)).join('')}
            </div>
        </div>
        <div class="scratchpad-button-wrapper">
            <button class="add-note-pill secondary" id="select-notes-btn" title="Select Notes">
                <i class="fa-solid fa-check-double"></i>
            </button>
            <button class="add-note-pill secondary" id="download-notes-btn" title="Download Notes">
                <i class="fa-solid fa-download"></i>
            </button>
            <button class="add-note-pill ${isSelectionMode && selectedNotes.size > 0 ? 'destructive' : ''}" id="add-note-btn">
                ${isSelectionMode && selectedNotes.size > 0
            ? `<i class="fa-solid fa-trash"></i><span>Delete (${selectedNotes.size})</span>`
            : `<i class="fa-solid fa-plus"></i><span>Add Note</span>`}
            </button>
        </div>
    `;

    // Attach event listeners
    attachNoteEventListeners(container, domain);
}

function createNoteCardHTML(note) {
    const isSelected = selectedNotes.has(note.id);
    return `
        <div class="note-card ${isSelectionMode ? 'selection-mode' : ''} ${isSelected ? 'selected' : ''}"
             data-note-id="${note.id}"
             style="background-color: ${note.color};">
            <div class="selection-overlay">
                <div class="selection-check">
                    <i class="fa-solid fa-check"></i>
                </div>
            </div>
            <div class="note-toolbar">
                <div class="toolbar-left">
                    <button class="tool-btn" data-cmd="bold" title="Bold">
                        <i class="fa-solid fa-bold"></i>
                    </button>
                    <button class="tool-btn" data-cmd="italic" title="Italic">
                        <i class="fa-solid fa-italic"></i>
                    </button>
                    <button class="tool-btn" data-cmd="underline" title="Underline">
                        <i class="fa-solid fa-underline"></i>
                    </button>
                    <div class="v-separator" style="width:1px; height:16px; background:rgba(0,0,0,0.1); margin:0 4px;"></div>
                    <button class="tool-btn" data-cmd="insertUnorderedList" title="Bullet List">
                        <i class="fa-solid fa-list-ul"></i>
                    </button>
                    <button class="tool-btn" data-cmd="insertOrderedList" title="Numbered List">
                        <i class="fa-solid fa-list-ol"></i>
                    </button>
                    <div class="v-separator" style="width:1px; height:16px; background:rgba(0,0,0,0.1); margin:0 4px;"></div>
                    <button class="tool-btn more-btn" title="More Formatting">
                        <i class="fa-solid fa-ellipsis"></i>
                    </button>
                    <div class="color-picker-wrapper">
                        <button class="tool-btn color-btn" title="Note Color">
                            <i class="fa-solid fa-palette"></i>
                        </button>
                    </div>
                </div>
                <button class="delete-note-btn" title="Delete Note">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            
            <!-- Inline Color Palette -->
            <div class="note-color-palette">
                ${NOTE_COLORS.map(color => `
                    <div class="note-color-option" style="background-color: ${color};" data-color="${color}"></div>
                `).join('')}
            </div>

            <!-- Inline More Tools -->
            <div class="note-more-tools">
                <button class="tool-btn" data-cmd="fontSize" data-action="increase" title="Increase Font Size">
                    <i class="fa-solid fa-text-height"></i>
                    <i class="fa-solid fa-plus" style="font-size: 7px; position: absolute; top: 4px; right: 4px;"></i>
                </button>
                <button class="tool-btn" data-cmd="fontSize" data-action="decrease" title="Decrease Font Size">
                    <i class="fa-solid fa-text-height"></i>
                    <i class="fa-solid fa-minus" style="font-size: 7px; position: absolute; bottom: 4px; right: 4px;"></i>
                </button>
                <div class="v-separator" style="width:1px; height:16px; background:rgba(0,0,0,0.1); margin:0 8px;"></div>
                <button class="tool-btn" data-cmd="createLink" title="Add Link">
                    <i class="fa-solid fa-link"></i>
                </button>
                <button class="tool-btn" data-cmd="formatBlock" data-val="blockquote" title="Quote">
                    <i class="fa-solid fa-quote-left"></i>
                </button>
                <button class="tool-btn" data-cmd="formatBlock" data-val="pre" title="Code">
                    <i class="fa-solid fa-code"></i>
                </button>
            </div>

            <div class="note-content" contenteditable="true" data-placeholder="Write your note...">${note.content}</div>
            <div class="note-footer">
                <div class="note-meta">
                    <span class="note-date">${new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                    <span class="note-id">#${note.id.substring(0, 6).toUpperCase()}</span>
                </div>
                <button class="tool-btn note-download-btn" title="Download PNG">
                    <i class="fa-solid fa-download"></i>
                </button>
            </div>
        </div>
    `;
}

export async function triggerNoteCreation(container, domain) {
    const notesGrid = container.querySelector('#notes-grid');

    // Create note in model
    const newNote = NoteModel.create('', NOTE_COLORS[0], domain);
    await NoteModel.add(newNote, domain);

    // If grid missing (e.g. empty state), re-render entire view
    if (!notesGrid) {
        await renderScratchpad(container, domain);
        // After re-render, find the new card to scroll to it
        const newGrid = container.querySelector('#notes-grid');
        if (newGrid) {
            const newCard = newGrid.querySelector(`[data - note - id="${newNote.id}"]`);
            if (newCard) {
                const contentArea = newCard.querySelector('.note-content');
                contentArea.focus();
                newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return;
    }

    // Normal case: Append to existing grid
    const cardHTML = createNoteCardHTML(newNote);
    notesGrid.insertAdjacentHTML('beforeend', cardHTML);
    const newCard = notesGrid.lastElementChild;
    attachCardEventListeners(newCard, domain);

    // Focus and scroll the new note
    const contentArea = newCard.querySelector('.note-content');
    contentArea.focus();
    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function attachNoteEventListeners(container, domain) {
    const notesGrid = container.querySelector('#notes-grid');
    const addNoteBtn = container.querySelector('#add-note-btn');
    const downloadBtn = container.querySelector('#download-notes-btn');

    // if (!notesGrid) return; // REMOVED: Do not exit early, as buttons might exist outside grid (empty state)

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            if (isSelectionMode && selectedNotes.size > 0) {
                deleteSelectedNotes(container, domain);
            } else {
                triggerNoteCreation(container, domain);
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (isSelectionMode && selectedNotes.size > 0) {
                downloadSelectedNotesAsZip(container);
            } else {
                downloadNotesAsImage(container);
            }
        });
    }

    const selectBtn = container.querySelector('#select-notes-btn');
    if (selectBtn) {
        selectBtn.innerHTML = isSelectionMode
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-check-double"></i>';

        selectBtn.addEventListener('click', () => {
            toggleSelectionMode(container, domain);
        });
    }

    // Attach listeners to existing notes
    // Attach listeners to existing notes (only if grid exists)
    if (notesGrid) {
        notesGrid.querySelectorAll('.note-card').forEach(card => {
            attachCardEventListeners(card, domain);
        });
    }
}

function attachCardEventListeners(card, domain) {
    const noteId = card.dataset.noteId;
    const content = card.querySelector('.note-content');
    const toolbar = card.querySelector('.note-toolbar');
    const deleteBtn = card.querySelector('.delete-note-btn');
    const colorBtn = card.querySelector('.color-btn');
    const colorPalette = card.querySelector('.note-color-palette');
    const moreBtn = card.querySelector('.more-btn');
    const moreTools = card.querySelector('.note-more-tools');
    const downloadBtn = card.querySelector('.note-download-btn');

    // Auto-save on content change
    let saveTimeout;
    content.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            const text = content.innerText;
            const { tags } = processHashtags(text);

            // Sync with CategoryModel (add any new tags as categories)
            let categoryDelta = false;
            if (tags && Array.isArray(tags)) {
                for (const tag of tags) {
                    const added = await CategoryModel.add(tag, domain);
                    if (added) categoryDelta = true;
                }
            }

            if (categoryDelta && window.currentInputHandler) {
                // Refresh both dropdowns and tabs if new categories detected
                if (window.currentInputHandler.refreshCategories) {
                    await window.currentInputHandler.refreshCategories();
                }
                // index.js should have a global way to refresh tabs, 
                // but let's assume the callback handles it or we'll add a trigger.
                document.dispatchEvent(new CustomEvent('categoriesUpdated'));
            }

            await NoteModel.update(noteId, {
                content: content.innerHTML,
                categories: tags
            }, domain);

            // Update date in UI
            const dateSpan = card.querySelector('.note-date');
            if (dateSpan) {
                dateSpan.textContent = new Date().toLocaleDateString();
            }
        }, 1000);
    });

    // Formatting Toolbar & More Tools
    // Important: Query buttons from the CARD, not just the toolbar, to include '.note-more-tools' buttons
    card.querySelectorAll('.tool-btn[data-cmd]').forEach(btn => {
        // Prevent focus loss on click
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        btn.addEventListener('click', (e) => {
            e.preventDefault();

            const cmd = btn.dataset.cmd;

            if (cmd === 'fontSize') {
                const action = btn.dataset.action;
                // Find the note content - it's a sibling of note-more-tools
                const noteCard = card; // We already have card from the parent scope
                const noteContent = noteCard.querySelector('.note-content');

                if (noteContent) {
                    // Get current font size (or use default 14px)
                    const currentStyle = window.getComputedStyle(noteContent);
                    const currentSizePx = parseFloat(currentStyle.fontSize) || 14;

                    // Calculate new size
                    let newSize;
                    if (action === 'increase') {
                        newSize = Math.min(currentSizePx + 2, 72); // Max 72px
                    } else if (action === 'decrease') {
                        newSize = Math.max(currentSizePx - 2, 2); // Min 2px
                    }

                    // Apply new size with important to override CSS
                    noteContent.style.setProperty('font-size', `${newSize}px`, 'important');
                    // Also adjust line-height proportionally (1.5x font size is standard)
                    noteContent.style.setProperty('line-height', `${newSize * 1.5}px`, 'important');

                    // Fix for old notes: remove font-size from all child elements (font tags, spans, etc.)
                    noteContent.querySelectorAll('*').forEach(el => {
                        el.style.removeProperty('font-size');
                        // Also remove old font tags that might have size attributes
                        if (el.tagName === 'FONT') {
                            el.removeAttribute('size');
                        }
                    });
                }
            } else if (cmd === 'createLink') {
                const url = prompt('Enter URL:');
                if (url) {
                    document.execCommand(cmd, false, url);
                }
            } else if (cmd === 'formatBlock') {
                const val = btn.dataset.val;
                document.execCommand(cmd, false, val);
            } else {
                document.execCommand(cmd, false, null);
            }

            updateToolbarState(toolbar);
        });
    });

    // Content Interaction Handlers for Toolbar State
    const updateState = () => {
        // Small timeout to allow selection to settle/browser to apply command
        requestAnimationFrame(() => updateToolbarState(toolbar));
    };

    content.addEventListener('keyup', updateState);
    content.addEventListener('mouseup', updateState);
    content.addEventListener('click', updateState);

    // Optimized selection change: only distinct handler per focused note
    content.addEventListener('focus', () => {
        document.addEventListener('selectionchange', updateState);
        updateState(); // Update immediately on focus
    });

    content.addEventListener('blur', () => {
        document.removeEventListener('selectionchange', updateState);
    });

    // More Button Toggle
    if (moreBtn && moreTools) {
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent outside click logic immediate trigger

            // Close color palette if open
            if (colorPalette.classList.contains('show')) {
                colorPalette.classList.remove('show');
            }

            moreTools.classList.toggle('show');
            moreBtn.classList.toggle('active');
        });
    }

    // Color picker
    colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close more tools if open
        if (moreTools && moreTools.classList.contains('show')) {
            moreTools.classList.remove('show');
            if (moreBtn) moreBtn.classList.remove('active');
        }

        colorPalette.classList.toggle('show');
    });

    colorPalette.querySelectorAll('.note-color-option').forEach(opt => {
        opt.addEventListener('click', async (e) => {
            const color = opt.dataset.color;
            card.style.backgroundColor = color;
            await NoteModel.update(noteId, { color }, domain);
            colorPalette.classList.remove('show');
        });
    });

    // Close Expandables on outside click
    document.addEventListener('click', (e) => {
        // Close Color Palette
        if (!colorBtn.contains(e.target) && !colorPalette.contains(e.target)) {
            colorPalette.classList.remove('show');
        }

        // Close More Tools
        if (moreTools && moreBtn) {
            if (!moreBtn.contains(e.target) && !moreTools.contains(e.target)) {
                moreTools.classList.remove('show');
                moreBtn.classList.remove('active');
            }
        }
    });

    // Individual download
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            downloadNoteAsImage(card);
        });
    }

    // Delete note
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent bubbling
            if (confirm('Delete this note?')) {
                console.log('[Scratchpad] Deleting note:', noteId);
                await NoteModel.delete(noteId, domain);
                card.remove();
            }
        });
    }

    // Placeholder behavior
    if (!content.textContent.trim()) {
        content.classList.add('empty');
    }

    content.addEventListener('focus', () => {
        content.classList.remove('empty');
    });

    // Selection Mode Click Handling
    card.addEventListener('click', (e) => {
        if (isSelectionMode) {
            e.preventDefault();
            e.stopPropagation();
            toggleNoteSelection(card, domain);
        }
    });

    // Content Editable protection in selection mode
    content.addEventListener('mousedown', (e) => {
        if (isSelectionMode) {
            e.preventDefault();
        }
    });
}


function toggleSelectionMode(container, domain) {
    isSelectionMode = !isSelectionMode;
    if (!isSelectionMode) {
        selectedNotes.clear();
    }
    renderScratchpad(container, domain);
}

function toggleNoteSelection(card, domain) {
    const noteId = card.dataset.noteId;
    if (selectedNotes.has(noteId)) {
        selectedNotes.delete(noteId);
        card.classList.remove('selected');
    } else {
        selectedNotes.add(noteId);
        card.classList.add('selected');
    }

    // Update button text
    const btn = document.querySelector('#add-note-btn');
    if (btn) {
        if (selectedNotes.size > 0) {
            btn.classList.add('destructive');
            btn.innerHTML = `<i class="fa-solid fa-trash"></i><span>Delete (${selectedNotes.size})</span>`;
        } else {
            btn.classList.remove('destructive');
            btn.innerHTML = `<i class="fa-solid fa-plus"></i><span>Add Note</span>`;
        }
    }

    // Update Download Button State
    const downloadBtn = document.querySelector('#download-notes-btn');
    if (downloadBtn) {
        if (selectedNotes.size > 0) {
            downloadBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i>`;
            downloadBtn.title = `Download ${selectedNotes.size} Notes as ZIP`;
        } else {
            downloadBtn.innerHTML = `<i class="fa-solid fa-download"></i>`;
            downloadBtn.title = "Download Notes";
        }
    }
}

async function downloadSelectedNotesAsZip(container) {
    // @ts-ignore
    const jszipMissing = typeof JSZip === 'undefined';
    // @ts-ignore
    const htmlToImageMissing = typeof htmlToImage === 'undefined';

    if (jszipMissing || htmlToImageMissing) {
        console.error(`[Scratchpad] Missing libraries: ${jszipMissing ? 'JSZip ' : ''}${htmlToImageMissing ? 'htmlToImage' : ''} `);
        alert(`Export libraries not loaded: ${jszipMissing ? 'JSZip ' : ''}${htmlToImageMissing ? 'html-to-image' : ''}. Please refresh.`);
        return;
    }

    const downloadBtn = container.querySelector('#download-notes-btn');
    if (downloadBtn) downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        // @ts-ignore
        const zip = new JSZip();
        const grid = container.querySelector('#notes-grid');

        // Prepare UI for capture (hide tools)
        const toolbars = grid.querySelectorAll('.note-toolbar');
        // Hide download buttons inside notes, but keep footer for metadata
        const noteDownloadBtns = grid.querySelectorAll('.note-download-btn');
        const overlays = grid.querySelectorAll('.selection-overlay'); // Hide selection overlays

        toolbars.forEach(t => t.style.display = 'none');
        noteDownloadBtns.forEach(b => b.style.opacity = '0');
        overlays.forEach(o => o.style.display = 'none');

        // Capture Loop
        // 1. Temporarily strip selection mode classes to ensure clean capture
        const selectedCards = grid.querySelectorAll('.note-card.selected');
        selectedCards.forEach(c => {
            c.classList.remove('selected');
            c.classList.add('temp-deselect');
        });

        // Wait for styles in DOM to settle
        await new Promise(r => setTimeout(r, 150));

        for (const noteId of selectedNotes) {
            const card = grid.querySelector(`.note - card[data - note - id="${noteId}"]`);
            if (card) {
                // Ensure no toolbars or overlays are visible on this specific card
                const overlays = card.querySelectorAll('.selection-overlay');
                overlays.forEach(o => o.style.display = 'none');

                // @ts-ignore
                const dataUrl = await htmlToImage.toPng(card, {
                    quality: 1.0,
                    pixelRatio: 2,
                    backgroundColor: null,
                    style: { transform: 'none' } // Force no transform (e.g. scale)
                });

                // Add to ZIP (remove data:image/png;base64, prefix)
                const hexId = noteId.substring(0, 6).toUpperCase();
                zip.file(`Note - ${hexId}.png`, dataUrl.split(',')[1], { base64: true });

                // Restore individual overlays
                overlays.forEach(o => o.style.removeProperty('display'));
            }
        }

        // Generate ZIP
        if (Object.keys(zip.files).length > 0) {
            const content = await zip.generateAsync({ type: "blob" });

            // Download
            const link = document.createElement('a');
            link.download = `Selected_Notes_${new Date().toISOString().slice(0, 10)}.zip`;
            link.href = URL.createObjectURL(content);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        } else {
            console.warn('[Scratchpad] Zip file is empty, skipping download.');
        }

        // Restore UI
        grid.querySelectorAll('.note-card.temp-deselect').forEach(c => {
            c.classList.remove('temp-deselect');
            c.classList.add('selected');
        });

        toolbars.forEach(t => t.style.display = 'flex');
        noteDownloadBtns.forEach(b => b.style.opacity = '1');
        overlays.forEach(o => o.style.removeProperty('display')); // Revert to CSS control
        if (downloadBtn) downloadBtn.innerHTML = '<i class="fa-solid fa-file-zipper"></i>';

    } catch (error) {
        console.error('[Scratchpad] ZIP export failed:', error);
        if (downloadBtn) downloadBtn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';

        // Force Restore UI
        const grid = container.querySelector('#notes-grid');
        if (grid) {
            grid.querySelectorAll('.note-card.temp-deselect').forEach(c => {
                c.classList.remove('temp-deselect');
                c.classList.add('selected');
            });

            grid.querySelectorAll('.note-toolbar').forEach(t => t.style.display = 'flex');
            grid.querySelectorAll('.note-download-btn').forEach(b => b.style.opacity = '1');
            grid.querySelectorAll('.selection-overlay').forEach(o => o.style.removeProperty('display'));
        }
    }
}

async function deleteSelectedNotes(container, domain) {
    if (confirm(`Delete ${selectedNotes.size} selected note(s) ? `)) {
        for (const noteId of selectedNotes) {
            await NoteModel.delete(noteId, domain);
        }
        selectedNotes.clear();
        isSelectionMode = false; // Exit selection mode after delete
        renderScratchpad(container, domain);
    }
}

export async function handleScratchpadInput(text, domain) {
    // Create new note with the input text
    const newNote = NoteModel.create(text, NOTE_COLORS[0], domain);
    await NoteModel.add(newNote, domain);

    // Trigger re-render
    const container = document.getElementById('notes-content-area');
    if (container) {
        await renderScratchpad(container, domain);
    }
}

async function downloadNotesAsImage(container) {
    // Check if htmlToImage is loaded
    // @ts-ignore
    if (typeof htmlToImage === 'undefined') {
        console.error('[Scratchpad] html-to-image library not found!');
        alert('Export library not loaded. Please refresh the page.');
        return;
    }

    const grid = container.querySelector('#notes-grid');
    if (!grid) return;

    const btn = container.querySelector('#download-notes-btn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        console.log('[Scratchpad] Starting global export (html-to-image)...');

        // 1. Prepare for capture: Deep Defensive UI masking
        const toolbars = grid.querySelectorAll('.note-toolbar');
        const footers = grid.querySelectorAll('.note-footer');

        // Use display: none for maximum reliability in capture
        toolbars.forEach(t => t.style.display = 'none');
        footers.forEach(f => f.style.display = 'none');

        // Blur active element to remove cursor
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        // Stabilization delay
        await new Promise(r => setTimeout(r, 400));

        // 2. Use htmlToImage.toPng
        // @ts-ignore
        const dataUrl = await htmlToImage.toPng(grid, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: null,
            style: {
                transform: 'scale(1)',
            }
        });

        console.log('[Scratchpad] Capture complete, triggering download...');

        // 3. Restore UI promptly
        toolbars.forEach(t => { t.style.display = 'flex'; t.style.opacity = '1'; });
        footers.forEach(f => { f.style.display = 'flex'; f.style.opacity = '1'; });
        if (btn) btn.innerHTML = '<i class="fa-solid fa-download"></i>';

        // 4. Download Trigger
        const link = document.createElement('a');
        link.download = `scratchbook - ${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('[Scratchpad] Global export failed:', error);
        // Restore UI on error
        const toolbars = grid.querySelectorAll('.note-toolbar');
        const footers = grid.querySelectorAll('.note-footer');
        toolbars.forEach(t => { t.style.display = 'flex'; t.style.opacity = '1'; });
        footers.forEach(f => { f.style.display = 'flex'; f.style.opacity = '1'; });

        if (btn) btn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
        setTimeout(() => {
            if (btn) btn.innerHTML = '<i class="fa-solid fa-download"></i>';
        }, 2000);
    }
}

async function downloadNoteAsImage(card) {
    // @ts-ignore
    if (typeof htmlToImage === 'undefined') {
        console.error('[Scratchpad] html-to-image library not found!');
        return;
    }

    const downloadBtn = card.querySelector('.note-download-btn');
    if (downloadBtn) downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        console.log('[Scratchpad] Starting individual note export (html-to-image)...');

        const toolbar = card.querySelector('.note-toolbar');
        if (toolbar) toolbar.style.display = 'none';

        // Hide download button specifically, but keep footer visible for date/ID
        if (downloadBtn) downloadBtn.style.opacity = '0';

        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        await new Promise(r => setTimeout(r, 300));

        // Use htmlToImage
        // @ts-ignore
        const dataUrl = await htmlToImage.toPng(card, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: null
        });

        console.log('[Scratchpad] Note capture complete.');

        // Restore UI
        if (toolbar) { toolbar.style.display = 'flex'; toolbar.style.opacity = '1'; }
        if (downloadBtn) downloadBtn.style.opacity = '1';
        if (downloadBtn) downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';

        // Download
        const link = document.createElement('a');
        const hexId = card.dataset.noteId ? card.dataset.noteId.substring(0, 6).toUpperCase() : 'EXPORT';
        link.download = `Note - ${hexId}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('[Scratchpad] Note export failed:', error);
        // Restore UI on error
        const toolbar = card.querySelector('.note-toolbar');
        const footer = card.querySelector('.note-footer');
        if (toolbar) { toolbar.style.display = 'flex'; toolbar.style.opacity = '1'; }
        if (footer) { footer.style.display = 'flex'; footer.style.opacity = '1'; }

        if (downloadBtn) downloadBtn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
        setTimeout(() => {
            if (downloadBtn) downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
        }, 2000);
    }
}

export function updateToolbarState(toolbar) {
    if (!toolbar) return;

    // 1. Safety Check: Only update if the relevant content area is focused
    // This prevents "wrong button" activation from other notes or loose focus
    const card = toolbar.closest('.note-card');
    const content = card ? card.querySelector('.note-content') : null;

    if (!content || document.activeElement !== content) {
        // If we heavily enforce this, buttons might visually "turn off" when we click them 
        // (if focus momentarily leaves). But we used mousedown.preventDefault(), so focus SHOULD stay.
        // Let's rely on that.
        // Optional: clear all active states if not focused?
        // toolbar.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        return;
    }

    toolbar.querySelectorAll('.tool-btn[data-cmd]').forEach(btn => {
        const cmd = btn.dataset.cmd;
        try {
            let isActive = false;

            if (cmd === 'formatBlock') {
                const val = btn.dataset.val;
                const currentVal = document.queryCommandValue(cmd);
                // headings, blockquote, pre
                isActive = (currentVal === val) || (val === 'pre' && currentVal === 'pre');
            } else {
                isActive = document.queryCommandState(cmd);
            }

            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        } catch (e) {
            btn.classList.remove('active');
        }
    });
}
