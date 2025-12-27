/**
 * Notes Layout Module
 * Manages the main container and mode switching with category tabs
 */

export function renderLayout(container, initialState = { mode: 'todo', categories: [] }) {
    const hasCategoriesTab = initialState.categories && initialState.categories.length > 0;

    container.innerHTML = `
        <div class="notes-layout">
            <!-- Header / Toggle -->
            <div class="notes-header">
                <div class="mode-toggle">
                    <button class="toggle-btn ${initialState.mode === 'todo' ? 'active' : ''}" data-mode="todo">Tasks</button>
                    <button class="toggle-btn ${initialState.mode === 'scratchpad' ? 'active' : ''}" data-mode="scratchpad">Scratchbook</button>
                </div>
                <div class="md3-body-medium" style="font-size: 11px; opacity: 0.7;">${initialState.domain || 'Global'}</div>
            </div>

            <!-- Filters Section -->
            <div class="notes-filters">
                <!-- Category Tabs (Dynamic) -->
                <div class="category-tabs">
                    <div class="category-tab active" data-category="all">
                        <i class="fa-solid fa-list-ul"></i> All
                    </div>
                    ${(initialState.categories || []).map(cat => `
                        <div class="category-tab" data-category="${cat}">
                            <i class="fa-solid fa-folder"></i> ${cat}
                            <span class="delete-cat-btn" data-delete-cat="${cat}">
                                <i class="fa-solid fa-times"></i>
                            </span>
                        </div>
                    `).join('')}
                </div>

                <!-- Date Filter Bar -->
                <div class="date-filter-bar">
                    <div class="date-filter-btn active" data-date-filter="all">
                        <i class="fa-solid fa-layer-group"></i> All
                    </div>
                    <div class="date-filter-btn" data-date-filter="today">
                        <i class="fa-solid fa-calendar-day"></i> Today
                    </div>
                    <div class="date-filter-btn" data-date-filter="upcoming">
                        <i class="fa-solid fa-calendar-days"></i> Upcoming
                    </div>
                    <div class="custom-range-trigger">
                        <div class="date-filter-btn" data-date-filter="custom">
                            <i class="fa-solid fa-calendar-week"></i> Range
                        </div>
                        <div class="range-inputs-popover">
                            <input type="date" id="filter-start-date" class="small-input" title="Start Date">
                            <span>to</span>
                            <input type="date" id="filter-end-date" class="small-input" title="End Date">
                            <button id="btn-apply-range" class="icon-btn small" title="Apply"><i class="fa-solid fa-check"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div id="notes-content-area" class="notes-content">
                <!-- Dynamic Content Loads Here -->
            </div>

            <!-- Bottom Input Bar -->
            <div class="notes-input-bar">
                
                <!-- Controls Row -->
                <div class="input-controls">
                    <!-- Add Category -->
                    <div id="btn-add-category" class="add-category-btn" title="New Category">
                        <i class="fa-solid fa-plus" style="font-size: 12px;"></i>
                    </div>

                    <!-- Category Selector -->
                    <div id="category-selector" class="category-selector">
                        <i class="fa-solid fa-folder"></i>
                        <span id="label-category">No Category</span>
                        <!-- Dropdown -->
                        <div id="dropdown-category" class="dropdown-menu">
                            <div class="dropdown-item" data-value=""><i class="fa-solid fa-xmark"></i> No Category</div>
                            <!-- Categories will be added dynamically -->
                        </div>
                    </div>

                    <!-- Priority Selector -->
                    <div id="pill-priority" class="action-pill">
                        <div id="priority-indicator" class="priority-circle" data-prio="medium"></div> <span id="label-priority">Medium</span>
                        <!-- Dropdown -->
                        <div id="dropdown-priority" class="dropdown-menu">
                            <div class="dropdown-item" data-value="high"><div class="priority-circle" data-prio="high"></div> High</div>
                            <div class="dropdown-item" data-value="medium"><div class="priority-circle" data-prio="medium"></div> Medium</div>
                            <div class="dropdown-item" data-value="low"><div class="priority-circle" data-prio="low"></div> Low</div>
                            <!-- Custom Priorities Container -->
                            <div id="custom-priorities-list"></div>
                            <div class="dropdown-input-row">
                                <input type="color" id="input-priority-color" class="priority-color-input" value="#FF9500" title="Priority Color">
                                <input type="text" id="input-new-priority" class="small-input" placeholder="New Priority...">
                                <button id="btn-add-priority" class="icon-btn" title="Add" style="width: 24px; height: 24px;"><i class="fa-solid fa-plus" style="font-size: 10px;"></i></button>
                            </div>
                        </div>
                </div>

                <!-- Input Field Row -->
                <div class="input-container">
                    <!-- Color Picker -->
                    <div class="color-picker-container" style="position:relative;">
                        <button id="btn-color-picker" class="icon-btn" title="Color">
                            <div id="current-color-indicator" style="width: 16px; height: 16px; border-radius: 50%; background-color: var(--md-sys-color-primary);"></div>
                        </button>
                        <div id="palette-color" class="color-palette">
                            <div class="color-option" style="background: #D32F2F;" data-color="#D32F2F"></div>
                            <div class="color-option" style="background: #F57C00;" data-color="#F57C00"></div>
                            <div class="color-option" style="background: #FBC02D;" data-color="#FBC02D"></div>
                            <div class="color-option" style="background: #388E3C;" data-color="#388E3C"></div>
                            <div class="color-option" style="background: #1976D2;" data-color="#1976D2"></div>
                            <div class="color-option" style="background: #7B1FA2;" data-color="#7B1FA2"></div>
                            <!-- Custom Color -->
                            <div class="color-custom-container">
                                <input type="color" id="custom-color-input" class="color-custom-input" value="#1976D2">
                            </div>
                        </div>
                    </div>

                    <!-- Calendar Button -->
                    <div class="date-picker-container" style="position:relative;">
                        <button id="pill-date" class="icon-btn" title="Due Date">
                            <i class="fa-regular fa-calendar"></i>
                        </button>
                        <input type="date" id="input-date-native" class="date-picker-input" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer;">
                    </div>

                    <input type="text" id="chat-input-field" class="chat-input" placeholder="Add a new task..." autocomplete="off">
                    <button id="btn-input-send" class="send-btn"><i class="fa-solid fa-arrow-up"></i></button>
                </div>
            </div>

            </div>
        </div>

        <!-- Category Modal -->
        <div id="category-modal" class="category-modal-overlay">
            <div class="category-modal">
                <div class="category-modal-title">New Category</div>
                <input type="text" id="category-modal-input" class="category-modal-input" placeholder="Enter category name..." autocomplete="off">
                <div class="category-modal-buttons">
                    <button id="category-modal-cancel" class="category-modal-btn category-modal-btn-cancel">Cancel</button>
                    <button id="category-modal-create" class="category-modal-btn category-modal-btn-create">Create</button>
                </div>
            </div>
        </div>
    `;

    return {
        contentArea: container.querySelector('#notes-content-area'),
        inputField: container.querySelector('#chat-input-field'),
        sendBtn: container.querySelector('#btn-input-send'),
        toggleBtns: container.querySelectorAll('.toggle-btn'),
        categoryTabs: container.querySelectorAll('.category-tab'),

        // Controls
        priorityPill: container.querySelector('#pill-priority'),
        priorityLabel: container.querySelector('#label-priority'),
        priorityDropdown: container.querySelector('#dropdown-priority'),

        datePill: container.querySelector('#pill-date'),
        dateLabel: container.querySelector('#label-date'),
        dateInput: container.querySelector('#input-date-native'),

        colorBtn: container.querySelector('#btn-color-picker'),
        colorIndicator: container.querySelector('#current-color-indicator'),
        colorPalette: container.querySelector('#palette-color'),
        customColorInput: container.querySelector('#custom-color-input'),

        // Category elements
        addCategoryBtn: container.querySelector('#btn-add-category'),
        categorySelector: container.querySelector('#category-selector'),
        categoryLabel: container.querySelector('#label-category'),
        categoryDropdown: container.querySelector('#dropdown-category'),

        // Modal elements
        categoryModal: container.querySelector('#category-modal'),
        categoryModalInput: container.querySelector('#category-modal-input'),
        categoryModalCancel: container.querySelector('#category-modal-cancel'),
        categoryModalCreate: container.querySelector('#category-modal-create')
    };
}
