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
                For: <strong>${escapeHtml(window.location.hostname)}</strong>
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
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">📖 Readability Score</h3>
                <button id="btn-highlight-all" class="action-btn primary" style="display: flex; align-items: center; gap: 6px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    Highlight All Issues
                </button>
            </div>

            <!-- Score Circle -->
            <div style="display: flex; align-items: center; gap: 32px; margin-bottom: 24px;">
                <div style="position: relative; width: 120px; height: 120px;">
                    <svg width="120" height="120" style="transform: rotate(-90deg);">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--md-sys-color-surface-variant)" stroke-width="8"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8"
                                stroke-dasharray="${(score / 100) * 339.29} 339.29" 
                                stroke-linecap="round"
                                style="transition: stroke-dasharray 1s ease-in-out;"/>
                    </svg>
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="font-size: 32px; font-weight: 700; color: ${scoreColor};">${score}</div>
                        <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant);">/ 100</div>
                    </div>
                </div>

                <div style="flex: 1;">
                    <div style="margin-bottom: 12px;">
                        <span style="font-size: 14px; color: var(--md-sys-color-on-surface-variant); font-weight: 500;">Flesch Reading Ease</span>
                        <div style="font-size: 24px; font-weight: 600; color: var(--md-sys-color-on-surface);">${fleschScore} <span style="font-size: 16px; font-weight: 400; color: var(--md-sys-color-on-surface-variant);">(${level})</span></div>
                    </div>
                    <div style="font-size: 13px; color: var(--md-sys-color-on-surface-variant);">
                        ${getFleschDescription(fleschScore)}
                    </div>
                </div>
            </div>

            <!-- Metrics Grid -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                ${createMetricCard('Words per Sentence', readability.averageWordsPerSentence, 'words', 15, 20)}
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
                <strong>${details.firstPerson || 0} instances ${getStatusIcon(details.firstPerson > 0)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Case Studies:</span>
                <strong>${details.caseStudies || 0} found ${getStatusIcon(details.caseStudies > 0)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Examples:</span>
                <strong>${details.examples || 0} found ${getStatusIcon(details.examples > 0)}</strong>
            </div>
        `;
    } else if (name === 'Expertise') {
        detailsHtml = `
            <div class="eeat-detail">
                <span>Author Bio:</span>
                <strong>${details.authorBio ? 'Found' : 'Not Found'} ${getStatusIcon(details.authorBio)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Credentials:</span>
                <strong>${details.credentials || 0} found ${getStatusIcon(details.credentials > 0)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Citations:</span>
                <strong>${details.citations || 0} references ${getStatusIcon(details.citations > 5)}</strong>
            </div>
        `;
    } else if (name === 'Authoritativeness') {
        detailsHtml = `
            <div class="eeat-detail">
                <span>Author Attribution:</span>
                <strong>${details.hasAuthor ? 'Yes' : 'No'} ${getStatusIcon(details.hasAuthor)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Published Date:</span>
                <strong>${details.hasPublishedDate ? 'Found' : 'Not Found'} ${getStatusIcon(details.hasPublishedDate)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Author Bio:</span>
                <strong>${details.hasAuthorBio ? 'Found' : 'Not Found'} ${getStatusIcon(details.hasAuthorBio)}</strong>
            </div>
        `;
    } else if (name === 'Trustworthiness') {
        detailsHtml = `
            <div class="eeat-detail">
                <span>HTTPS:</span>
                <strong>${details.https ? 'Enabled' : 'Disabled'} ${getStatusIcon(details.https)}</strong>
            </div>
            <div class="eeat-detail">
                <span>Contact Info:</span>
                <strong>${details.hasContact ? 'Found' : 'Not Found'} ${getStatusIcon(details.hasContact)}</strong>
            </div>
            <div class="eeat-detail">
                <span>External Sources:</span>
                <strong>${details.externalSources || 0} links ${getStatusIcon(details.externalSources > 3)}</strong>
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
                    <strong>Found:</strong> ${found.slice(0, 3).map(f => escapeHtml(f)).join(', ')}${found.length > 3 ? '...' : ''}
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

    // Check if there are any issues
    const hasIssues = passiveSentences.length > 0 || longSentences.length > 0 ||
        sentencesWithoutTransitions.length > 0 || longParagraphs.length > 0;

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
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #9775fa;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #9775fa; border-radius: 50%; margin-right: 8px;"></span>
                            Passive Voice (${passiveSentences.length} sentences)
                        </h4>
                        <button class="highlight-passive-btn action-btn secondary small">Highlight All</button>
                    </div>
                    <div style="display: grid; gap: 8px;">
                        ${passiveSentences.slice(0, 5).map(sentence => `
                            <div style="padding: 10px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #9775fa;">
                                "${escapeHtml(sentence)}"
                            </div>
                        `).join('')}
                        ${passiveSentences.length > 5 ? `
                            <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); font-style: italic;">
                                And ${passiveSentences.length - 5} more...
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${veryLongSentences.length > 0 ? `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #ff6b00;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #ff6b00; border-radius: 50%; margin-right: 8px;"></span>
                            Very Long Sentences (${veryLongSentences.length} sentences >25 words)
                        </h4>
                        <button class="highlight-long-sentences-btn action-btn secondary small">Highlight All</button>
                    </div>
                    <div style="display: grid; gap: 8px;">
                        ${veryLongSentences.slice(0, 5).map(sentence => `
                            <div style="padding: 10px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #ff6b00;">
                                "${escapeHtml(sentence)}"
                            </div>
                        `).join('')}
                        ${veryLongSentences.length > 5 ? `
                            <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); font-style: italic;">
                                And ${veryLongSentences.length - 5} more...
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${sentencesWithoutTransitions.length > 5 ? `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #339af0;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #339af0; border-radius: 50%; margin-right: 8px;"></span>
                            Missing Transitional Words (${sentencesWithoutTransitions.length} sentences)
                        </h4>
                        <button class="highlight-no-transitions-btn action-btn secondary small">Highlight All</button>
                    </div>
                    <div style="display: grid; gap: 8px;">
                        ${sentencesWithoutTransitions.slice(0, 5).map(sentence => `
                            <div style="padding: 10px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #339af0;">
                                "${escapeHtml(sentence)}"
                            </div>
                        `).join('')}
                        ${sentencesWithoutTransitions.length > 5 ? `
                            <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); font-style: italic;">
                                And ${sentencesWithoutTransitions.length - 5} more...
                            </div>
                        ` : ''}
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
                    <div style="display: grid; gap: 8px;">
                        ${longParagraphs.slice(0, 3).map(paragraph => `
                            <div style="padding: 10px 12px; background: var(--md-sys-color-surface-variant); border-radius: 6px; font-size: 13px; border-left: 3px solid #ffd43b;">
                                "${escapeHtml(paragraph.substring(0, 150))}..."
                            </div>
                        `).join('')}
                        ${longParagraphs.length > 3 ? `
                            <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); font-style: italic;">
                                And ${longParagraphs.length - 3} more...
                            </div>
                        ` : ''}
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
 * Create Metric Card
 */
function createMetricCard(label, value, unit, goodThreshold, warningThreshold, inverted = false) {
    const numValue = parseInt(value) || 0;
    let status = 'good';

    if (inverted) {
        // For metrics where lower is better (like passive voice)
        if (numValue > warningThreshold) status = 'poor';
        else if (numValue > goodThreshold) status = 'warning';
    } else {
        // For metrics where staying in range is better
        if (numValue > warningThreshold) status = 'poor';
        else if (numValue > goodThreshold) status = 'warning';
    }

    const statusColor = status === 'good' ? 'var(--md-sys-color-primary)' :
        status === 'warning' ? '#FF9800' : 'var(--md-sys-color-error)';

    return `
        <div style="padding: 16px; background: var(--md-sys-color-surface-variant); border-radius: 8px; border-left: 4px solid ${statusColor};">
            <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px; font-weight: 500;">
                ${label}
            </div>
            <div style="font-size: 24px; font-weight: 700; color: var(--md-sys-color-on-surface);">
                ${value}${unit ? ' ' + unit : ''}
            </div>
            <div style="font-size: 11px; color: ${statusColor}; margin-top: 4px; font-weight: 500;">
                ${status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Review' : '✗ Needs Work'}
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
`;
document.head.appendChild(style);
