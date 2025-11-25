# Accessibility Audit Feature - Integration Guide

## Completed Components

✅ **Extractor Module**: `js/content/extractors/accessibility.js`
- 6 WCAG 2.1 checks (images, forms, headings, landmarks, links, language)
- Scores and detailed issue reporting with W3C references
- Culprits identification

✅ **Highlighting Module**: `js/content/highlighting/accessibility.js`
- Visual highlighting of issues on pages
- Color-coded by severity (critical/warning/notice)

✅ **Renderer Module**: `js/data/renderers/accessibility.js`
- Score display
- Issues summary (critical/warning/notice counts)
- Top culprits list
- Detailed checks breakdown
- Full issue list with suggestions and W3C links
- Highlight toggle functionality

✅ **UI Tab**: Added to `js/ui/layout.js`
- "Accessibility" tab between Links and Schema tabs
- Complete UI structure with all needed containers

✅ **Message Handlers**: Updated `js/content/messaging/handlers.js`
- Support for highlighting actions

✅ **Content Script**: Updated `js/content.js`
- Integrated accessibility extractor into data collection

## Manual Integration Steps

To complete the integration, add these 2 lines to `js/data/renderer.js`:

### 1. Add import (after line 10):
```javascript
import { renderAccessibilityTab } from './renderers/accessibility.js';
```

### 2. Add renderer call in `renderData()` function (after line 41, after Schema Tab):
```javascript
// --- Accessibility Tab ---
if (data.accessibility) {
    renderAccessibilityTab(data.accessibility);
}
```

## Testing

1. Reload the extension
2. Open the popup/sidepanel on any webpage
3. Click the "Accessibility" tab
4. You should see:
   - Accessibility score
   - Issues summary counts
   - Top issues (culprits)
   - Detailed checks by category
   - Full issue list with suggestions and W3C links
5. Click "Toggle Highlights" to highlight issues on the page
6. Click individual "Highlight" buttons to highlight specific issues

## Features

- **Automated Checks**: 6 categories of accessibility audits
- **WCAG References**: Each issue links to W3C documentation
- **Visual Feedback**: Color-coded highlights on page elements
- **Helpful Suggestions**: Practical fix recommendations for each issue
- **Score Calculation**: Overall accessibility score (0-100)
- **Severity Levels**: Critical, Warning, Notice classifications

## Future Enhancements

- Color contrast ratio calculations
- Keyboard navigation testing
- Additional WCAG 2.2 checks
- Recommended fixes automation
