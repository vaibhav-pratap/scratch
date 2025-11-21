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
            id: "seo-copy-mailto-tel",
            title: "📋 Copy Email/Phone Link",
            contexts: ["link"]
        });

        console.log('Context menus created successfully');
    });
}

// Create menus on install
chrome.runtime.onInstalled.addListener(() => {
    createContextMenus();
});

// Recreate menus on startup
chrome.runtime.onStartup.addListener(() => {
    createContextMenus();
});

// Create menus immediately when service worker starts  
createContextMenus();

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "seo-site-search") {
        const url = new URL(tab.url);
        const domain = url.hostname;
        chrome.tabs.create({ url: `https://www.google.com/search?q=site:${domain}` });
    } else if (info.menuItemId === "seo-highlight-nofollow") {
        chrome.tabs.sendMessage(tab.id, { action: "toggleNofollow" });
    } else if (info.menuItemId === "seo-copy-mailto-tel") {
        const linkUrl = info.linkUrl;
        if (linkUrl) {
            // Execute script in page context to copy to clipboard
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (url) => {
                    navigator.clipboard.writeText(url).then(() => {
                        console.log('Copied:', url);
                        // Show a brief notification
                        const notification = document.createElement('div');
                        notification.textContent = '✓ Copied to clipboard';
                        notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:12px 24px;border-radius:4px;z-index:999999;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.2)';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 2000);
                    }).catch(err => {
                        console.error('Copy failed:', err);
                    });
                },
                args: [linkUrl]
            });
        }
    }
});
