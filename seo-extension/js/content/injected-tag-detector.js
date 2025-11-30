/**
 * Injected Tag Detector Script
 * Runs in the Main World to access global window objects
 */
(function () {
    try {
        const tags = {
            analytics: {},
            pixels: {},
            privacy: {},
            other: {}
        };

        // ===== ANALYTICS DETECTION =====

        // Google Analytics 4
        if (window.gtag || window.dataLayer) {
            const ga4Configs = [];

            // Check dataLayer for GA4 config
            if (window.dataLayer && Array.isArray(window.dataLayer)) {
                window.dataLayer.forEach(item => {
                    if (item && item[0] === 'config' && item[1] && typeof item[1] === 'string' && item[1].startsWith('G-')) {
                        ga4Configs.push(item[1]);
                    }
                });
            }

            // Check global gtag object
            if (ga4Configs.length > 0 || window.gtag) {
                tags.analytics.ga4 = {
                    detected: true,
                    ids: [...new Set(ga4Configs)],
                    method: window.gtag ? 'gtag.js' : 'dataLayer'
                };
            }
        }

        // Universal Analytics
        if (window.ga || window._gaq) {
            const uaIds = [];

            // Check for ga object
            if (window.ga && typeof window.ga === 'function') {
                try {
                    // Try to get trackers if accessible
                    if (window.ga.getAll) {
                        const trackers = window.ga.getAll();
                        trackers.forEach(tracker => {
                            const trackingId = tracker.get('trackingId');
                            if (trackingId) uaIds.push(trackingId);
                        });
                    }
                } catch (e) {
                    // Ignore errors accessing ga internals
                }
            }

            tags.analytics.universalAnalytics = {
                detected: true,
                ids: uaIds.length > 0 ? uaIds : [],
                method: window._gaq ? 'ga.js (legacy)' : 'analytics.js'
            };
        }

        // Google Tag Manager
        if (window.google_tag_manager || window.dataLayer) {
            const gtmIds = [];

            // Check google_tag_manager object
            if (window.google_tag_manager) {
                Object.keys(window.google_tag_manager).forEach(key => {
                    if (key.startsWith('GTM-')) {
                        gtmIds.push(key);
                    }
                });
            }

            if (gtmIds.length > 0 || window.google_tag_manager) {
                tags.analytics.gtm = {
                    detected: true,
                    ids: [...new Set(gtmIds)]
                };
            }
        }

        // ===== ADVERTISING PIXELS =====

        // Google Ads (Conversion Tracking)
        if (window.google_conversion_id) {
            tags.pixels.googleAds = {
                detected: true,
                ids: [window.google_conversion_id]
            };
        }

        // Facebook Pixel
        if (window.fbq || window._fbq) {
            const fbPixelIds = [];

            // Check for pixel IDs in fbq calls
            if (window.fbq && window.fbq.getState) {
                try {
                    const state = window.fbq.getState();
                    if (state && state.pixels) {
                        state.pixels.forEach(pixel => {
                            if (pixel.id) fbPixelIds.push(pixel.id);
                        });
                    }
                } catch (e) { }
            }

            tags.pixels.facebookPixel = {
                detected: true,
                ids: fbPixelIds.length > 0 ? fbPixelIds : []
            };
        }

        // LinkedIn Insight Tag
        if (window._linkedin_data_partner_ids) {
            const linkedinIds = [];
            if (Array.isArray(window._linkedin_data_partner_ids)) {
                linkedinIds.push(...window._linkedin_data_partner_ids);
            }

            tags.pixels.linkedinInsight = {
                detected: true,
                ids: linkedinIds
            };
        }

        // Twitter/X Pixel
        if (window.twq) {
            tags.pixels.twitterPixel = {
                detected: true,
                ids: []
            };
        }

        // Microsoft Advertising (Bing Ads)
        if (window.uetq) {
            tags.pixels.microsoftAds = {
                detected: true,
                ids: []
            };
        }

        // TikTok Pixel
        if (window.ttq) {
            tags.pixels.tiktokPixel = {
                detected: true,
                ids: []
            };
        }

        // Pinterest Tag
        if (window.pintrk) {
            tags.pixels.pinterestTag = {
                detected: true,
                ids: []
            };
        }

        // Snapchat Pixel
        if (window.snaptr) {
            tags.pixels.snapchatPixel = {
                detected: true,
                ids: []
            };
        }

        // ===== PRIVACY COMPLIANCE =====

        // OneTrust
        if (window.OneTrust || window.OptanonWrapper) {
            tags.privacy.oneTrust = {
                detected: true,
                type: 'Cookie Consent Platform'
            };
        }

        // Cookiebot
        if (window.Cookiebot) {
            tags.privacy.cookiebot = {
                detected: true,
                type: 'Cookie Consent Platform'
            };
        }

        // ===== OTHER TOOLS =====

        // Hotjar
        if (window.hj) {
            tags.other.hotjar = {
                detected: true,
                type: 'Heatmap & Analytics'
            };
        }

        // Mixpanel
        if (window.mixpanel) {
            tags.other.mixpanel = {
                detected: true,
                type: 'Product Analytics'
            };
        }

        // Segment
        if (window.analytics && window.analytics.identify) {
            tags.other.segment = {
                detected: true,
                type: 'Customer Data Platform'
            };
        }

        // Intercom
        if (window.Intercom) {
            tags.other.intercom = {
                detected: true,
                type: 'Customer Messaging'
            };
        }

        // Dispatch event with data
        window.postMessage({
            type: 'SEO_EXTENSION_TAGS',
            data: tags
        }, '*');

    } catch (e) {
        // Silent fail in injected script to avoid console noise
    }
})();
