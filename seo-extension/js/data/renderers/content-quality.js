/**
 * Content Quality & E-E-A-T Tab Renderer
 * Renders comprehensive content analysis including readability and E-E-A-T signals
 */

import { copyToClipboard } from '../../utils/clipboard.js';

// Helper to send messages to content script
function sendTabMessage(action, data = {}) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action, ...data });
        }
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render Content Quality tab
 */
export function renderContentQualityTab(data) {
    const container = document.getElementById('content-quality-grouped-content');
    if (!container) return;

    const readability = data.readability || {};
    const eeat = data.eeat || {};

    let html = '';

    // Page Header
    html += `
        <div style="margin-bottom: 20px;">
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Content Quality & E-E-A-T Analysis</h2>
            <p style="margin: 0; color: var(--md-sys-color-on-surface-variant); font-size: 14px;">
                For: <strong>${escapeHtml(data.url ? new URL(data.url).hostname : 'Current Page')}</strong>
            </p>
        </div>
    `;

    // Readability Score Section
    html += createReadabilitySection(readability);

    // E-E-A-T Signals Section
    html += createEEATSection(eeat);

    // Issues Section
    html += createIssuesSection(readability);

    // Recommendations Section
    if (readability.recommendations && readability.recommendations.length > 0) {
        html += createRecommendationsSection(readability.recommendations);
    }

    // Heatmap Section [Modified]
    if (readability.heatmap) {
        html += createHeatmapSection(readability);
    }

    // Flow Section [NEW]
    if (readability.flow && readability.flow.length > 0) {
        html += createFlowSection(readability.flow);
    }

    // Inclusivity Section [NEW]
    if (readability.inclusivity && readability.inclusivity.issues.length > 0) {
        html += createInclusivitySection(readability.inclusivity);
    }

    container.innerHTML = html;

    // Attach event listeners
    attachEventListeners(readability, eeat);
}

/**
 * Create Readability Score Section
 */
function createReadabilitySection(readability) {
    const score = readability.score || 0;
    const fleschScore = readability.fleschScore || 0;
    const level = readability.level || 'N/A';

    const scoreColor = score >= 70 ? 'var(--md-sys-color-primary)' :
        score >= 50 ? '#FF9800' : 'var(--md-sys-color-error)';

    return `
        <div class="card" style="margin-bottom: 20px;">
            <!-- Header Row -->
            <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">📖 Readability Score</h3>
                
                <!-- Audience Selector -->
                <div class="audience-selector" style="display: flex; background: var(--md-sys-color-surface-variant); border-radius: 6px; padding: 2px;">
                    <button class="audience-btn active" data-audience="general" style="padding: 4px 12px; border: none; background: var(--md-sys-color-surface); border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--md-sys-color-on-surface);">General</button>
                    <button class="audience-btn" data-audience="professional" style="padding: 4px 12px; border: none; background: transparent; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--md-sys-color-on-surface-variant);">Pro</button>
                    <button class="audience-btn" data-audience="academic" style="padding: 4px 12px; border: none; background: transparent; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--md-sys-color-on-surface-variant);">Academic</button>
                </div>
            </div>

            <!-- Score Section -->
            <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 24px;">
                <!-- Circle Gauge -->
                <div style="position: relative; width: 100px; height: 100px; flex-shrink: 0;">
                    <svg width="100" height="100" style="transform: rotate(-90deg);">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--md-sys-color-surface-variant)" stroke-width="8"/>
                        <circle cx="50" cy="50" r="44" fill="none" stroke="${scoreColor}" stroke-width="8"
                                stroke-dasharray="${(score / 100) * 276.46} 276.46" 
                                stroke-linecap="round"
                                style="transition: stroke-dasharray 1s ease-in-out;"/>
                    </svg>
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="font-size: 28px; font-weight: 700; color: ${scoreColor};">${score}</div>
                        <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant);">/ 100</div>
                    </div>
                </div>

                <!-- Score Details -->
                <div style="flex: 1;">
                    <div style="margin-bottom: 8px;">
                        <span style="font-size: 13px; color: var(--md-sys-color-on-surface-variant); font-weight: 500;">Flesch Reading Ease</span>
                        <div style="font-size: 20px; font-weight: 600; color: var(--md-sys-color-on-surface); display: flex; flex-direction: column; align-items: start; gap: 2px;">
                            ${fleschScore} <span style="font-size: 13px; font-weight: 400; color: var(--md-sys-color-on-surface-variant);">(${level})</span>
                        </div>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <span style="font-size: 13px; color: var(--md-sys-color-on-surface-variant); font-weight: 500;">Grade Level</span>
                        <div style="font-size: 20px; font-weight: 600; color: var(--md-sys-color-on-surface);">${readability.fleschKincaidGrade || 'N/A'}</div>
                    </div>
                    <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); line-height: 1.4;">
                        ${getFleschDescription(fleschScore)}
                    </div>
                </div>
            </div>

            <!-- Action Footer -->
            <div style="border-top: 1px solid var(--md-sys-color-outline-variant); padding-top: 16px;">
                <button id="btn-highlight-all" class="action-btn primary" style="width: 100%; justify-content: center; height: 36px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    Highlight All Issues
                </button>
            </div>

            <!-- Metrics Grid -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                ${createMetricCard('Words per Sentence', readability.averageWordsPerSentence, 'words', 15, 20)}
                ${createMetricCard('Coleman-Liau Index', readability.colemanLiauIndex, null, 10, 14, true)}
                ${createMetricCard('LIX Score', readability.lixScore, null, 40, 50, true)}
                ${createMetricCard('Passive Voice', readability.passiveVoice?.percentage + '%', null, 10, 25, true)}
                ${createMetricCard('Transitional Words', readability.transitionalWords?.percentage + '%', null, 20, 30)}
                ${createMetricCard('Paragraph Length', readability.paragraphs?.averageLength, 'words', 100, 150)}
            </div>
        </div>
    `;
}

/**
 * Create E-E-A-T Section
 */
function createEEATSection(eeat) {
    const overallScore = eeat.score || 0;
    const grade = eeat.grade || 'N/A';

    const scoreColor = overallScore >= 70 ? 'var(--md-sys-color-primary)' :
        overallScore >= 50 ? '#FF9800' : 'var(--md-sys-color-error)';

    return `
        <div class="card" style="margin-bottom: 20px;">
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">🏆 E-E-A-T Signals</h3>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                    Experience, Expertise, Authoritativeness, and Trustworthiness
                </p>
            </div>

            <!-- Overall Score -->
            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 12px; margin-bottom: 20px;">
                <div style="font-size: 48px; font-weight: 700; color: ${scoreColor}; min-width: 80px;">${grade}</div>
                <div>
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">Overall E-E-A-T Score</div>
                    <div style="font-size: 24px; font-weight: 700; color: ${scoreColor};">${overallScore}/100</div>
                </div>
            </div>

            <!-- E-E-A-T Components -->
            <div style="display: grid; gap: 20px;">
                ${createEEATComponent('Experience', eeat.experience, '💡')}
                ${createEEATComponent('Expertise', eeat.expertise, '🎓')}
                ${createEEATComponent('Authoritativeness', eeat.authoritativeness, '👑')}
                ${createEEATComponent('Trustworthiness', eeat.trustworthiness, '🔒')}
            </div>
        </div>
    `;
}

/**
 * Create E-E-A-T Component Card
 */
function createEEATComponent(name, component, icon) {
    if (!component) return '';

    const score = component.score || 0;
    const details = component.details || {};
    const found = component.found || [];

    const scoreColor = score >= 70 ? 'var(--md-sys-color-primary)' :
        score >= 50 ? '#FF9800' : 'var(--md-sys-color-error)';

    let detailsHtml = '';

    // Generate details based on component type
    if (name === 'Experience') {
        detailsHtml = `
            <div class="eeat-detail">
                <span>First-Person Content:</span>
                <strong>${details.firstPersonMatches || 0} instances ${getStatusIcon(details.firstPersonMatches > 0)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Reviews/Comments:</span>
                <strong>${details.hasReviews ? 'Found' : 'Not Found'} ${getStatusIcon(details.hasReviews)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Multimedia:</span>
                <strong>${details.hasMedia ? 'Found' : 'Not Found'} ${getStatusIcon(details.hasMedia)}</strong>
            </div>
        `;
    } else if (name === 'Expertise') {
        detailsHtml = `
            <div class="eeat-detail">
                <span>Author Bio:</span>
                <strong>${details.hasBio ? 'Found' : 'Not Found'} ${getStatusIcon(details.hasBio)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Credentials:</span>
                <strong>${details.hasCredentials ? 'Found' : 'Not Found'} ${getStatusIcon(details.hasCredentials)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Social Profiles:</span>
                <strong>${details.hasSocial ? 'Found' : 'Not Found'} ${getStatusIcon(details.hasSocial)}</strong>
            </div>
        `;
    } else if (name === 'Authoritativeness') {
        detailsHtml = `
            <div class="eeat-detail">
                <span>Author Metadata:</span>
                <strong>${details.hasAuthor ? 'Yes' : (component.found.includes('Author metadata found') ? 'Yes' : 'No')} ${getStatusIcon(component.found.includes('Author metadata found'))}</strong>
            </div>
            <div class="eeat-detail">
                <span>Published Date:</span>
                <strong>${component.found.includes('Published date found') ? 'Found' : 'Not Found'} ${getStatusIcon(component.found.includes('Published date found'))}</strong>
            </div>
        `;
    } else if (name === 'Trustworthiness') {
        detailsHtml = `
            <div class="eeat-detail">
                <span>HTTPS:</span>
                <strong>${window.location.protocol === 'https:' ? 'Yes' : 'No'} ${getStatusIcon(window.location.protocol === 'https:')}</strong>
            </div>
            <div class="eeat-detail">
                <span>Policies:</span>
                <strong>${component.found.includes('Legal pages (Privacy/Terms) found') ? 'Found' : 'Not Found'} ${getStatusIcon(component.found.includes('Legal pages (Privacy/Terms) found'))}</strong>
            </div>
            <div class="eeat-detail">
                <span>Contact Info:</span>
                <strong>${component.found.includes('Contact information found') ? 'Found' : 'Not Found'} ${getStatusIcon(component.found.includes('Contact information found'))}</strong>
            </div>
             <div class="eeat-detail">
                <span>About Page:</span>
                <strong>${component.found.includes('"About Us" page found') ? 'Found' : 'Not Found'} ${getStatusIcon(component.found.includes('"About Us" page found'))}</strong>
            </div>
        `;
    }

    return `
        <div style="border-left: 4px solid ${scoreColor}; padding-left: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">${icon}</span>
                    <h4 style="margin: 0; font-size: 16px; font-weight: 600;">${name}</h4>
                </div>
                <div style="font-size: 18px; font-weight: 700; color: ${scoreColor};">${score}/100</div>
            </div>
            
            <div style="display: grid; gap: 8px; font-size: 13px;">
                ${detailsHtml}
            </div>

            ${found.length > 0 ? `
                <div style="margin-top: 12px; padding: 8px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 12px;">
                    <strong>Signals Detected:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                        ${found.map(f => `<span style="background: var(--md-sys-color-surface); padding: 2px 6px; border-radius: 4px;">${escapeHtml(f)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}  
        </div>
    `;
}

/**
 * Create Issues Section
 */
function createIssuesSection(readability) {
    if (!readability) return '';

    const passiveSentences = readability.passiveVoice?.sentences || [];
    const longSentences = readability.sentences?.longSentencesList || [];
    const veryLongSentences = readability.sentences?.veryLongSentencesList || [];
    const sentencesWithoutTransitions = readability.transitionalWords?.sentencesWithout || [];
    const longParagraphs = readability.paragraphs?.longParagraphsList || [];
    const complexWords = readability.simplificationSuggestions || [];

    // Check if there are any issues
    const hasIssues = passiveSentences.length > 0 || longSentences.length > 0 ||
        sentencesWithoutTransitions.length > 0 || longParagraphs.length > 0 || complexWords.length > 0;

    if (!hasIssues) {
        return `
            <div class="card" style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">✅ Content Issues</h3>
                <div style="padding: 24px; text-align: center; background: var(--md-sys-color-surface-variant); border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                    <div style="font-size: 16px; font-weight: 600; color: var(--md-sys-color-primary); margin-bottom: 8px;">
                        Excellent! No major content issues found.
                    </div>
                    <div style="font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                        Your content follows best practices for readability and clarity.
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="card" style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">⚠️ Content Issues</h3>

            ${passiveSentences.length > 0 ? `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #9775fa;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #9775fa; border-radius: 50%; margin-right: 8px;"></span>
                            Passive Voice (${passiveSentences.length} sentences)
                        </h4>
                        <button class="highlight-passive-btn action-btn secondary small">Highlight All</button>
                    </div>
                    <div style="display: grid; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px;">
                        ${passiveSentences.map(sentence => `
                            <div style="padding: 10px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #9775fa;">
                                "${escapeHtml(sentence)}"
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${veryLongSentences.length > 0 ? `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #ff6b00;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ff6b00; border-radius: 50%; margin-right: 8px;"></span>
                            Very Long Sentences (${veryLongSentences.length} sentences >25 words)
                        </h4>
                        <button class="highlight-long-sentences-btn action-btn secondary small">Highlight All</button>
                    </div>
                    <div style="display: grid; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px;">
                        ${veryLongSentences.map(sentence => `
                            <div style="padding: 10px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #ff6b00;">
                                "${escapeHtml(sentence)}"
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${sentencesWithoutTransitions.length > 5 ? `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #339af0;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #339af0; border-radius: 50%; margin-right: 8px;"></span>
                            Missing Transitional Words (${sentencesWithoutTransitions.length} sentences)
                        </h4>
                        <button class="highlight-no-transitions-btn action-btn secondary small">Highlight All</button>
                    </div>
                    <div style="display: grid; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px;">
                        ${sentencesWithoutTransitions.map(sentence => `
                            <div style="padding: 10px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #339af0;">
                                "${escapeHtml(sentence)}"
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${longParagraphs.length > 0 ? `
                <div style="margin-bottom: 0;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #ffd43b;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ffd43b; border-radius: 50%; margin-right: 8px;"></span>
                            Long Paragraphs (${longParagraphs.length} paragraphs >150 words)
                        </h4>
                        <button class="highlight-long-paragraphs-btn action-btn secondary small">Highlight All</button>
                    </div>
                    <div style="display: grid; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px;">
                        ${longParagraphs.map(paragraph => `
                            <div style="padding: 10px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #ffd43b;">
                                "${escapeHtml(paragraph.substring(0, 150))}..."
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${complexWords.length > 0 ? `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #868e96;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #868e96; border-radius: 50%; margin-right: 8px;"></span>
                            Complex Words (${complexWords.length} suggestions)
                        </h4>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px;">
                        ${complexWords.map(item => `
                            <div style="padding: 8px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #868e96;">
                                <span style="font-weight: 600; color: var(--md-sys-color-error);">${escapeHtml(item.word)}</span>
                                <span style="margin: 0 6px;">→</span>
                                <span style="color: var(--md-sys-color-primary);">${escapeHtml(item.suggestion)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Create Recommendations Section
 */
function createRecommendationsSection(recommendations) {
    if (!recommendations || recommendations.length === 0) return '';

    return `
        <div class="card">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">💡 Recommendations</h3>
            
            <div style="display: grid; gap: 12px;">
                ${recommendations.map(rec => `
                    <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid ${rec.type === 'error' ? 'var(--md-sys-color-error)' : '#FF9800'};">
                        <span style="font-size: 20px;">${rec.type === 'error' ? '🔴' : '🟡'}</span>
                        <div style="flex: 1; font-size: 14px; line-height: 1.5;">
                            ${escapeHtml(rec.message)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Create Heatmap Section (Supports Readability and Keywords)
 */
function createHeatmapSection(readability) {
    const rHeatmap = readability.heatmap || [];
    const kData = readability.keywordDensity || { heatmap: [], keywords: [] };
    const kHeatmap = kData.heatmap || [];
    
    // Serialized data for toggling
    const rDataJson = encodeURIComponent(JSON.stringify(rHeatmap));
    const kDataJson = encodeURIComponent(JSON.stringify(kHeatmap));
    const keywordsJson = encodeURIComponent(JSON.stringify(kData.keywords || []));

    return `
        <div class="card" style="margin-bottom: 20px;">
            <div style="display:flex; flex-wrap: wrap; justify-content:space-between; align-items:center; gap: 12px; margin-bottom: 16px;">
                <div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">🔥 Content Heatmap</h3>
                    <p id="heatmap-desc" style="margin: 4px 0 0 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                        Visual overview of reading difficulty by paragraph.
                    </p>
                </div>
                <!-- Heatmap Toggle -->
                <div class="audience-selector" style="display: flex; background: var(--md-sys-color-surface-variant); border-radius: 6px; padding: 2px;">
                    <button class="heatmap-toggle-btn active" data-type="readability" style="padding: 4px 8px; border: none; background: var(--md-sys-color-surface); border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; color: var(--md-sys-color-on-surface);">Readability</button>
                    <button class="heatmap-toggle-btn" data-type="keywords" style="padding: 4px 8px; border: none; background: transparent; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; color: var(--md-sys-color-on-surface-variant);">Keywords</button>
                </div>
            </div>
            
            <!-- Hidden Data Storage -->
            <input type="hidden" id="heatmap-data-readability" value="${rDataJson}">
            <input type="hidden" id="heatmap-data-keywords" value="${kDataJson}">
            <input type="hidden" id="heatmap-keywords-list" value="${keywordsJson}">

            <div style="position: relative;">
                <div id="heatmap-container" style="display: flex; flex-wrap: wrap; gap: 4px; padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 8px;">
                    ${renderHeatmapGrid(rHeatmap, 'readability')}
                </div>
                <!-- Custom Tooltip -->
                <div id="heatmap-tooltip" style="display: none; position: absolute; top: 0; left: 0; background: var(--md-sys-color-surface-container-highest, #E6E1E5); border: 1px solid var(--md-sys-color-outline-variant); color: var(--md-sys-color-on-surface); padding: 12px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); font-size: 12px; z-index: 100; width: 220px; pointer-events: none;"></div>
            </div>

            <div id="heatmap-legend" style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                ${renderHeatmapLegend('readability')}
            </div>
        </div>
    `;
}

function renderHeatmapGrid(data, type) {
    if (!data || data.length === 0) return '<div style="padding:10px; opacity:0.6; font-size:12px;">No data available</div>';

    return data.map((p, index) => {
        let color, opacity, label, valueLabel;

        if (type === 'readability') {
            color = p.status === 'good' ? 'var(--md-sys-color-primary)' : 
                    p.status === 'warning' ? '#FF9800' : 'var(--md-sys-color-error)';
            opacity = Math.min(1, Math.max(0.3, p.score / 100));
            label = `Paragraph ${index + 1}`;
            valueLabel = `Score: ${p.score} (${p.status})`;
        } else {
            // Keyword Density
            const density = p.density || 0;
            const intensity = Math.min(1, density / 3);
            color = 'var(--md-sys-color-primary)';
            opacity = Math.max(0.1, intensity);
            label = `Paragraph ${index + 1}`;
            valueLabel = `Density: ${density}% (${p.matches} matches)`;
        }
        
        return `
            <div class="heatmap-cell"
                 data-label="${label}"
                 data-value="${valueLabel}"
                 data-snippet="${escapeHtml(p.snippet)}"
                 data-text="${escapeHtml(p.snippet)}" 
                 style="width: 16px; height: 16px; background: ${color}; border-radius: 3px; cursor: pointer; opacity: ${opacity}; transition: transform 0.1s;">
            </div>
        `;
    }).join('');
}

function renderHeatmapLegend(type) {
    // ... existing legend code ...
    if (type === 'readability') {
        return `
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background: var(--md-sys-color-primary); border-radius: 50%;"></span> Easy</span>
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background: #FF9800; border-radius: 50%;"></span> Moderate</span>
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background: var(--md-sys-color-error); border-radius: 50%;"></span> Hard</span>
        `;
    } else {
        return `
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background: var(--md-sys-color-primary); opacity: 0.2; border-radius: 50%;"></span> Low Density</span>
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background: var(--md-sys-color-primary); opacity: 1.0; border-radius: 50%;"></span> High Density</span>
        `;
    }
}

/**
 * Create Flow Graph Section
 */
function createFlowSection(flowData) {
    if (!flowData || flowData.length < 2) return '';

    // Dimensions
    const height = 140;
    const width = 400; // viewBox width
    
    // 1. Score Line (0-100)
    const pointsScore = flowData.map(p => `${(p.x / 100) * width},${height - (p.y / 100 * height)}`).join(' ');
    
    // 2. Error Density Line (Normalized: 5 errors = 100%)
    // Scale: y = height - (errors * 20 / 100 * height) -> height - (errors * 0.2 * height) -- Wait 5 errors = 100% means factor 20.
    // Actually let's cap at height.
    const pointsErrors = flowData.map(p => {
        const normalizedErrors = Math.min(100, (p.errors || 0) * 20); 
        return `${(p.x / 100) * width},${height - (normalizedErrors / 100 * height)}`;
    }).join(' ');

    return `
        <div class="card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                 <div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">📈 Readability Flow</h3>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                        Metrics across content progression.
                    </p>
                </div>
                <!-- Legend -->
                <div style="display: flex; gap: 12px; font-size: 11px;">
                    <span style="display: flex; align-items: center; gap: 4px; color: var(--md-sys-color-on-surface);">
                        <span style="width: 12px; height: 2px; background: var(--md-sys-color-primary);"></span> Score
                    </span>
                    <span style="display: flex; align-items: center; gap: 4px; color: var(--md-sys-color-on-surface);">
                        <span style="width: 12px; height: 2px; background: var(--md-sys-color-error); border-bottom: 1px dashed var(--md-sys-color-error);"></span> Issues
                    </span>
                </div>
            </div>

            <div style="background: var(--md-sys-color-surface-variant); border-radius: 8px; padding: 20px 10px; height: 160px; position: relative;">
                <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
                    <!-- Grid -->
                    <line x1="0" y1="0" x2="${width}" y2="0" stroke="rgba(0,0,0,0.05)" stroke-width="1" />
                    <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="rgba(0,0,0,0.05)" stroke-width="1" />
                    <line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="rgba(0,0,0,0.05)" stroke-width="1" />

                    <!-- Area Fill (Score) -->
                    <path d="M0,${height} ${pointsScore} L${width},${height} Z" fill="var(--md-sys-color-primary)" fill-opacity="0.1" />

                    <!-- Score Line -->
                    <polyline points="${pointsScore}" fill="none" stroke="var(--md-sys-color-primary)" stroke-width="2" stroke-linejoin="round" />

                    <!-- Error Line (Dashed) -->
                    <polyline points="${pointsErrors}" fill="none" stroke="var(--md-sys-color-error)" stroke-width="1.5" stroke-dasharray="4,2" />
                    
                    <!-- Interactive Overlay Points (Hidden but hoverable) -->
                     ${flowData.map((p, i) => `
                        <circle cx="${(p.x / 100) * width}" cy="${height - (p.y / 100 * height)}" r="3" fill="transparent"
                                class="flow-point"
                                data-score="${p.y}"
                                data-errors="${p.errors || 0}"
                                data-time="${p.time || 0}"
                                data-snippet="${escapeHtml(p.snippet || '')}"
                                style="cursor: pointer; pointer-events: all;" />
                     `).join('')}
                </svg>
                
                <!-- Flow Tooltip -->
                 <div id="flow-tooltip" style="display: none; position: absolute; background: var(--md-sys-color-surface-container-highest, #E6E1E5); border: 1px solid var(--md-sys-color-outline-variant); color: var(--md-sys-color-on-surface); padding: 8px; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); font-size: 11px; z-index: 20; pointer-events: none; white-space: nowrap;">
                </div>
            </div>
        </div>
    `;
}

/**
 * Create Inclusivity Section
 */
function createInclusivitySection(inclusivity) {
    return `
        <div class="card" style="margin-bottom: 20px; border-left: 4px solid var(--md-sys-color-primary);">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🤝 Inclusive Language</h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                Found ${inclusivity.issues.length} potential improvements for more inclusive language.
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${inclusivity.issues.map(issue => `
                    <div style="padding: 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px;">
                        <div style="font-weight: 600; margin-bottom: 4px; color: var(--md-sys-color-on-surface);">
                            "${issue.term}" → "${issue.suggestion}"
                        </div>
                        <div style="font-size: 11px; color: var(--md-sys-color-on-surface-variant);">
                            Category: ${issue.category} • Found ${issue.count} time${issue.count > 1 ? 's' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Create Metric Card
 */
function createMetricCard(label, value, unit, goodThreshold, warningThreshold, inverted = false) {
    const displayValue = (value === undefined || value === null) ? 'N/A' : value;
    const numValue = parseInt(value) || 0;
    let status = 'good';

    if (displayValue === 'N/A') {
        status = 'neutral';
    } else if (inverted) {
        // For metrics where lower is better (like passive voice)
        if (numValue > warningThreshold) status = 'poor';
        else if (numValue > goodThreshold) status = 'warning';
    } else {
        // For metrics where staying in range is better
        if (numValue > warningThreshold) status = 'poor';
        else if (numValue > goodThreshold) status = 'warning';
    }

    const statusColor = status === 'good' ? 'var(--md-sys-color-primary)' :
        status === 'warning' ? '#FF9800' : 
        status === 'poor' ? 'var(--md-sys-color-error)' : '#757575';

    return `
        <div style="padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid ${statusColor};">
            <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px; font-weight: 500;">
                ${label}
            </div>
            <div style="font-size: 24px; font-weight: 700; color: var(--md-sys-color-on-surface);">
                ${displayValue}${unit && displayValue !== 'N/A' ? ' ' + unit : ''}
            </div>
            <div style="font-size: 11px; color: ${statusColor}; margin-top: 4px; font-weight: 500;">
                ${status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Review' : status === 'poor' ? '✗ Needs Work' : '• No Data'}
            </div>
        </div>
    `;
}

/**
 * Get status icon
 */
function getStatusIcon(isGood) {
    return isGood ? '<span style="color: var(--md-sys-color-primary);">✓</span>' :
        '<span style="color: var(--md-sys-color-error);">✗</span>';
}

/**
 * Get Flesch score description
 */
function getFleschDescription(score) {
    if (score >= 90) return 'Very easy to read. Easily understood by an average 11-year-old student.';
    if (score >= 80) return 'Easy to read. Conversational English for consumers.';
    if (score >= 70) return 'Fairly easy to read.';
    if (score >= 60) return 'Plain English. Easily understood by 13- to 15-year-old students.';
    if (score >= 50) return 'Fairly difficult to read.';
    if (score >= 30) return 'Difficult to read, best understood by college graduates.';
    return 'Very difficult to read. Best understood by university graduates.';
}

/**
 * Attach event listeners
 */
function attachEventListeners(readability, eeat) {
    // Audience Selector Listeners [NEW]
    const audienceBtns = document.querySelectorAll('.audience-btn');
    audienceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
             // Visual feedback
            audienceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Request new data with selected audience
            const audience = btn.dataset.audience;
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: 'getSEOData', 
                        audience: audience 
                    }, (response) => {
                        if (response) {
                            renderContentQualityTab(response);
                            setTimeout(() => {
                                const newBtns = document.querySelectorAll('.audience-btn');
                                newBtns.forEach(b => {
                                    if (b.dataset.audience === audience) b.classList.add('active');
                                    else b.classList.remove('active');
                                });
                            }, 0);
                        }
                    });
                }
            });
        });
    });

    // Heatmap Toggle Listeners [NEW]
    // Heatmap Toggle Listeners [NEW]
    const heatmapToggleBtns = document.querySelectorAll('.heatmap-toggle-btn');
    const heatmapContainer = document.getElementById('heatmap-container');
    const heatmapLegend = document.getElementById('heatmap-legend');
    const heatmapDesc = document.getElementById('heatmap-desc');
    
    // Hidden inputs
    const rDataInput = document.getElementById('heatmap-data-readability');
    const kDataInput = document.getElementById('heatmap-data-keywords');

    // Helper to attach heatmap interactions
    const attachHeatmapInteractions = () => {
        const cells = document.querySelectorAll('.heatmap-cell');
        const tooltip = document.getElementById('heatmap-tooltip');
        // Get the RELATIVE container (parent of heatmap-container)
        const relativeContainer = heatmapContainer?.parentElement;

        if (!cells.length || !tooltip || !relativeContainer) return;

        cells.forEach(cell => {
            cell.addEventListener('mouseenter', () => {
                const label = cell.dataset.label;
                const value = cell.dataset.value;
                const text = cell.dataset.text;
                
                tooltip.innerHTML = `
                    <div style="font-weight:600; margin-bottom:4px; color: var(--md-sys-color-on-surface);">${label}</div>
                    <div style="margin-bottom:4px; color: var(--md-sys-color-on-surface-variant);">${value}</div>
                    <div style="font-style:italic; opacity:0.8; font-size:11px; line-height: 1.4; color: var(--md-sys-color-secondary); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 4px;">"${text}"</div>
                    <div style="font-size:10px; opacity:0.7; color: var(--md-sys-color-primary);">Click to scroll</div>
                `;
                tooltip.style.display = 'block';
                
                // Position logic (relative to the container)
                // We use offsetLeft/Top which are relative to the nearest positioned ancestor (the wrapper)
                let left = cell.offsetLeft - (220 / 2) + 8; // Center horizontally
                let top = cell.offsetTop + 20; // Below the cell

                // Bounds check - keep inside container
                if (left < 0) left = 0;
                if (left + 220 > relativeContainer.offsetWidth) left = relativeContainer.offsetWidth - 220;

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            });

            cell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });

            cell.addEventListener('click', () => {
                const text = cell.dataset.text;
                sendTabMessage('scrollToText', { text: text });
            });
        });
    };

    // Helper to attach flow chart interactions
    const attachFlowInteractions = () => {
        const points = document.querySelectorAll('.flow-point');
        const tooltip = document.getElementById('flow-tooltip');
        // The tooltip is inside the flow chart container, which is relative positioned?
        // Let's find the container. The tooltip is inside the same parent as SVG?
        // In createFlowSection: <div style="... position: relative;"> <svg>...</svg> <div id="flow-tooltip"></div> </div>
        // So offsetLeft/Top on points (SVG elements) won't work directly because they are SVG elements.
        // We need getBoundingClientRect for them and the container.
        
        if (!points.length || !tooltip) return;
        
        const container = tooltip.parentElement; // The relative container

        points.forEach(point => {
            point.addEventListener('mouseenter', () => {
                const score = point.dataset.score;
                const errors = point.dataset.errors;
                const time = point.dataset.time;
                const snippet = point.dataset.snippet;

                tooltip.innerHTML = `
                    <div style="font-weight:600; margin-bottom:4px; color: var(--md-sys-color-on-surface);">Readability: ${score}</div>
                    <div style="color: var(--md-sys-color-error); margin-bottom:2px;">Issues: ${errors}</div>
                    <div style="color: var(--md-sys-color-on-surface-variant); margin-bottom:4px;">Time: ~${time}s</div>
                    <div style="font-style:italic; opacity:0.8; font-size:10px; max-width: 180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"${snippet}"</div>
                `;
                tooltip.style.display = 'block';

                // Positioning using Bounding Rects
                const pRect = point.getBoundingClientRect();
                const cRect = container.getBoundingClientRect();

                let left = pRect.left - cRect.left - (tooltip.offsetWidth / 2) + (pRect.width / 2);
                let top = pRect.top - cRect.top - tooltip.offsetHeight - 8;

                if (left < 0) left = 0;
                // Check right bound
                if (left + tooltip.offsetWidth > cRect.width) left = cRect.width - tooltip.offsetWidth;

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            });

            point.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    };

    // Initial attach
    attachHeatmapInteractions();
    attachFlowInteractions();

    heatmapToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!heatmapContainer) return;

            // Visual feedback
            heatmapToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.dataset.type;
            let data = [];
            
            if (type === 'readability') {
                try { data = JSON.parse(decodeURIComponent(rDataInput.value)); } catch(e) {}
                heatmapDesc.textContent = 'Visual overview of reading difficulty by paragraph.';
            } else {
                try { data = JSON.parse(decodeURIComponent(kDataInput.value)); } catch(e) {}
                heatmapDesc.textContent = 'Visual overview of keyword density by paragraph.';
            }

            heatmapContainer.innerHTML = renderHeatmapGrid(data, type);
            heatmapLegend.innerHTML = renderHeatmapLegend(type);
            
            // Re-attach listeners after render
            attachHeatmapInteractions();
        });
    });

    // Highlight all button
    const highlightAllBtn = document.getElementById('btn-highlight-all');
    if (highlightAllBtn) {
        highlightAllBtn.addEventListener('click', () => {
            const issues = {
                passiveVoice: readability.passiveVoice?.sentences || [],
                longSentences: readability.sentences?.veryLongSentencesList || [],
                longParagraphs: readability.paragraphs?.longParagraphsList || [],
                sentencesWithoutTransitions: readability.transitionalWords?.sentencesWithout || []
            };
            sendTabMessage('highlightAllContentIssues', { issues });
        });
    }

    // Highlight passive voice button
    const passiveBtn = document.querySelector('.highlight-passive-btn');
    if (passiveBtn) {
        passiveBtn.addEventListener('click', () => {
            sendTabMessage('highlightPassiveVoice', {
                sentences: readability.passiveVoice?.sentences || []
            });
        });
    }

    // Highlight long sentences button
    const longSentencesBtn = document.querySelector('.highlight-long-sentences-btn');
    if (longSentencesBtn) {
        longSentencesBtn.addEventListener('click', () => {
            sendTabMessage('highlightLongSentences', {
                sentences: readability.sentences?.veryLongSentencesList || []
            });
        });
    }

    // Highlight sentences without transitions button
    const noTransitionsBtn = document.querySelector('.highlight-no-transitions-btn');
    if (noTransitionsBtn) {
        noTransitionsBtn.addEventListener('click', () => {
            sendTabMessage('highlightSentencesWithoutTransitions', {
                sentences: readability.transitionalWords?.sentencesWithout || []
            });
        });
    }

    // Highlight long paragraphs button
    const longParagraphsBtn = document.querySelector('.highlight-long-paragraphs-btn');
    if (longParagraphsBtn) {
        longParagraphsBtn.addEventListener('click', () => {
            sendTabMessage('highlightLongParagraphs', {
                paragraphs: readability.paragraphs?.longParagraphsList || []
            });
        });
    }
}

// Add CSS for E-E-A-T details
const style = document.createElement('style');
style.textContent = `
    .eeat-detail {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 13px;
    }
    .eeat-detail span {
        color: var(--md-sys-color-on-surface-variant);
    }
    .eeat-detail strong {
        color: var(--md-sys-color-on-surface);
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    /* Audience Button Styles */
    .audience-btn.active, .heatmap-toggle-btn.active {
        background: var(--md-sys-color-primary) !important;
        color: var(--md-sys-color-on-primary) !important;
    }
`;
document.head.appendChild(style);
