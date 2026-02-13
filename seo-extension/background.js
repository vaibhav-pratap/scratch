// background.js

// Function to create context menus
function createContextMenus() {
    chrome.contextMenus.removeAll(() => {
        console.log('Creating context menus...');

        chrome.contextMenus.create({
            id: "seo-site-search",
            title: "Site Search (site:domain)",
            contexts: ["all"]
        });

        chrome.contextMenus.create({
            id: "seo-highlight-nofollow",
            title: "Highlight Nofollow Links",
            contexts: ["all"]
        });

        chrome.contextMenus.create({
            id: "seo-copy-link",
            title: "Copy Email/Phone Link",
            contexts: ["link"]
        });

        chrome.contextMenus.create({
            id: "seo-copy-selection",
            title: "Copy as Email/Phone Link",
            contexts: ["selection"]
        });

        console.log('Context menus created successfully');
    });
}

// Create menus on install
chrome.runtime.onInstalled.addListener(() => {
    createContextMenus();
    
    // Set sidepanel to open on icon click
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('[SidePanel] Error setting behavior:', error));
});

// Recreate menus on startup
chrome.runtime.onStartup.addListener(() => {
    createContextMenus();
});

// Create menus immediately when service worker starts  
createContextMenus();

// Favicon proxy cache (survives for service worker lifetime)
const faviconCache = new Map();

// Listen for favicon requests from frontend
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getFavicon') {
        handleFaviconRequest(request.domain).then(sendResponse);
        return true; // Keep channel open for async response
    }
});

// Fetch favicon and convert to data URL
async function handleFaviconRequest(domain) {
    // Check cache first
    if (faviconCache.has(domain)) {
        return { dataUrl: faviconCache.get(domain) };
    }

    try {
        const url = `https://www.google.com/s2/favicons?domain=${domain}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const dataUrl = await blobToDataURL(blob);

        // Cache it
        faviconCache.set(domain, dataUrl);

        return { dataUrl };
    } catch (error) {
        console.error('[Favicon Proxy] Error fetching favicon:', error);
        // Return a default transparent 1x1 gif
        return { dataUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' };
    }
}

// Helper to convert Blob to Data URL
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "seo-site-search") {
        const url = new URL(tab.url);
        const domain = url.hostname;
        chrome.tabs.create({ url: `https://www.google.com/search?q=site:${domain}` });
    } else if (info.menuItemId === "seo-highlight-nofollow") {
        chrome.tabs.sendMessage(tab.id, { action: "toggleNofollow" });
    } else if (info.menuItemId === "seo-copy-link") {
        // Copy link URL (for mailto:/tel: links)
        const linkUrl = info.linkUrl;
        if (linkUrl) {
            copyToClipboard(tab.id, linkUrl);
        }
    } else if (info.menuItemId === "seo-copy-selection") {
        // Copy selected text with mailto: or tel: prefix if applicable
        const selectedText = info.selectionText;
        if (selectedText) {
            const trimmed = selectedText.trim();
            let textToCopy = trimmed;

            // Check if it's an email
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (emailRegex.test(trimmed)) {
                textToCopy = `mailto:${trimmed}`;
            } else {
                // Check if it's a phone number (contains mostly digits and formatting chars)
                const digitsOnly = trimmed.replace(/\D/g, '');
                if (digitsOnly.length >= 10 && trimmed.match(/[\d\s\-\(\)\+\.]/g)) {
                    textToCopy = `tel:${trimmed}`;
                }
            }

            copyToClipboard(tab.id, textToCopy);
        }
    }
});

// Helper function to copy to clipboard with notification
function copyToClipboard(tabId, text) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (textToCopy) => {
            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log('Copied:', textToCopy);

                // Show Google Material Design style notification
                const notification = document.createElement('div');
                notification.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span>Copied to clipboard</span>
                    </div>
                `;
                notification.style.cssText = `
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    background: #323232;
                    color: white;
                    padding: 14px 24px;
                    border-radius: 4px;
                    z-index: 999999;
                    font-family: 'Roboto', 'Google Sans', Arial, sans-serif;
                    font-size: 14px;
                    box-shadow: 0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12);
                    animation: slideIn 0.2s ease-out;
                `;

                // Add animation keyframes
                if (!document.getElementById('seo-notification-style')) {
                    const style = document.createElement('style');
                    style.id = 'seo-notification-style';
                    style.textContent = `
                        @keyframes slideIn {
                            from {
                                transform: translateX(400px);
                                opacity: 0;
                            }
                            to {
                                transform: translateX(0);
                                opacity: 1;
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }

                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.style.transition = 'opacity 0.2s ease-out';
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 200);
                }, 2500);
            }).catch(err => {
                console.error('Copy failed:', err);
            });
        },
        args: [text]
    });
}
