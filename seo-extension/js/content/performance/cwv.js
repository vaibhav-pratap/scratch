/**
 * Core Web Vitals module
 * Tracks LCP, CLS, INP, FCP, TTFB with caching and real-time updates
 */

// Global CWV data
export const cwvData = {
    lcp: 0,
    lcpElement: '',
    cls: 0,
    clsElement: '',
    inp: 0,
    fcp: 0,
    ttfb: 0
};

let cwvUpdateCallback = null;
let cwvUpdateTimeout = null;

/**
 * Set callback for CWV updates
 */
export function onCWVUpdate(callback) {
    cwvUpdateCallback = callback;
}

/**
 * Send CWV update (debounced)
 */
function sendCWVUpdate() {
    clearTimeout(cwvUpdateTimeout);
    cwvUpdateTimeout = setTimeout(() => {
        if (cwvUpdateCallback) {
            cwvUpdateCallback(cwvData);
        }
        // Cache the data
        try {
            const cacheKey = 'seo_cwv_cache_' + window.location.pathname;
            localStorage.setItem(cacheKey, JSON.stringify(cwvData));
        } catch (e) {
            // console.warn('[CWV] Cache error:', e);
        }
    }, 300);
}

/**
 * Initialize Performance Observers for CWV
 */
export function initCWV() {
    // Load cached CWV data
    try {
        const cacheKey = 'seo_cwv_cache_' + window.location.pathname;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsedCache = JSON.parse(cached);
            Object.assign(cwvData, parsedCache);
        }
    } catch (e) {
        // console.warn('[CWV] Cache load error:', e);
    }

    // LCP Observer
    try {
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            cwvData.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);

            // Capture LCP Element
            if (lastEntry.element && lastEntry.element.tagName) {
                let selector = lastEntry.element.tagName.toLowerCase();
                if (lastEntry.element.id) selector += '#' + lastEntry.element.id;
                else if (lastEntry.element.className) selector += '.' + lastEntry.element.className.split(' ').join('.');
                cwvData.lcpElement = selector;
            }

            sendCWVUpdate();
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
        // console.warn('[CWV] LCP observer error:', e);
    }

    // CLS Observer
    try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;

                    if (entry.sources && entry.sources.length > 0) {
                        const source = entry.sources[0];
                        if (source.node && source.node.tagName) {
                            let selector = source.node.tagName.toLowerCase();
                            if (source.node.id) selector += '#' + source.node.id;
                            else if (source.node.className && typeof source.node.className === 'string') {
                                selector += '.' + source.node.className.split(' ').join('.');
                            }
                            cwvData.clsElement = selector;
                        }
                    }
                }
            }
            cwvData.cls = Math.round(clsValue * 1000) / 1000;
            sendCWVUpdate();
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
        // console.warn('[CWV] CLS observer error:', e);
    }

    // INP Observer (Interaction to Next Paint)
    try {
        const inpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                cwvData.inp = Math.max(cwvData.inp, Math.round(entry.duration));
            }
            sendCWVUpdate();
        });
        inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch (e) {
        // console.warn('[CWV] INP observer error:', e);
    }

    // FCP Observer
    try {
        const fcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    cwvData.fcp = Math.round(entry.startTime);
                    sendCWVUpdate();
                }
            }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
        // console.warn('[CWV] FCP observer error:', e);
    }

    // TTFB (Time to First Byte)
    try {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
            cwvData.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
            sendCWVUpdate();
        }
    } catch (e) {
        // console.warn('[CWV] TTFB error:', e);
    }
}

/**
 * Get current CWV data
 */
export function getCWV() {
    return { ...cwvData };
}
