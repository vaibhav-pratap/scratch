import { copyToClipboard } from '../../utils/clipboard.js';
import { SchemaModel } from '../models/schema.js';

// Schema Templates
const TEMPLATES = {
    Organization: {
        fields: [
            { name: 'name', label: 'Organization Name', type: 'text', placeholder: 'e.g. Acme Corp' },
            { name: 'url', label: 'Website URL', type: 'url', placeholder: 'https://example.com' },
            { name: 'logo', label: 'Logo URL', type: 'url', placeholder: 'https://example.com/logo.png' },
            { name: 'sameAs', label: 'Social Links (One per line)', type: 'textarea', placeholder: 'https://twitter.com/acme' }
        ]
    },
    LocalBusiness: {
        fields: [
            { name: 'name', label: 'Business Name', type: 'text' },
            { name: 'image', label: 'Image URL', type: 'url' },
            { name: 'telephone', label: 'Phone Number', type: 'tel' },
            { name: 'priceRange', label: 'Price Range', type: 'text', placeholder: '$$' },
            { name: 'addressLocality', label: 'City', type: 'text' },
            { name: 'addressRegion', label: 'State/Region', type: 'text' },
            { name: 'streetAddress', label: 'Street Address', type: 'text' }
        ]
    },
    FAQPage: {
        fields: [],
        listItems: {
            label: 'Questions & Answers',
            name: 'mainEntity',
            fields: [
                { name: 'question', label: 'Question', type: 'text' },
                { name: 'answer', label: 'Answer', type: 'textarea' }
            ]
        }
    },
    Article: {
        fields: [
            { name: 'headline', label: 'Headline', type: 'text' },
            { name: 'image', label: 'Main Image URL', type: 'url' },
            { name: 'authorName', label: 'Author Name', type: 'text' },
            { name: 'publisherName', label: 'Publisher Name', type: 'text' },
            { name: 'datePublished', label: 'Date Published', type: 'date' }
        ]
    },
    BreadcrumbList: {
        fields: [],
        listItems: {
            label: 'Breadcrumb Path',
            name: 'itemListElement',
            fields: [
                { name: 'name', label: 'Page Name', type: 'text' },
                { name: 'item', label: 'Page URL', type: 'url' }
            ]
        }
    }
};

let currentTabOrigin = '';

/**
 * Initialize Schema Builder
 */
export async function initSchemaBuilder() {
    const typeSelect = document.getElementById('schema-type-select');
    const formContainer = document.getElementById('schema-form-container');
    const btnSave = document.getElementById('btn-save-schema');
    const btnDownload = document.getElementById('btn-download-schema');
    const btnCopy = document.getElementById('btn-copy-schema');
    const toggleBtns = document.querySelectorAll('.schema-header .toggle-btn');
    const selectAllCheck = document.getElementById('select-all-schemas');
    const btnBulkDelete = document.getElementById('btn-bulk-delete-schema');

    if (!typeSelect || !formContainer) return;

    // View Switching Logic
    toggleBtns.forEach(btn => {
        btn.onclick = (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
            
            // Update active state
            toggleBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        };
    });

    // Bulk Delete Logic
    btnBulkDelete.onclick = async () => {
        const selected = document.querySelectorAll('.schema-checkbox:checked');
        if (selected.length === 0) return;
        
        if (confirm(`Delete ${selected.length} selected schemas?`)) {
            for (const cb of selected) {
                await SchemaModel.delete(cb.dataset.id);
            }
            loadSavedSchemas();
            updateBulkActionsVisibility();
        }
    };

    // Select All Logic
    selectAllCheck.onchange = () => {
        const checks = document.querySelectorAll('.schema-checkbox');
        checks.forEach(c => c.checked = selectAllCheck.checked);
        updateBulkActionsVisibility();
    };

    // Get current tab origin for storage
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
            try {
                currentTabOrigin = new URL(tabs[0].url).origin;
                loadSavedSchemas();
            } catch (e) {
                currentTabOrigin = 'unknown';
            }
        }
    });

    // Event Listeners
    typeSelect.onchange = () => renderForm(typeSelect.value);
    
    btnCopy.onclick = (e) => {
        const json = document.getElementById('schema-json-preview').textContent;
        copyToClipboard(json, e.currentTarget);
    };

    btnDownload.onclick = () => {
        const json = document.getElementById('schema-json-preview').textContent;
        const type = typeSelect.value;
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schema-${type.toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    btnSave.onclick = saveCurrentSchema;

    // Initial Render
    renderForm(typeSelect.value);
}

function updateBulkActionsVisibility() {
    const selectedCount = document.querySelectorAll('.schema-checkbox:checked').length;
    const bulkActions = document.getElementById('history-bulk-actions');
    if (bulkActions) {
        bulkActions.style.display = selectedCount > 0 ? 'flex' : 'none';
    }
}

function switchView(view) {
    const builderView = document.getElementById('schema-builder-view');
    const historyView = document.getElementById('schema-history-view');

    if (view === 'history') {
        builderView.classList.remove('active');
        historyView.classList.add('active');
        loadSavedSchemas();
    } else {
        historyView.classList.remove('active');
        builderView.classList.add('active');
    }
}

/**
 * Render Dynamic Form
 */
function renderForm(type) {
    const template = TEMPLATES[type];
    const container = document.getElementById('schema-form-container');
    if (!container || !template) return;

    container.innerHTML = '';

    // Static Fields
    template.fields.forEach(field => {
        const group = createFieldGroup(field);
        container.appendChild(group);
    });

    // List Items (e.g. FAQs)
    if (template.listItems) {
        const listContainer = document.createElement('div');
        listContainer.className = 'list-items-wrapper';
        listContainer.id = 'builder-list-container';
        listContainer.innerHTML = `<h4>${template.listItems.label}</h4>`;
        
        const itemsList = document.createElement('div');
        itemsList.id = 'builder-items-list';
        itemsList.className = 'flex-column gap-2';
        listContainer.appendChild(itemsList);

        const btnAdd = document.createElement('button');
        btnAdd.className = 'btn-add-item';
        btnAdd.innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
        btnAdd.onclick = () => addListItem(template.listItems);
        listContainer.appendChild(btnAdd);

        container.appendChild(listContainer);
        
        // Add first item by default
        addListItem(template.listItems);
    }

    updatePreview();
}

function createFieldGroup(field, index = null) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    group.appendChild(label);

    let input;
    if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 3;
    } else {
        input = document.createElement('input');
        input.type = field.type;
    }

    input.className = 'md-input';
    input.placeholder = field.placeholder || '';
    input.dataset.name = field.name;
    if (index !== null) input.dataset.index = index;
    
    input.oninput = updatePreview;
    group.appendChild(input);

    return group;
}

function addListItem(config) {
    const list = document.getElementById('builder-items-list');
    const index = list.children.length;
    
    const itemContainer = document.createElement('div');
    itemContainer.className = 'list-item-container';
    itemContainer.dataset.itemIndex = index;

    config.fields.forEach(field => {
        const group = createFieldGroup(field, index);
        itemContainer.appendChild(group);
    });

    const btnRemove = document.createElement('button');
    btnRemove.className = 'btn-remove-item';
    btnRemove.innerHTML = '<i class="fa-solid fa-times"></i>';
    btnRemove.onclick = () => {
        itemContainer.remove();
        updatePreview();
    };
    itemContainer.appendChild(btnRemove);

    list.appendChild(itemContainer);
    updatePreview();
}

/**
 * Update JSON-LD Preview
 */
function updatePreview() {
    const type = document.getElementById('schema-type-select').value;
    const template = TEMPLATES[type];
    const previewEl = document.getElementById('schema-json-preview');
    
    const schema = {
        "@context": "https://schema.org",
        "@type": type
    };

    // Collect Static Fields
    const inputs = document.querySelectorAll('#schema-form-container > .form-group .md-input');
    inputs.forEach(input => {
        const val = input.value.trim();
        if (val) {
            if (input.dataset.name === 'sameAs') {
                schema[input.dataset.name] = val.split('\n').filter(l => l.trim());
            } else {
                schema[input.dataset.name] = val;
            }
        }
    });

    // Collect List Items
    if (template.listItems) {
        const listName = template.listItems.name;
        const items = [];
        const itemContainers = document.querySelectorAll('.list-item-container');
        
        itemContainers.forEach((container, idx) => {
            const item = {};
            if (type === 'FAQPage') item['@type'] = 'Question';
            if (type === 'BreadcrumbList') {
                item['@type'] = 'ListItem';
                item['position'] = idx + 1;
            }

            const itemInputs = container.querySelectorAll('.md-input');
            let hasValue = false;
            
            itemInputs.forEach(input => {
                const val = input.value.trim();
                if (val) {
                    hasValue = true;
                    if (type === 'FAQPage' && input.dataset.name === 'answer') {
                        item['acceptedAnswer'] = {
                            "@type": "Answer",
                            "text": val
                        };
                    } else if (type === 'FAQPage' && input.dataset.name === 'question') {
                        item['name'] = val;
                    } else {
                        item[input.dataset.name] = val;
                    }
                }
            });

            if (hasValue) items.push(item);
        });

        if (items.length > 0) {
            schema[listName] = items;
        }
    }

    previewEl.textContent = JSON.stringify(schema, null, 2);
}

/**
 * Persistence Logic - Now using SchemaModel (PouchDB)
 */
async function saveCurrentSchema() {
    if (!currentTabOrigin) return;

    const type = document.getElementById('schema-type-select').value;
    const titleInput = document.getElementById('schema-title-input');
    const title = titleInput.value.trim() || `${type} Generated`;
    const json = document.getElementById('schema-json-preview').textContent;
    
    try {
        const schemaObj = SchemaModel.create(type, title, json, currentTabOrigin);
        await SchemaModel.add(schemaObj, currentTabOrigin);
        
        // Show success animation or feedback
        const btn = document.getElementById('btn-save-schema');
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check';
        setTimeout(() => { icon.className = 'fa-solid fa-floppy-disk'; }, 2000);

        // Auto-refresh history list in background
        loadSavedSchemas();
        
        // Optional: clear title input
        titleInput.value = '';
    } catch (err) {
        console.error('Error saving schema:', err);
    }
}

async function loadSavedSchemas() {
    const listEl = document.getElementById('saved-schemas-list');
    if (!listEl || !currentTabOrigin) return;

    try {
        const saved = await SchemaModel.getAll(currentTabOrigin);

        if (saved.length === 0) {
            listEl.innerHTML = '<p class="text-xs text-secondary">No saved schemas for this site.</p>';
            return;
        }

        listEl.innerHTML = '';
        saved.forEach(item => {
            const card = document.createElement('div');
            card.className = 'todo-card schema-item-card';
            card.style.borderLeftColor = 'var(--md-sys-color-primary)';
            
            const shortUid = (item.id || item._id.replace('schema:', '')).substring(0, 8);
            
            card.innerHTML = `
                <div class="card-content">
                    <div class="flex-row gap-3">
                        <input type="checkbox" class="schema-checkbox md-checkbox" data-id="${item._id}">
                        <div class="task-details">
                            <div class="task-text">${item.name}</div>
                            <div class="task-meta">
                                <span class="meta-chip type-chip">${item.schemaType}</span>
                                <span class="meta-chip">
                                    <i class="fa-regular fa-calendar"></i>
                                    ${new Date(item.createdAt).toLocaleDateString()}
                                </span>
                                <span class="meta-chip uid-chip">#${shortUid}</span>
                            </div>
                        </div>
                    </div>
                    <div class="item-actions" style="display: flex; gap: 8px;">
                        <button class="icon-btn small btn-load" title="Load into Builder"><i class="fa-solid fa-upload"></i></button>
                        <button class="icon-btn small btn-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;

            card.querySelector('.schema-checkbox').onchange = updateBulkActionsVisibility;
            
            card.querySelector('.btn-load').onclick = (e) => {
                e.stopPropagation();
                loadSchemaIntoForm(item);
                // Switch back to builder view automatically
                const builderToggle = document.querySelector('.toggle-btn[data-view="builder"]');
                if (builderToggle) builderToggle.click();
            };

            card.querySelector('.btn-delete').onclick = async (e) => {
                e.stopPropagation();
                if (confirm('Delete this schema?')) {
                    await SchemaModel.delete(item._id);
                    loadSavedSchemas();
                    updateBulkActionsVisibility();
                }
            };

            listEl.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading schemas:', err);
        listEl.innerHTML = '<p class="text-xs text-error">Error loading history.</p>';
    }
}

function loadSchemaIntoForm(item) {
    const data = JSON.parse(item.data);
    const typeSelect = document.getElementById('schema-type-select');
    typeSelect.value = item.schemaType;
    renderForm(item.schemaType);

    // Wait for form to render then populate
    setTimeout(() => {
        const container = document.getElementById('schema-form-container');
        
        // Static Fields
        Object.entries(data).forEach(([key, val]) => {
            const input = container.querySelector(`.md-input[data-name="${key}"]`);
            if (input) {
                if (key === 'sameAs' && Array.isArray(val)) {
                    input.value = val.join('\n');
                } else {
                    input.value = val;
                }
            }
        });

        // List Items (Simplified for now, will only handle FAQ/Breadcrumbs)
        updatePreview();
    }, 10);
}
