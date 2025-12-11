/**
 * Tag Detector Module
 * Extracts marketing tags, analytics, and privacy compliance tools
 */

let detectedTags = {
    analytics: {},
    pixels: {},
    privacy: {},
    other: {}
};

// Initialize the detector by injecting a script into the page
export function initTagDetector() {
    // Listen for the custom event from the injected script
    window.addEventListener('message', (event) => {
        // We only accept messages from ourselves
        if (event.source !== window) return;

        if (event.data.type && event.data.type === 'SEO_EXTENSION_TAGS') {
            if (event.data.data) {
                mergeTags(event.data.data);
                // Dispatch a local event for content.js to pick up
                window.dispatchEvent(new CustomEvent('seo-extension-tags-updated'));
            }
        }
    });

    // Inject the detection script
    injectDetectionScript();
}

function mergeTags(newTags) {
    // Deep merge or simple assignment depending on structure
    // For now, we'll just merge categories
    if (newTags.analytics) Object.assign(detectedTags.analytics, newTags.analytics);
    if (newTags.pixels) Object.assign(detectedTags.pixels, newTags.pixels);
    if (newTags.privacy) Object.assign(detectedTags.privacy, newTags.privacy);
    if (newTags.other) Object.assign(detectedTags.other, newTags.other);
}

function injectDetectionScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/content/injected-tag-detector.js');
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

export function detectTags() {
    // Combine DOM-based detection (from content script) with Window-based detection (from injected script)

    // DOM-based checks (can run in isolated world)
    const domTags = {
        analytics: {},
        pixels: {},
        privacy: {},
        other: {}
    };

    // Check script tags for IDs if not found in window object

    // GA4 Scripts
    const ga4Scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
    if (ga4Scripts.length > 0) {
        const ids = [];
        ga4Scripts.forEach(script => {
            const match = script.src.match(/id=(G-[A-Z0-9]+)/);
            if (match) ids.push(match[1]);
        });

        if (!detectedTags.analytics.ga4 && ids.length > 0) {
            domTags.analytics.ga4 = {
                detected: true,
                ids: [...new Set(ids)],
                method: 'Script Tag'
            };
        } else if (detectedTags.analytics.ga4 && ids.length > 0) {
            // Merge IDs
            const existingIds = detectedTags.analytics.ga4.ids || [];
            detectedTags.analytics.ga4.ids = [...new Set([...existingIds, ...ids])];
        }
    }

    // Universal Analytics Scripts
    const uaScripts = document.querySelectorAll('script[src*="google-analytics.com/analytics.js"], script[src*="google-analytics.com/ga.js"]');
    if (uaScripts.length > 0 && !detectedTags.analytics.universalAnalytics) {
        domTags.analytics.universalAnalytics = {
            detected: true,
            ids: [], // IDs are typically found via window.ga, not script src for UA
            method: 'Script Tag'
        };
    }

    // GTM Scripts
    const gtmScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');
    const gtmIframes = document.querySelectorAll('iframe[src*="googletagmanager.com/ns.html"]');
    if (gtmScripts.length > 0 || gtmIframes.length > 0) {
        const ids = [];
        gtmScripts.forEach(script => {
            const match = script.src.match(/id=(GTM-[A-Z0-9]+)/);
            if (match) ids.push(match[1]);
        });
        gtmIframes.forEach(iframe => {
            const match = iframe.src.match(/id=(GTM-[A-Z0-9]+)/);
            if (match) ids.push(match[1]);
        });

        if (!detectedTags.analytics.gtm && ids.length > 0) {
            domTags.analytics.gtm = {
                detected: true,
                ids: [...new Set(ids)]
            };
        } else if (detectedTags.analytics.gtm && ids.length > 0) {
            const existingIds = detectedTags.analytics.gtm.ids || [];
            detectedTags.analytics.gtm.ids = [...new Set([...existingIds, ...ids])];
        }
    }

    // Facebook Pixel Scripts
    const fbScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
    if (fbScripts.length > 0 || document.cookie.includes('_fbp')) {
        if (!detectedTags.pixels.facebookPixel) {
            domTags.pixels.facebookPixel = {
                detected: true,
                ids: [],
                cookie: document.cookie.includes('_fbp')
            };
        } else if (document.cookie.includes('_fbp')) {
            detectedTags.pixels.facebookPixel.cookie = true;
        }
    }

    // LinkedIn Insight Tag Scripts
    const linkedinScripts = document.querySelectorAll('script[src*="snap.licdn.com"]');
    if (linkedinScripts.length > 0 && !detectedTags.pixels.linkedinInsight) {
        domTags.pixels.linkedinInsight = {
            detected: true,
            ids: []
        };
    }

    // Twitter/X Pixel Scripts
    const twitterScripts = document.querySelectorAll('script[src*="static.ads-twitter.com"]');
    if (twitterScripts.length > 0 && !detectedTags.pixels.twitterPixel) {
        domTags.pixels.twitterPixel = {
            detected: true,
            ids: []
        };
    }

    // TikTok Pixel Scripts
    const tiktokScripts = document.querySelectorAll('script[src*="analytics.tiktok.com"]');
    if (tiktokScripts.length > 0 && !detectedTags.pixels.tiktokPixel) {
        domTags.pixels.tiktokPixel = {
            detected: true,
            ids: []
        };
    }

    // Pinterest Tag Scripts
    const pinterestScripts = document.querySelectorAll('script[src*="pinimg.com/ct"]');
    if (pinterestScripts.length > 0 && !detectedTags.pixels.pinterestTag) {
        domTags.pixels.pinterestTag = {
            detected: true,
            ids: []
        };
    }

    // Snapchat Pixel Scripts
    const snapchatScripts = document.querySelectorAll('script[src*="sc-static.net"]');
    if (snapchatScripts.length > 0 && !detectedTags.pixels.snapchatPixel) {
        domTags.pixels.snapchatPixel = {
            detected: true,
            ids: []
        };
    }

    // OneTrust DOM check
    if (document.querySelector('#onetrust-consent-sdk') && !detectedTags.privacy.oneTrust) {
        domTags.privacy.oneTrust = {
            detected: true,
            type: 'Cookie Consent Platform'
        };
    }

    // Cookiebot DOM check
    if (document.querySelector('script[src*="consent.cookiebot.com"]') && !detectedTags.privacy.cookiebot) {
        domTags.privacy.cookiebot = {
            detected: true,
            type: 'Cookie Consent Platform'
        };
    }

    // Hotjar DOM check
    if (document.querySelector('script[src*="static.hotjar.com"]') && !detectedTags.other.hotjar) {
        domTags.other.hotjar = {
            detected: true,
            type: 'Heatmap & Analytics'
        };
    }

    // Mixpanel DOM check
    if (document.querySelector('script[src*="cdn.mxpnl.com"]') && !detectedTags.other.mixpanel) {
        domTags.other.mixpanel = {
            detected: true,
            type: 'Product Analytics'
        };
    }

    // Intercom DOM check
    if (document.querySelector('script[src*="widget.intercom.io"]') && !detectedTags.other.intercom) {
        domTags.other.intercom = {
            detected: true,
            type: 'Customer Messaging'
        };
    }

    // Privacy & Compliance Links Detection
    const policyTypes = [
        { type: 'Privacy Policy', keywords: ['privacy policy', 'privacy notice', 'privacy statement', 'data policy', 'privacy center'] },
        { type: 'Terms of Service', keywords: ['terms of service', 'terms of use', 'terms and conditions', 'terms & conditions', 'user agreement', 'service agreement', 'conditions of use'] },
        { type: 'Cookie Policy', keywords: ['cookie policy', 'cookie notice', 'cookie statement', 'cookies settings', 'cookie preferences'] },
        { type: 'Security Policy', keywords: ['security policy', 'security statement', 'security center', 'responsible disclosure'] },
        { type: 'GDPR & Compliance', keywords: ['gdpr', 'compliance', 'legal notice', 'legal information', 'impressum', 'imprint'] },
        { type: 'Accessibility', keywords: ['accessibility statement', 'accessibility policy', 'accessibility'] },
        { type: 'Do Not Sell', keywords: ['do not sell', 'do not sell my personal information', 'ccpa', 'opt-out', 'your privacy choices'] },
        { type: 'Refund Policy', keywords: ['refund policy', 'return policy', 'cancellation policy', 'shipping policy'] },
        { type: 'EULA', keywords: ['end user license agreement', 'eula', 'license agreement'] }
    ];

    const allLinks = document.querySelectorAll('a[href]');
    const detectedPolicies = new Map(); // Map href -> { type, text, href, score }

    allLinks.forEach(link => {
        const href = link.href.toLowerCase();
        const text = link.textContent.toLowerCase().trim();

        // Basic filtering
        if (!href || href.includes('javascript:') || href.startsWith('#') || href.length > 200 || text.length > 100) return;

        for (const policy of policyTypes) {
            let score = 0;
            let matched = false;

            // 1. Exact Text Match (Highest Confidence)
            if (policy.keywords.some(kw => text === kw)) {
                score = 10;
                matched = true;
            }
            // 2. Partial Text Match (High Confidence)
            else if (policy.keywords.some(kw => text.includes(kw))) {
                score = 5;
                matched = true;
            }
            // 3. URL Match (Medium Confidence) - only if text is generic or empty
            else if (text.length < 30) {
                // Check for slugified keywords in URL
                const urlMatch = policy.keywords.some(kw => {
                    const slug = kw.replace(/\s+/g, '[-_]?'); // Match hyphen or underscore
                    const regex = new RegExp(`[/.]${slug}[/.]|/${slug}$`);
                    return regex.test(href);
                });

                if (urlMatch) {
                    score = 3;
                    matched = true;
                }
            }

            if (matched) {
                // If we already found this URL, only update if the new match is "better" (higher score)
                // or if it's the same score but a more specific type (heuristic)
                const existing = detectedPolicies.get(link.href);
                if (!existing || score > existing.score) {
                    detectedPolicies.set(link.href, {
                        text: policy.type, // Use the standardized Policy Type name
                        href: link.href,
                        score: score
                    });
                }
                break; // Stop checking other types for this link once matched
            }
        }
    });

    if (detectedPolicies.size > 0) {
        // Convert map to array and sort by score (descending)
        const sortedLinks = Array.from(detectedPolicies.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 8); // Limit to top 8 most relevant links

        domTags.privacy.privacyPolicy = {
            detected: true,
            links: sortedLinks
        };
    }

    // Cookie Banners (DOM check)
    const gdprSelectors = [
        '[class*="cookie-banner"]',
        '[class*="cookie-consent"]',
        '[class*="gdpr"]',
        '[id*="cookie-notice"]',
        '[id*="cookie-banner"]',
        '.cc-window',
        '#cookieNotice'
    ];

    const hasCookieBanner = gdprSelectors.some(selector => document.querySelector(selector));
    if (hasCookieBanner && !detectedTags.privacy.oneTrust && !detectedTags.privacy.cookiebot) {
        domTags.privacy.cookieBanner = {
            detected: true,
            type: 'Cookie Consent Banner (Generic)'
        };
    }

    // Merge DOM tags into detectedTags
    if (domTags.analytics) Object.assign(detectedTags.analytics, domTags.analytics);
    if (domTags.pixels) Object.assign(detectedTags.pixels, domTags.pixels);
    if (domTags.privacy) Object.assign(detectedTags.privacy, domTags.privacy);
    if (domTags.other) Object.assign(detectedTags.other, domTags.other);

    return detectedTags;
}
