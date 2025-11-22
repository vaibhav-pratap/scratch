# Side Panel Implementation Plan

## Goal Description
Implement a Chrome Side Panel for the SEO Analyzer extension. This will allow users to view SEO data in a persistent side panel alongside the webpage. The layout will be modernized with a Google-inspired UX, and a setting will be added to toggle between the Popup and Side Panel views.

## User Review Required
> [!IMPORTANT]
> The "open in side panel" setting requires the `sidePanel.setPanelBehavior` API, which changes the default click action of the extension icon.

## Proposed Changes

### Manifest Update
#### [MODIFY] [manifest.json](file:///c:/Users/isits/.gemini/antigravity/scratch/seo-extension/manifest.json)
- Add `"side_panel"` permission.
- Add `"side_panel": { "default_path": "sidepanel.html" }` configuration.

### Side Panel UI
#### [NEW] [sidepanel.html](file:///c:/Users/isits/.gemini/antigravity/scratch/seo-extension/sidepanel.html)
- Create a new HTML file for the side panel, based on `popup.html` but adapted for a narrower/taller layout.
- Ensure responsive design for variable side panel widths.

#### [NEW] [sidepanel.js](file:///c:/Users/isits/.gemini/antigravity/scratch/seo-extension/sidepanel.js)
- Create a new JS file for the side panel logic.
- Reuse core logic from `popup.js` (consider refactoring common logic to `utils.js` or a shared module if possible, otherwise duplicate and adapt).
- Handle side panel specific events.

#### [NEW] [sidepanel.css](file:///c:/Users/isits/.gemini/antigravity/scratch/seo-extension/sidepanel.css)
- Create a new CSS file for the side panel.
- Adapt `styles.css` for the side panel context.

### Settings & Background
#### [MODIFY] [popup.html](file:///c:/Users/isits/.gemini/antigravity/scratch/seo-extension/popup.html)
- Add a toggle switch in the "Settings" tab to "Open in Side Panel".

#### [MODIFY] [popup.js](file:///c:/Users/isits/.gemini/antigravity/scratch/seo-extension/popup.js)
- Handle the "Open in Side Panel" toggle change.
- Use `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true/false })` to switch modes.

#### [MODIFY] [background.js](file:///c:/Users/isits/.gemini/antigravity/scratch/seo-extension/background.js)
- Ensure background script handles any necessary initialization for the side panel.
- (Optional) Context menu item to open side panel.

## Verification Plan
### Automated Tests
- None (UI heavy task).

### Manual Verification
1. **Install/Reload Extension**: Verify no errors on load.
2. **Default Mode**: Click extension icon -> Popup opens.
3. **Enable Side Panel**: Go to Settings -> Toggle "Open in Side Panel" -> ON.
4. **Side Panel Mode**: Click extension icon -> Side Panel opens.
5. **Data Verification**: Check all tabs (Overview, Meta, etc.) in Side Panel populate correctly.
6. **Layout Check**: Resize Side Panel and ensure layout adapts (responsive).
7. **Disable Side Panel**: Go to Settings (in Side Panel) -> Toggle "Open in Side Panel" -> OFF.
8. **Revert Mode**: Click extension icon -> Popup opens again.
