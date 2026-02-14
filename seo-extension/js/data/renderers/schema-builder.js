import { copyToClipboard } from '../../utils/clipboard.js';
import { SchemaModel } from '../models/schema.js';

// Schema Templates — each field can have `required: true`
const TEMPLATES = {
    Organization: {
        icon: 'fa-sitemap',
        fields: [
            { name: 'name', label: 'Organization Name', type: 'text', placeholder: 'e.g. Acme Corp', required: true },
            { name: 'url', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true },
            { name: 'logo', label: 'Logo URL', type: 'url', placeholder: 'https://example.com/logo.png' },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief description of the organization' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'info@example.com' },
            { name: 'telephone', label: 'Phone', type: 'tel', placeholder: '+1-800-555-0199' },
            { name: 'sameAs', label: 'Social Links (One per line)', type: 'textarea', placeholder: 'https://twitter.com/acme' }
        ]
    },
    LocalBusiness: {
        icon: 'fa-shop',
        fields: [
            { name: 'name', label: 'Business Name', type: 'text', required: true },
            { name: 'image', label: 'Image URL', type: 'url' },
            { name: 'telephone', label: 'Phone Number', type: 'tel', required: true },
            { name: 'priceRange', label: 'Price Range', type: 'text', placeholder: '$$' },
            { name: 'streetAddress', label: 'Street Address', type: 'text', required: true },
            { name: 'addressLocality', label: 'City', type: 'text', required: true },
            { name: 'addressRegion', label: 'State/Region', type: 'text' },
            { name: 'postalCode', label: 'Postal Code', type: 'text' },
            { name: 'addressCountry', label: 'Country', type: 'text' },
            { name: 'openingHours', label: 'Opening Hours', type: 'text', placeholder: 'Mo-Fr 09:00-17:00' },
            { name: 'url', label: 'Website URL', type: 'url' }
        ]
    },
    Article: {
        icon: 'fa-newspaper',
        fields: [
            { name: 'headline', label: 'Headline', type: 'text', required: true },
            { name: 'image', label: 'Main Image URL', type: 'url', required: true },
            { name: 'authorName', label: 'Author Name', type: 'text', required: true },
            { name: 'publisherName', label: 'Publisher Name', type: 'text', required: true },
            { name: 'publisherLogo', label: 'Publisher Logo URL', type: 'url' },
            { name: 'datePublished', label: 'Date Published', type: 'date', required: true },
            { name: 'dateModified', label: 'Date Modified', type: 'date' },
            { name: 'description', label: 'Description', type: 'textarea' }
        ]
    },
    FAQPage: {
        icon: 'fa-question-circle',
        fields: [],
        listItems: {
            label: 'Questions & Answers',
            name: 'mainEntity',
            fields: [
                { name: 'question', label: 'Question', type: 'text', required: true },
                { name: 'answer', label: 'Answer', type: 'textarea', required: true }
            ]
        }
    },
    BreadcrumbList: {
        icon: 'fa-folder-tree',
        fields: [],
        listItems: {
            label: 'Breadcrumb Path',
            name: 'itemListElement',
            fields: [
                { name: 'name', label: 'Page Name', type: 'text', required: true },
                { name: 'item', label: 'Page URL', type: 'url', required: true }
            ]
        }
    },
    Product: {
        icon: 'fa-box',
        fields: [
            { name: 'name', label: 'Product Name', type: 'text', required: true },
            { name: 'image', label: 'Product Image URL', type: 'url', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: true },
            { name: 'brand', label: 'Brand', type: 'text' },
            { name: 'sku', label: 'SKU', type: 'text' },
            { name: 'gtin13', label: 'GTIN / EAN', type: 'text' },
            { name: 'priceCurrency', label: 'Currency', type: 'text', placeholder: 'USD' },
            { name: 'price', label: 'Price', type: 'text', placeholder: '29.99' },
            { name: 'availability', label: 'Availability', type: 'text', placeholder: 'InStock' },
            { name: 'ratingValue', label: 'Rating (1-5)', type: 'text' },
            { name: 'reviewCount', label: 'Review Count', type: 'text' }
        ]
    },
    Recipe: {
        icon: 'fa-utensils',
        fields: [
            { name: 'name', label: 'Recipe Name', type: 'text', required: true },
            { name: 'image', label: 'Image URL', type: 'url', required: true },
            { name: 'authorName', label: 'Author', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'prepTime', label: 'Prep Time (ISO 8601)', type: 'text', placeholder: 'PT20M' },
            { name: 'cookTime', label: 'Cook Time (ISO 8601)', type: 'text', placeholder: 'PT30M' },
            { name: 'totalTime', label: 'Total Time (ISO 8601)', type: 'text', placeholder: 'PT50M' },
            { name: 'recipeYield', label: 'Yield / Servings', type: 'text', placeholder: '4 servings' },
            { name: 'recipeCategory', label: 'Category', type: 'text', placeholder: 'Dinner' },
            { name: 'recipeCuisine', label: 'Cuisine', type: 'text', placeholder: 'Italian' },
            { name: 'recipeIngredient', label: 'Ingredients (One per line)', type: 'textarea', placeholder: '1 cup flour' },
            { name: 'recipeInstructions', label: 'Instructions (One step per line)', type: 'textarea', placeholder: 'Step 1: Preheat oven to 350°F' }
        ]
    },
    VideoObject: {
        icon: 'fa-video',
        fields: [
            { name: 'name', label: 'Video Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: true },
            { name: 'thumbnailUrl', label: 'Thumbnail URL', type: 'url', required: true },
            { name: 'uploadDate', label: 'Upload Date', type: 'date', required: true },
            { name: 'duration', label: 'Duration (ISO 8601)', type: 'text', placeholder: 'PT1M33S' },
            { name: 'contentUrl', label: 'Content URL', type: 'url' },
            { name: 'embedUrl', label: 'Embed URL', type: 'url' }
        ]
    },
    Event: {
        icon: 'fa-calendar-day',
        fields: [
            { name: 'name', label: 'Event Name', type: 'text', required: true },
            { name: 'startDate', label: 'Start Date', type: 'datetime-local', required: true },
            { name: 'endDate', label: 'End Date', type: 'datetime-local' },
            { name: 'locationName', label: 'Location Name', type: 'text', required: true },
            { name: 'streetAddress', label: 'Street Address', type: 'text' },
            { name: 'addressLocality', label: 'City', type: 'text' },
            { name: 'addressRegion', label: 'State/Region', type: 'text' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'image', label: 'Image URL', type: 'url' },
            { name: 'organizerName', label: 'Organizer Name', type: 'text' },
            { name: 'organizerUrl', label: 'Organizer URL', type: 'url' },
            { name: 'priceCurrency', label: 'Currency', type: 'text', placeholder: 'USD' },
            { name: 'price', label: 'Ticket Price', type: 'text', placeholder: '0' },
            { name: 'availability', label: 'Availability', type: 'text', placeholder: 'InStock' }
        ]
    },
    // ——— New Schema Types ———
    Review: {
        icon: 'fa-star',
        fields: [
            { name: 'itemReviewedName', label: 'Reviewed Item Name', type: 'text', required: true },
            { name: 'itemReviewedType', label: 'Reviewed Item Type', type: 'text', placeholder: 'Product, Movie, Book...', required: true },
            { name: 'reviewBody', label: 'Review Body', type: 'textarea', required: true },
            { name: 'ratingValue', label: 'Rating (1-5)', type: 'text', required: true },
            { name: 'bestRating', label: 'Best Rating', type: 'text', placeholder: '5' },
            { name: 'authorName', label: 'Author Name', type: 'text', required: true },
            { name: 'datePublished', label: 'Date Published', type: 'date' }
        ]
    },
    HowTo: {
        icon: 'fa-list-check',
        fields: [
            { name: 'name', label: 'How-To Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'image', label: 'Image URL', type: 'url' },
            { name: 'totalTime', label: 'Total Time (ISO 8601)', type: 'text', placeholder: 'PT30M' },
            { name: 'estimatedCost', label: 'Estimated Cost', type: 'text', placeholder: '$50' },
            { name: 'supply', label: 'Supplies (One per line)', type: 'textarea', placeholder: 'Paintbrush' },
            { name: 'tool', label: 'Tools (One per line)', type: 'textarea', placeholder: 'Screwdriver' }
        ],
        listItems: {
            label: 'Steps',
            name: 'step',
            fields: [
                { name: 'name', label: 'Step Title', type: 'text', required: true },
                { name: 'text', label: 'Step Description', type: 'textarea', required: true },
                { name: 'image', label: 'Step Image URL', type: 'url' }
            ]
        }
    },
    Course: {
        icon: 'fa-graduation-cap',
        fields: [
            { name: 'name', label: 'Course Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: true },
            { name: 'providerName', label: 'Provider Name', type: 'text', required: true },
            { name: 'providerUrl', label: 'Provider URL', type: 'url' },
            { name: 'image', label: 'Image URL', type: 'url' },
            { name: 'courseMode', label: 'Mode', type: 'text', placeholder: 'Online, Onsite, Blended' },
            { name: 'inLanguage', label: 'Language', type: 'text', placeholder: 'en' }
        ]
    },
    JobPosting: {
        icon: 'fa-briefcase',
        fields: [
            { name: 'title', label: 'Job Title', type: 'text', required: true },
            { name: 'description', label: 'Job Description', type: 'textarea', required: true },
            { name: 'datePosted', label: 'Date Posted', type: 'date', required: true },
            { name: 'validThrough', label: 'Valid Through', type: 'date' },
            { name: 'hiringOrganizationName', label: 'Company Name', type: 'text', required: true },
            { name: 'hiringOrganizationUrl', label: 'Company URL', type: 'url' },
            { name: 'employmentType', label: 'Employment Type', type: 'text', placeholder: 'FULL_TIME, PART_TIME' },
            { name: 'addressLocality', label: 'City', type: 'text' },
            { name: 'addressRegion', label: 'State/Region', type: 'text' },
            { name: 'addressCountry', label: 'Country', type: 'text' },
            { name: 'baseSalaryValue', label: 'Salary', type: 'text', placeholder: '60000' },
            { name: 'baseSalaryCurrency', label: 'Currency', type: 'text', placeholder: 'USD' },
            { name: 'baseSalaryUnit', label: 'Pay Period', type: 'text', placeholder: 'YEAR' }
        ]
    },
    Person: {
        icon: 'fa-user',
        fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'jobTitle', label: 'Job Title', type: 'text' },
            { name: 'worksForName', label: 'Works For (Organization)', type: 'text' },
            { name: 'url', label: 'Profile URL', type: 'url' },
            { name: 'image', label: 'Photo URL', type: 'url' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'telephone', label: 'Phone', type: 'tel' },
            { name: 'sameAs', label: 'Social Links (One per line)', type: 'textarea', placeholder: 'https://linkedin.com/in/...' }
        ]
    },
    WebSite: {
        icon: 'fa-globe',
        fields: [
            { name: 'name', label: 'Website Name', type: 'text', required: true },
            { name: 'url', label: 'Website URL', type: 'url', required: true },
            { name: 'potentialActionTarget', label: 'Search URL Template', type: 'url', placeholder: 'https://example.com/search?q={search_term_string}' }
        ]
    },
    SoftwareApplication: {
        icon: 'fa-laptop-code',
        fields: [
            { name: 'name', label: 'App Name', type: 'text', required: true },
            { name: 'operatingSystem', label: 'Operating System', type: 'text', placeholder: 'Windows, macOS, Android' },
            { name: 'applicationCategory', label: 'Category', type: 'text', placeholder: 'GameApplication, BusinessApplication' },
            { name: 'priceCurrency', label: 'Currency', type: 'text', placeholder: 'USD' },
            { name: 'price', label: 'Price', type: 'text', placeholder: '0' },
            { name: 'ratingValue', label: 'Rating (1-5)', type: 'text' },
            { name: 'ratingCount', label: 'Rating Count', type: 'text' },
            { name: 'downloadUrl', label: 'Download URL', type: 'url' },
            { name: 'screenshot', label: 'Screenshot URL', type: 'url' }
        ]
    },
    Movie: {
        icon: 'fa-film',
        fields: [
            { name: 'name', label: 'Movie Title', type: 'text', required: true },
            { name: 'image', label: 'Poster URL', type: 'url' },
            { name: 'dateCreated', label: 'Release Year', type: 'text', placeholder: '2024' },
            { name: 'director', label: 'Director', type: 'text' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'ratingValue', label: 'Rating', type: 'text' },
            { name: 'bestRating', label: 'Best Rating', type: 'text', placeholder: '10' },
            { name: 'genre', label: 'Genre', type: 'text', placeholder: 'Action, Comedy' },
            { name: 'duration', label: 'Duration (ISO 8601)', type: 'text', placeholder: 'PT2H30M' }
        ]
    },
    Book: {
        icon: 'fa-book',
        fields: [
            { name: 'name', label: 'Book Title', type: 'text', required: true },
            { name: 'authorName', label: 'Author', type: 'text', required: true },
            { name: 'isbn', label: 'ISBN', type: 'text' },
            { name: 'bookFormat', label: 'Format', type: 'text', placeholder: 'Hardcover, Paperback, EBook' },
            { name: 'numberOfPages', label: 'Number of Pages', type: 'text' },
            { name: 'publisher', label: 'Publisher', type: 'text' },
            { name: 'datePublished', label: 'Date Published', type: 'date' },
            { name: 'image', label: 'Cover Image URL', type: 'url' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'inLanguage', label: 'Language', type: 'text', placeholder: 'en' }
        ]
    },
    MedicalCondition: {
        icon: 'fa-heartbeat',
        fields: [
            { name: 'name', label: 'Condition Name', type: 'text', required: true },
            { name: 'alternateName', label: 'Alternate Name', type: 'text' },
            { name: 'description', label: 'Description', type: 'textarea', required: true },
            { name: 'possibleTreatment', label: 'Possible Treatments', type: 'textarea', placeholder: 'One per line' },
            { name: 'riskFactor', label: 'Risk Factors', type: 'textarea', placeholder: 'One per line' },
            { name: 'signOrSymptom', label: 'Signs / Symptoms', type: 'textarea', placeholder: 'One per line' }
        ]
    },
    Restaurant: {
        icon: 'fa-store',
        fields: [
            { name: 'name', label: 'Restaurant Name', type: 'text', required: true },
            { name: 'image', label: 'Image URL', type: 'url' },
            { name: 'telephone', label: 'Phone', type: 'tel', required: true },
            { name: 'servesCuisine', label: 'Cuisine', type: 'text', placeholder: 'Italian, Mexican' },
            { name: 'priceRange', label: 'Price Range', type: 'text', placeholder: '$$' },
            { name: 'streetAddress', label: 'Street Address', type: 'text', required: true },
            { name: 'addressLocality', label: 'City', type: 'text', required: true },
            { name: 'addressRegion', label: 'State/Region', type: 'text' },
            { name: 'postalCode', label: 'Postal Code', type: 'text' },
            { name: 'openingHours', label: 'Opening Hours', type: 'text', placeholder: 'Mo-Fr 09:00-22:00' },
            { name: 'url', label: 'Website URL', type: 'url' },
            { name: 'menu', label: 'Menu URL', type: 'url' }
        ]
    },
    Service: {
        icon: 'fa-concierge-bell',
        fields: [
            { name: 'name', label: 'Service Name', type: 'text', required: true },
            { name: 'serviceType', label: 'Service Type', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'providerName', label: 'Provider Name', type: 'text' },
            { name: 'providerUrl', label: 'Provider URL', type: 'url' },
            { name: 'areaServed', label: 'Area Served', type: 'text', placeholder: 'City, Country' },
            { name: 'priceCurrency', label: 'Currency', type: 'text', placeholder: 'USD' },
            { name: 'price', label: 'Price', type: 'text' }
        ]
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

    // Event Listeners for Custom Dropdown
    const dropdown = document.getElementById('schema-type-dropdown');
    const trigger = document.getElementById('schema-type-trigger');
    const menuItems = document.querySelectorAll('#schema-type-menu .sb-dropdown-item');

    if (dropdown && trigger) {
        const menu = document.getElementById('schema-type-menu');

        // Move menu to body to escape backdrop-filter containing block
        // (backdrop-filter on .builder-card makes position:fixed relative to it)
        document.body.appendChild(menu);

        const positionMenu = () => {
            const rect = trigger.getBoundingClientRect();
            const topPos = rect.bottom + 6;
            const bottomTabHeight = 50;
            const maxAvailableHeight = window.innerHeight - topPos - bottomTabHeight;

            menu.style.top = topPos + 'px';
            menu.style.left = rect.left + 'px';
            menu.style.width = rect.width + 'px';
            menu.style.maxHeight = Math.min(280, maxAvailableHeight) + 'px';
        };

        const openDropdown = () => {
            positionMenu();
            dropdown.classList.add('open');
            menu.style.display = 'flex';
        };
        const closeDropdown = () => {
            dropdown.classList.remove('open');
            menu.style.display = 'none';
        };

        trigger.onclick = (e) => {
            e.stopPropagation();
            if (dropdown.classList.contains('open')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        };

        menuItems.forEach(item => {
            item.onclick = (e) => {
                const value = e.currentTarget.dataset.value;
                const label = e.currentTarget.querySelector('span').textContent;
                const iconClass = e.currentTarget.querySelector('i').className;

                trigger.querySelector('.sb-selected-value').textContent = label;
                trigger.querySelector('.sb-type-icon').className = iconClass + ' sb-type-icon';

                menuItems.forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');

                typeSelect.value = value;
                renderForm(value);

                closeDropdown();
            };
        });

        // Close on click outside (menu is now in body, not in .sb-dropdown)
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sb-dropdown') && !e.target.closest('#schema-type-menu')) {
                closeDropdown();
            }
        });
    }

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

    // Validator View Event Listeners
    const btnValidate = document.getElementById('btn-validate-schema');
    const btnClearValidator = document.getElementById('btn-clear-validator');

    if (btnValidate) {
        btnValidate.onclick = runSchemaValidator;
    }
    if (btnClearValidator) {
        btnClearValidator.onclick = () => {
            document.getElementById('validator-input').value = '';
            const results = document.getElementById('validator-results');
            if (results) results.style.display = 'none';
        };
    }

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
    const validatorView = document.getElementById('schema-validator-view');

    // Hide all views
    builderView.classList.remove('active');
    historyView.classList.remove('active');
    if (validatorView) validatorView.classList.remove('active');

    if (view === 'history') {
        historyView.classList.add('active');
        loadSavedSchemas();
    } else if (view === 'validator') {
        if (validatorView) validatorView.classList.add('active');
    } else {
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
    if (field.required) {
        const star = document.createElement('span');
        star.className = 'required-star';
        star.textContent = ' *';
        label.appendChild(star);
    }
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
    if (field.required) input.dataset.required = 'true';
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
            if (type === 'HowTo') item['@type'] = 'HowToStep';

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
/**
 * Validate required fields before saving
 */
function validateRequiredFields() {
    const requiredInputs = document.querySelectorAll('#schema-form-container .md-input[data-required="true"]');
    const missing = [];

    requiredInputs.forEach(input => {
        // Remove previous error state
        input.classList.remove('input-error');
        if (!input.value.trim()) {
            missing.push(input);
            input.classList.add('input-error');
        }
    });

    if (missing.length > 0) {
        // Scroll to first missing field
        missing[0].focus();
        missing[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }
    return true;
}

async function saveCurrentSchema() {
    if (!currentTabOrigin) return;

    // Validate required fields
    if (!validateRequiredFields()) {
        const btn = document.getElementById('btn-save-schema');
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-exclamation-triangle';
        btn.title = 'Please fill required fields';
        setTimeout(() => {
            icon.className = 'fa-solid fa-floppy-disk';
            btn.title = 'Save to Site Memory';
        }, 2500);
        return;
    }

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

// =========================================================
// Schema Validator Engine
// =========================================================

/** Known Schema.org types with their required/recommended properties */
const SCHEMA_RULES = {
    Organization: { required: ['name', 'url'], recommended: ['logo', 'sameAs', 'description'] },
    LocalBusiness: { required: ['name', 'address', 'telephone'], recommended: ['image', 'priceRange', 'openingHours', 'url'] },
    Article: { required: ['headline', 'image', 'author', 'publisher', 'datePublished'], recommended: ['dateModified', 'description'] },
    FAQPage: { required: ['mainEntity'], recommended: [] },
    BreadcrumbList: { required: ['itemListElement'], recommended: [] },
    Product: { required: ['name', 'image', 'description'], recommended: ['brand', 'offers', 'aggregateRating', 'sku'] },
    Recipe: { required: ['name', 'image', 'author'], recommended: ['prepTime', 'cookTime', 'recipeIngredient', 'recipeInstructions', 'nutrition'] },
    VideoObject: { required: ['name', 'description', 'thumbnailUrl', 'uploadDate'], recommended: ['duration', 'contentUrl', 'embedUrl'] },
    Event: { required: ['name', 'startDate', 'location'], recommended: ['endDate', 'description', 'image', 'offers', 'organizer'] },
    Review: { required: ['itemReviewed', 'reviewRating', 'author'], recommended: ['reviewBody', 'datePublished'] },
    HowTo: { required: ['name', 'step'], recommended: ['description', 'image', 'totalTime', 'estimatedCost'] },
    Course: { required: ['name', 'description', 'provider'], recommended: ['image', 'courseMode', 'inLanguage'] },
    JobPosting: { required: ['title', 'description', 'datePosted', 'hiringOrganization'], recommended: ['validThrough', 'employmentType', 'baseSalary', 'jobLocation'] },
    Person: { required: ['name'], recommended: ['jobTitle', 'worksFor', 'url', 'image', 'sameAs'] },
    WebSite: { required: ['name', 'url'], recommended: ['potentialAction'] },
    SoftwareApplication: { required: ['name', 'offers'], recommended: ['operatingSystem', 'applicationCategory', 'aggregateRating'] },
    Movie: { required: ['name'], recommended: ['image', 'director', 'dateCreated', 'aggregateRating', 'genre'] },
    Book: { required: ['name', 'author'], recommended: ['isbn', 'publisher', 'datePublished', 'image'] },
    MedicalCondition: { required: ['name'], recommended: ['description', 'possibleTreatment', 'riskFactor'] },
    Restaurant: { required: ['name', 'address', 'telephone'], recommended: ['servesCuisine', 'priceRange', 'openingHours', 'menu'] },
    Service: { required: ['name', 'serviceType'], recommended: ['provider', 'areaServed', 'offers'] }
};

function runSchemaValidator() {
    const input = document.getElementById('validator-input');
    const resultsContainer = document.getElementById('validator-results');
    const summaryEl = document.getElementById('validator-summary');
    const detailsEl = document.getElementById('validator-details');

    if (!input || !resultsContainer) return;

    const rawInput = input.value.trim();
    if (!rawInput) {
        resultsContainer.style.display = 'block';
        summaryEl.innerHTML = renderBadge('error', 'No Input', 'Please paste a JSON-LD schema to validate.');
        detailsEl.innerHTML = '';
        return;
    }

    let schema;
    try {
        schema = JSON.parse(rawInput);
    } catch (e) {
        resultsContainer.style.display = 'block';
        summaryEl.innerHTML = renderBadge('error', 'Invalid JSON', `Could not parse JSON: ${e.message}`);
        detailsEl.innerHTML = '';
        return;
    }

    const errors = [];
    const warnings = [];
    const improvements = [];

    // 1. Check @context
    if (!schema['@context']) {
        errors.push('Missing <code>@context</code>. Should be <code>"https://schema.org"</code>.');
    } else if (typeof schema['@context'] === 'string' && !schema['@context'].includes('schema.org')) {
        warnings.push('<code>@context</code> does not reference schema.org. Expected <code>"https://schema.org"</code>.');
    }

    // 2. Check @type
    if (!schema['@type']) {
        errors.push('Missing <code>@type</code>. Every schema must declare a type.');
    }

    const type = schema['@type'];
    const rules = type ? SCHEMA_RULES[type] : null;

    // 3. Check required properties
    if (rules) {
        rules.required.forEach(prop => {
            if (!schema[prop] && !hasNestedProp(schema, prop)) {
                errors.push(`Missing required property: <code>${prop}</code> for type <code>${type}</code>.`);
            }
        });

        // 4. Check recommended properties
        rules.recommended.forEach(prop => {
            if (!schema[prop] && !hasNestedProp(schema, prop)) {
                improvements.push(`Add recommended property: <code>${prop}</code> for better SEO visibility.`);
            }
        });
    } else if (type) {
        warnings.push(`Type <code>${type}</code> is not in our validation ruleset. Only structural checks applied.`);
    }

    // 5. General structural checks
    if (schema['@type'] === 'FAQPage' && schema.mainEntity) {
        if (!Array.isArray(schema.mainEntity)) {
            errors.push('<code>mainEntity</code> should be an array of Question objects.');
        } else {
            schema.mainEntity.forEach((q, i) => {
                if (!q['@type'] || q['@type'] !== 'Question') {
                    warnings.push(`FAQ item ${i + 1}: Missing or incorrect <code>@type</code>. Should be <code>"Question"</code>.`);
                }
                if (!q.name) warnings.push(`FAQ item ${i + 1}: Missing <code>name</code> (the question text).`);
                if (!q.acceptedAnswer) {
                    warnings.push(`FAQ item ${i + 1}: Missing <code>acceptedAnswer</code>.`);
                } else if (!q.acceptedAnswer.text) {
                    warnings.push(`FAQ item ${i + 1}: <code>acceptedAnswer</code> is missing <code>text</code>.`);
                }
            });
        }
    }

    // Check for empty string values
    Object.entries(schema).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim() === '' && key !== '@context') {
            warnings.push(`Property <code>${key}</code> has an empty value. Consider removing it or providing a value.`);
        }
    });

    // Check URL format for common URL properties
    const urlProps = ['url', 'logo', 'image', 'thumbnailUrl', 'contentUrl', 'embedUrl', 'sameAs'];
    urlProps.forEach(prop => {
        const val = schema[prop];
        if (val) {
            const urls = Array.isArray(val) ? val : [val];
            urls.forEach(u => {
                if (typeof u === 'string' && u && !u.startsWith('http://') && !u.startsWith('https://')) {
                    warnings.push(`<code>${prop}</code> value "${u}" doesn't look like a valid URL.`);
                }
            });
        }
    });

    // 6. Render results
    resultsContainer.style.display = 'block';
    const totalIssues = errors.length + warnings.length;

    if (totalIssues === 0 && improvements.length === 0) {
        summaryEl.innerHTML = renderBadge('success', 'Schema Valid!', 'No errors, warnings, or improvements found. Your schema looks great!');
    } else if (errors.length > 0) {
        summaryEl.innerHTML = renderBadge('error', `${errors.length} Error${errors.length > 1 ? 's' : ''} Found`, `${warnings.length} warning(s), ${improvements.length} suggestion(s)`);
    } else if (warnings.length > 0) {
        summaryEl.innerHTML = renderBadge('warning', `${warnings.length} Warning${warnings.length > 1 ? 's' : ''}`, `${improvements.length} suggestion(s) for improvement`);
    } else {
        summaryEl.innerHTML = renderBadge('info', 'Looks Good', `${improvements.length} suggestion(s) to improve SEO`);
    }

    let detailsHtml = '';
    if (errors.length > 0) {
        detailsHtml += renderIssueGroup('Errors', 'fa-circle-xmark', 'error', errors);
    }
    if (warnings.length > 0) {
        detailsHtml += renderIssueGroup('Warnings', 'fa-triangle-exclamation', 'warning', warnings);
    }
    if (improvements.length > 0) {
        detailsHtml += renderIssueGroup('Improvements', 'fa-lightbulb', 'info', improvements);
    }
    detailsEl.innerHTML = detailsHtml;
}

/** Helper: check if a nested property exists (e.g., author.name -> author) */
function hasNestedProp(obj, prop) {
    for (const key of Object.keys(obj)) {
        if (key.toLowerCase().includes(prop.toLowerCase())) return true;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            if (hasNestedProp(obj[key], prop)) return true;
        }
    }
    return false;
}

function renderBadge(type, title, subtitle) {
    const icons = { error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', success: 'fa-circle-check', info: 'fa-circle-info' };
    return `
        <div class="validator-badge validator-badge--${type}">
            <i class="fa-solid ${icons[type]}"></i>
            <div>
                <strong>${title}</strong>
                <span>${subtitle}</span>
            </div>
        </div>
    `;
}

function renderIssueGroup(title, icon, type, items) {
    return `
        <div class="validator-issue-group validator-issue-group--${type}">
            <h4><i class="fa-solid ${icon}"></i> ${title}</h4>
            <ul>
                ${items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;
}
