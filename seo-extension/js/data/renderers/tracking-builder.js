import { copyToClipboard } from '../../utils/clipboard.js';
import { generateTrackingParams } from '../../services/gemini.js';

/**
 * Tracking Builder Renderer - ENHANCED UI
 * Google-inspired, full-width design with custom parameters and AI assistance
 */

// Platform dynamic values
const PLATFORM_VALUES = {
    googleAds: [
        { label: 'Campaign ID', value: '{campaignid}' },
        { label: 'Ad Group ID', value: '{adgroupid}' },
        { label: 'Keyword', value: '{keyword}' },
        { label: 'Match Type', value: '{matchtype}' },
        { label: 'Network', value: '{network}' },
        { label: 'Device', value: '{device}' },
        { label: 'Placement', value: '{placement}' }
    ],
    metaPixel: [
        { label: 'Campaign ID', value: '{{campaign.id}}' },
        { label: 'Campaign Name', value: '{{campaign.name}}' },
        { label: 'Ad Set ID', value: '{{adset.id}}' },
        { label: 'Ad Set Name', value: '{{adset.name}}' },
        { label: 'Ad ID', value: '{{ad.id}}' },
        { label: 'Ad Name', value: '{{ad.name}}' },
        { label: 'Placement', value: '{{placement}}' }
    ],
    linkedin: [
        { label: 'Campaign ID', value: '{{campaignId}}' },
        { label: 'Creative ID', value: '{{creativeId}}' }
    ],
    tiktok: [
        { label: 'Campaign ID', value: '__CAMPAIGN_ID__' },
        { label: 'Ad ID', value: '__AID__' },
        { label: 'Placement', value: '__PLACEMENT__' }
    ],
    microsoft: [
        { label: 'Campaign ID', value: '{CampaignId}' },
        { label: 'Ad Group ID', value: '{AdGroupId}' },
        { label: 'Keyword', value: '{Keyword}' }
    ],
    twitter: [
        { label: 'Campaign ID', value: '{{campaign_id}}' },
        { label: 'Creative ID', value: '{{creative_id}}' }
    ],
    pinterest: [
        { label: 'Campaign ID', value: '{campaign_id}' },
        { label: 'Ad Group ID', value: '{ad_group_id}' }
    ]
};

// Platforms for Dropdown
const PLATFORM_OPTIONS = [
    { value: 'googleAds', label: 'Google Ads' },
    { value: 'metaPixel', label: 'Meta/Facebook' },
    { value: 'linkedin', label: 'LinkedIn Ads' },
    { value: 'tiktok', label: 'TikTok Ads' },
    { value: 'microsoft', label: 'Microsoft Ads' },
    { value: 'twitter', label: 'Twitter/X Ads' },
    { value: 'pinterest', label: 'Pinterest Ads' }
];

export function renderTrackingBuilder(data) {
    const container = document.getElementById('tracking-builder-content');
    if (!container) return;

    const currentUrl = data?.url || window.location.href;

    // No .card wrapper, full width design
    container.innerHTML = `
        <div class="tracking-builder-container">
            <div class="builder-header">
                <h3 style="margin: 0; font-size: 16px; font-weight: 500; color: var(--md-sys-color-on-surface);">
                    Campaign URL Builder
                </h3>
                <p style="margin: 4px 0 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                    Generate tracking URLs for Google Analytics, Meta Ads, and more.
                </p>
            </div>

            <!-- Mode Toggle (Top) -->
            <div class="mode-toggle-wrapper">
                <div class="mode-toggle-container">
                    <button id="mode-manual" class="mode-btn active">Manual</button>
                    <button id="mode-ai" class="mode-btn">
                        <span class="ai-sparkle">✨</span> AI Assisted
                    </button>
                </div>
            </div>

            <!-- Global URL Section -->
            <div class="input-section">
                <label class="section-label">Website URL</label>
                <div class="url-source-toggle">
                    <label class="radio-label">
                        <input type="radio" name="url-source" value="current" checked>
                        <span>Current Page</span>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="url-source" value="custom">
                        <span>Custom URL</span>
                    </label>
                </div>
                <input type="text" id="base-url" class="material-input" value="${currentUrl}" disabled>
            </div>

            <!-- AI Section (Hidden by default) -->
            <div id="ai-builder-section" style="display: none;">
                <div class="ai-input-flat">
                    <div class="input-section" style="border-bottom: none; padding-bottom: 0;">
                        <label class="section-label">AI Generator</label>
                        <p style="font-size: 13px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 16px;">
                            Describe your campaign, and Gemini will generate the best tracking parameters for you.
                        </p>
                        
                        <div class="input-group" style="margin-bottom: 16px;">
                            <label>Campaign Goal</label>
                            <input type="text" id="ai-goal" class="material-input" placeholder="e.g. Summer Sale 2024, Newsletter Signup">
                        </div>
                        
                        <div class="input-group" style="margin-bottom: 16px;">
                            <label>Platform</label>
                            <div id="ai-platform-dropdown"></div>
                            <!-- Hidden input to store value -->
                            <input type="hidden" id="ai-platform">
                        </div>

                        <div class="input-group" style="margin-bottom: 16px;">
                            <label>Target Audience (Optional)</label>
                            <input type="text" id="ai-audience" class="material-input" placeholder="e.g. Retargeting, New Users">
                        </div>

                        <div class="input-group" style="margin-bottom: 16px;">
                            <label>Campaign Purpose (Optional)</label>
                            <input type="text" id="ai-purpose" class="material-input" placeholder="e.g. Brand Awareness, Lead Gen">
                        </div>

                        <div class="input-group" style="margin-bottom: 16px;">
                            <label>Ad Placement (Optional)</label>
                            <input type="text" id="ai-placement" class="material-input" placeholder="e.g. News Feed, Sidebar">
                        </div>

                        <div class="input-group" style="margin-bottom: 16px;">
                            <label>Additional Details (Optional)</label>
                            <textarea id="ai-details" class="material-input" rows="2" placeholder="Any extra context..."></textarea>
                        </div>

                        <div id="ai-error-msg" style="display: none; color: var(--md-sys-color-error); font-size: 13px; margin-top: 12px;"></div>

                        <button id="btn-generate-params" class="action-btn primary" style="width: 100%; margin-top: 20px; justify-content: center;">
                            <span class="ai-sparkle">✨</span> Generate Parameters
                        </button>
                    </div>
                </div>
            </div>

            <!-- Manual Section -->
            <div id="manual-builder-section">
                <!-- Campaign Details -->
                <div class="input-section">
                    <label class="section-label">Campaign Details</label>
                    <div class="grid-row">
                        <div class="input-group">
                            <label>Campaign Source *</label>
                            <input type="text" id="utm-source" class="material-input" placeholder="google, newsletter">
                        </div>
                        <div class="input-group">
                            <label>Campaign Medium *</label>
                            <input type="text" id="utm-medium" class="material-input" placeholder="cpc, email">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Campaign Name *</label>
                        <input type="text" id="utm-campaign" class="material-input" placeholder="spring_sale">
                    </div>
                </div>

                <!-- Optional Params -->
                <details class="optional-section">
                    <summary>Optional Parameters (Term, Content)</summary>
                    <div class="grid-row" style="margin-top: 12px;">
                        <div class="input-group">
                            <label>Campaign Term</label>
                            <input type="text" id="utm-term" class="material-input" placeholder="running+shoes">
                        </div>
                        <div class="input-group">
                            <label>Campaign Content</label>
                            <input type="text" id="utm-content" class="material-input" placeholder="banner_ad">
                        </div>
                    </div>
                </details>

                <!-- Custom Parameters -->
                <div class="input-section" style="margin-top: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <label class="section-label" style="margin-bottom: 0;">Custom Parameters</label>
                        <button id="btn-add-param" class="text-btn small">
                            + Add Parameter
                        </button>
                    </div>
                    <div id="custom-params-container">
                        <!-- Dynamic rows will go here -->
                    </div>
                </div>

                <!-- Dynamic Values Helper -->
                <details class="optional-section" style="margin-top: 16px;">
                    <summary style="color: var(--md-sys-color-primary);">Insert Dynamic Values</summary>
                    <div class="dynamic-helper-box">
                        <div class="grid-row">
                            <div class="input-group">
                                <label>Platform</label>
                                <div id="platform-select-container"></div>
                                <input type="hidden" id="platform-select">
                            </div>
                            <div class="input-group">
                                <label>Value</label>
                                <div id="dynamic-value-container"></div>
                                <input type="hidden" id="dynamic-value">
                            </div>
                        </div>
                        <div class="grid-row" style="align-items: flex-end;">
                             <div class="input-group" style="flex: 1;">
                                <label>Insert into</label>
                                <div id="target-field-container"></div>
                                <input type="hidden" id="target-field" value="utm-source">
                            </div>
                            <button id="insert-dynamic-value" class="action-btn secondary" style="margin-bottom: 2px;">Insert</button>
                        </div>
                    </div>
                </details>

                <!-- Generated URL -->
                <div class="generated-result-card">
                    <label>Generated URL</label>
                    <div class="url-display-area">
                        <div id="generated-url" class="url-text">Enter parameters to generate URL</div>
                        <button id="copy-tracking-url" class="copy-btn" disabled>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    initTrackingBuilder(currentUrl);
}

function renderCustomDropdown(options, containerId, inputId, placeholder = 'Select...') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = `<span>${placeholder}</span><div class="arrow"></div>`;

    const optionsList = document.createElement('div');
    optionsList.className = 'custom-options';

    options.forEach(opt => {
        const option = document.createElement('span');
        option.className = 'custom-option';
        option.dataset.value = opt.value;
        option.textContent = opt.label;
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            // Update UI
            trigger.querySelector('span').textContent = opt.label;
            wrapper.classList.remove('open');
            wrapper.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');

            // Update Hidden Input
            const input = document.getElementById(inputId);
            if (input) {
                input.value = opt.value;
                input.dispatchEvent(new Event('change')); // Trigger change event
            }
        });
        optionsList.appendChild(option);
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsList);
    container.innerHTML = '';
    container.appendChild(wrapper);

    // Toggle Open/Close
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close all other dropdowns
        document.querySelectorAll('.custom-select-wrapper').forEach(w => {
            if (w !== wrapper) w.classList.remove('open');
        });
        wrapper.classList.toggle('open');
    });

    // Close on click outside
    document.addEventListener('click', () => {
        wrapper.classList.remove('open');
    });

    return {
        updateOptions: (newOptions) => {
            optionsList.innerHTML = '';
            newOptions.forEach(opt => {
                const option = document.createElement('span');
                option.className = 'custom-option';
                option.dataset.value = opt.value;
                option.textContent = opt.label;
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    trigger.querySelector('span').textContent = opt.label;
                    wrapper.classList.remove('open');
                    wrapper.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');

                    const input = document.getElementById(inputId);
                    if (input) {
                        input.value = opt.value;
                        input.dispatchEvent(new Event('change'));
                    }
                });
                optionsList.appendChild(option);
            });
        },
        reset: () => {
            trigger.querySelector('span').textContent = placeholder;
            const input = document.getElementById(inputId);
            if (input) input.value = '';
            wrapper.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        },
        disable: (disabled) => {
            if (disabled) {
                wrapper.classList.add('disabled');
                wrapper.style.pointerEvents = 'none';
            } else {
                wrapper.classList.remove('disabled');
                wrapper.style.pointerEvents = 'auto';
            }
        }
    };
}

function initTrackingBuilder(currentUrl) {
    // 0. Mode Switching
    const btnManual = document.getElementById('mode-manual');
    const btnAI = document.getElementById('mode-ai');
    const manualSection = document.getElementById('manual-builder-section');
    const aiSection = document.getElementById('ai-builder-section');

    function switchMode(mode) {
        if (mode === 'manual') {
            btnManual.classList.add('active');
            btnAI.classList.remove('active');
            manualSection.style.display = 'block';
            aiSection.style.display = 'none';
        } else {
            btnManual.classList.remove('active');
            btnAI.classList.add('active');
            manualSection.style.display = 'none';
            aiSection.style.display = 'block';
        }
    }

    btnManual.addEventListener('click', () => switchMode('manual'));
    btnAI.addEventListener('click', () => switchMode('ai'));


    // 1. URL Source Toggle
    document.querySelectorAll('input[name="url-source"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const urlInput = document.getElementById('base-url');
            if (e.target.value === 'current') {
                urlInput.value = currentUrl;
                urlInput.disabled = true;
            } else {
                urlInput.disabled = false;
                urlInput.select();
            }
            generateUrl();
        });
    });

    // 2. Auto-generate on standard input change
    const inputs = ['base-url', 'utm-source', 'utm-medium', 'utm-campaign', 'utm-term', 'utm-content'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', generateUrl);
    });

    // 3. Custom Parameters Logic
    const customContainer = document.getElementById('custom-params-container');
    const addParamBtn = document.getElementById('btn-add-param');

    addParamBtn.addEventListener('click', () => addCustomParamRow());

    function addCustomParamRow(key = '', value = '') {
        const rowId = 'param-' + Date.now();
        const div = document.createElement('div');
        div.className = 'custom-param-row';
        div.id = rowId;
        div.innerHTML = `
            <input type="text" class="material-input param-key" placeholder="Key (e.g. ref)" value="${key}">
            <input type="text" class="material-input param-value" placeholder="Value" value="${value}">
            <button class="remove-btn" title="Remove">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
            </button>
        `;

        // Add listeners
        div.querySelector('.remove-btn').addEventListener('click', () => {
            div.remove();
            generateUrl();
        });
        div.querySelectorAll('input').forEach(inp => inp.addEventListener('input', generateUrl));

        customContainer.appendChild(div);
    }

    // 4. Dynamic Values Logic (Custom Dropdowns)

    // Initialize Platform Dropdown (Manual)
    renderCustomDropdown(PLATFORM_OPTIONS, 'platform-select-container', 'platform-select', 'Select platform...');

    // Initialize Value Dropdown (Manual) - Initially empty/disabled
    const valueDropdown = renderCustomDropdown([], 'dynamic-value-container', 'dynamic-value', 'Select value...');
    valueDropdown.disable(true);

    // Initialize Target Field Dropdown (Manual)
    const targetOptions = [
        { value: 'utm-source', label: 'Source' },
        { value: 'utm-medium', label: 'Medium' },
        { value: 'utm-campaign', label: 'Campaign' },
        { value: 'utm-term', label: 'Term' },
        { value: 'utm-content', label: 'Content' },
        { value: 'custom', label: 'Custom Parameter (New)' }
    ];
    // Pre-select 'Source'
    const targetDropdown = renderCustomDropdown(targetOptions, 'target-field-container', 'target-field', 'Source');
    // Manually set initial text for target dropdown since we have a default value
    document.querySelector('#target-field-container .custom-select-trigger span').textContent = 'Source';


    // Listen for Platform Change
    const platformInput = document.getElementById('platform-select');
    platformInput.addEventListener('change', () => {
        const platform = platformInput.value;
        if (!platform || !PLATFORM_VALUES[platform]) {
            valueDropdown.reset();
            valueDropdown.disable(true);
            return;
        }

        const values = PLATFORM_VALUES[platform];
        // Convert to dropdown format
        const options = values.map(v => ({ value: v.value, label: v.label }));
        valueDropdown.updateOptions(options);
        valueDropdown.reset(); // Clear previous selection
        valueDropdown.disable(false);
    });

    const insertBtn = document.getElementById('insert-dynamic-value');
    insertBtn.addEventListener('click', () => {
        const value = document.getElementById('dynamic-value').value;
        const target = document.getElementById('target-field').value;

        if (!value) return;

        if (target === 'custom') {
            // Add new custom row with this value
            addCustomParamRow('', value);
        } else {
            // Append to existing standard field
            const input = document.getElementById(target);
            if (input) {
                const currentVal = input.value;
                input.value = currentVal ? `${currentVal}_${value}` : value;
                generateUrl();
            }
        }
    });

    // 5. AI Generation Logic

    // Initialize AI Platform Dropdown
    renderCustomDropdown(PLATFORM_OPTIONS, 'ai-platform-dropdown', 'ai-platform', 'Select platform...');

    const btnGenerate = document.getElementById('btn-generate-params');
    const aiErrorMsg = document.getElementById('ai-error-msg');

    btnGenerate.addEventListener('click', async () => {
        const goal = document.getElementById('ai-goal').value.trim();
        const platform = document.getElementById('ai-platform').value.trim();
        const audience = document.getElementById('ai-audience').value.trim();
        const purpose = document.getElementById('ai-purpose').value.trim();
        const placement = document.getElementById('ai-placement').value.trim();
        const details = document.getElementById('ai-details').value.trim();

        if (!goal || !platform) {
            aiErrorMsg.textContent = 'Please enter at least a Goal and Platform.';
            aiErrorMsg.style.display = 'block';
            return;
        }

        aiErrorMsg.style.display = 'none';
        btnGenerate.disabled = true;
        btnGenerate.innerHTML = '<span class="spinner"></span> Generating...';

        try {
            const params = await generateTrackingParams({
                goal,
                platform, // Now passing the value (e.g., 'googleAds') which is fine, or we can map to label if needed
                audience,
                purpose,
                placement,
                details,
                url: currentUrl
            });

            // Populate fields
            if (params.utm_source) document.getElementById('utm-source').value = params.utm_source;
            if (params.utm_medium) document.getElementById('utm-medium').value = params.utm_medium;
            if (params.utm_campaign) document.getElementById('utm-campaign').value = params.utm_campaign;
            if (params.utm_term) document.getElementById('utm-term').value = params.utm_term;
            if (params.utm_content) document.getElementById('utm-content').value = params.utm_content;

            // Generate URL
            generateUrl();

            // Switch back to manual mode to show results
            switchMode('manual');

        } catch (error) {
            console.error('AI Generation Error:', error);
            aiErrorMsg.textContent = error.message || 'Failed to generate parameters. Please check your API key.';
            aiErrorMsg.style.display = 'block';
        } finally {
            btnGenerate.disabled = false;
            btnGenerate.innerHTML = '<span class="ai-sparkle">✨</span> Generate Parameters';
        }
    });

    // 6. Copy Button
    document.getElementById('copy-tracking-url').addEventListener('click', (e) => {
        const url = document.getElementById('generated-url').textContent;
        copyToClipboard(url, e.currentTarget);
    });
}

function generateUrl() {
    const baseUrlInput = document.getElementById('base-url');
    const generatedUrlEl = document.getElementById('generated-url');
    const copyBtn = document.getElementById('copy-tracking-url');

    if (!baseUrlInput) return;

    const baseUrl = baseUrlInput.value.trim();

    if (!baseUrl) {
        generatedUrlEl.textContent = 'Enter a base URL';
        copyBtn.disabled = true;
        return;
    }

    try {
        const url = new URL(baseUrl);
        const params = new URLSearchParams(url.search);

        // Standard UTMs
        ['source', 'medium', 'campaign', 'term', 'content'].forEach(param => {
            const el = document.getElementById(`utm-${param}`);
            if (el && el.value.trim()) {
                params.set(`utm_${param}`, el.value.trim());
            }
        });

        // Custom Parameters
        document.querySelectorAll('.custom-param-row').forEach(row => {
            const key = row.querySelector('.param-key').value.trim();
            const value = row.querySelector('.param-value').value.trim();
            if (key && value) {
                params.set(key, value);
            }
        });

        url.search = params.toString();
        generatedUrlEl.textContent = url.toString();
        copyBtn.disabled = false;

    } catch (e) {
        generatedUrlEl.textContent = 'Invalid URL format';
        copyBtn.disabled = true;
    }
}
