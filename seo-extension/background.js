// background.js

chrome.runtime.onInstalled.addListener(() => {
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
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "seo-site-search") {
        const url = new URL(tab.url);
        const domain = url.hostname;
        chrome.tabs.create({ url: `https://www.google.com/search?q=site:${domain}` });
    } else if (info.menuItemId === "seo-highlight-nofollow") {
        chrome.tabs.sendMessage(tab.id, { action: "toggleNofollow" });
    }
});
