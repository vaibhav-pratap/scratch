/**
 * Google Ads Transparency Integration
 * Handles the ads transparency lookup feature
 */

/**
 * Initialize the Google Ads Transparency feature
 */
export function initAdsTransparency() {
    const btnViewAds = document.getElementById('btn-view-ads');

    if (!btnViewAds) {
        console.warn('[Ads Transparency] Button not found in DOM');
        return;
    }

    console.log('[Ads Transparency] Initializing...');

    btnViewAds.addEventListener('click', async () => {
        console.log('[Ads Transparency] Button clicked');

        try {
            // Get URL from current SEO data (more reliable than querying tabs in sidepanel)
            let currentUrl = null;

            if (window.currentSEOData && window.currentSEOData.url) {
                currentUrl = window.currentSEOData.url;
                console.log('[Ads Transparency] Got URL from SEO data:', currentUrl);
            } else {
                // Fallback: try to get from active tab
                console.log('[Ads Transparency] SEO data not available, trying tab query...');
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tabs && tabs[0] && tabs[0].url) {
                        currentUrl = tabs[0].url;
                        console.log('[Ads Transparency] Got URL from tab query:', currentUrl);
                    }
                } catch (tabError) {
                    console.warn('[Ads Transparency] Tab query failed:', tabError);
                }
            }

            if (!currentUrl) {
                console.error('[Ads Transparency] No URL available');
                alert('Unable to detect current website URL. Please make sure you have analyzed a website first.');
                return;
            }

            // Extract domain from URL
            const url = new URL(currentUrl);
            let domain = url.hostname;

            // Remove "www." prefix for better search results
            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
                console.log('[Ads Transparency] Removed www prefix');
            }

            console.log('[Ads Transparency] Extracted domain:', domain);

            // Get selected region
            const regionSelector = document.getElementById('ads-region-selector');
            const region = regionSelector ? regionSelector.value : 'US';

            console.log('[Ads Transparency] Selected region:', region);

            // Construct Google Ads Transparency Center URL
            const adsTransparencyUrl = `https://adstransparency.google.com/?region=${region}&domain=${domain}`;

            console.log('[Ads Transparency] Opening URL:', adsTransparencyUrl);

            // Open in new tab
            await chrome.tabs.create({ url: adsTransparencyUrl });

            console.log('[Ads Transparency] New tab created successfully');
        } catch (error) {
            console.error('[Ads Transparency] Error:', error);
            alert(`Error opening Ads Transparency Center: ${error.message}`);
        }
    });

    console.log('[Ads Transparency] Initialized successfully');
}

/**
 * Initialize the Meta Ads Library feature
 */
export function initMetaAds() {
    const btnViewMetaAds = document.getElementById('btn-view-meta-ads');

    if (!btnViewMetaAds) {
        console.warn('[Meta Ads] Button not found in DOM');
        return;
    }

    console.log('[Meta Ads] Initializing...');

    btnViewMetaAds.addEventListener('click', async () => {
        console.log('[Meta Ads] Button clicked');

        try {
            // Get URL from current SEO data
            let currentUrl = null;

            if (window.currentSEOData && window.currentSEOData.url) {
                currentUrl = window.currentSEOData.url;
                console.log('[Meta Ads] Got URL from SEO data:', currentUrl);
            } else {
                // Fallback: try to get from active tab
                console.log('[Meta Ads] SEO data not available, trying tab query...');
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tabs && tabs[0] && tabs[0].url) {
                        currentUrl = tabs[0].url;
                        console.log('[Meta Ads] Got URL from tab query:', currentUrl);
                    }
                } catch (tabError) {
                    console.warn('[Meta Ads] Tab query failed:', tabError);
                }
            }

            if (!currentUrl) {
                console.error('[Meta Ads] No URL available');
                alert('Unable to detect current website URL. Please make sure you have analyzed a website first.');
                return;
            }

            // Extract domain from URL
            const url = new URL(currentUrl);
            let domain = url.hostname;

            // Remove "www." prefix for better search results
            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
                console.log('[Meta Ads] Removed www prefix');
            }

            console.log('[Meta Ads] Extracted domain:', domain);

            // Get selected country
            const countrySelector = document.getElementById('meta-ads-country-selector');
            const country = countrySelector ? countrySelector.value : 'US';

            console.log('[Meta Ads] Selected country:', country);

            // Construct Meta Ads Library URL
            const metaAdsUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(domain)}`;

            console.log('[Meta Ads] Opening URL:', metaAdsUrl);

            // Open in new tab
            await chrome.tabs.create({ url: metaAdsUrl });

            console.log('[Meta Ads] New tab created successfully');
        } catch (error) {
            console.error('[Meta Ads] Error:', error);
            alert(`Error opening Meta Ads Library: ${error.message}`);
        }
    });

    console.log('[Meta Ads] Initialized successfully');
}
