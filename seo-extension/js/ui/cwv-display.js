/**
 * Enhanced CWV rendering with metrics display and suggestions
 */

/**
 * Generate CWV suggestions based on thresholds
 */
export function generateCWVSuggestions(cwv) {
    const suggestions = [];

    // LCP - Largest Contentful Paint
    const lcp = cwv.lcp || 0;
    if (lcp === 0) {
        suggestions.push({ type: 'info', text: '⏱️ LCP: Measuring... This metric may take a few seconds to capture.' });
    } else if (lcp > 2500) {
        suggestions.push({ type: 'error', text: `🔴 LCP: ${lcp}ms is poor. Target < 2500ms. Optimize images and reduce server response time.` });
    } else if (lcp > 1500) {
        suggestions.push({ type: 'warning', text: `🟡 LCP: ${lcp}ms needs improvement. Aim for < 2500ms.` });
    } else {
        suggestions.push({ type: 'success', text: `🟢 LCP: ${lcp}ms is good!` });
    }

    // CLS - Cumulative Layout Shift
    const cls = cwv.cls || 0;
    if (cls === 0) {
        suggestions.push({ type: 'info', text: '📐 CLS: Measuring... Layout shifts are being tracked.' });
    } else if (cls > 0.25) {
        suggestions.push({ type: 'error', text: `🔴 CLS: ${cls.toFixed(3)} is poor. Target < 0.1. Reserve space for ads/images.` });
    } else if (cls > 0.1) {
        suggestions.push({ type: 'warning', text: `🟡 CLS: ${cls.toFixed(3)} needs improvement. Aim for < 0.1.` });
    } else {
        suggestions.push({ type: 'success', text: `🟢 CLS: ${cls.toFixed(3)} is excellent!` });
    }

    // INP - Interaction to Next Paint
    const inp = cwv.inp || 0;
    if (inp === 0) {
        suggestions.push({ type: 'info', text: '👆 INP: Waiting for user interaction to measure.' });
    } else if (inp > 500) {
        suggestions.push({ type: 'error', text: `🔴 INP: ${inp}ms is poor. Target < 200ms. Reduce JavaScript execution.` });
    } else if (inp > 200) {
        suggestions.push({ type: 'warning', text: `🟡 INP: ${inp}ms needs improvement. Optimize event handlers.` });
    } else {
        suggestions.push({ type: 'success', text: `🟢 INP: ${inp}ms is great!` });
    }

    // FCP - First Contentful Paint
    const fcp = cwv.fcp || 0;
    if (fcp === 0) {
        suggestions.push({ type: 'info', text: '🎨 FCP: Measuring initial paint timing.' });
    } else if (fcp > 3000) {
        suggestions.push({ type: 'error', text: `🔴 FCP: ${fcp}ms is slow. Target < 1800ms. Minimize render-blocking resources.` });
    } else if (fcp > 1800) {
        suggestions.push({ type: 'warning', text: `🟡 FCP: ${fcp}ms could be faster. Aim for < 1800ms.` });
    } else {
        suggestions.push({ type: 'success', text: `🟢 FCP: ${fcp}ms is fast!` });
    }

    // TTFB - Time to First Byte
    const ttfb = cwv.ttfb || 0;
    if (ttfb === 0) {
        suggestions.push({ type: 'info', text: '🌐 TTFB: Measuring server response time.' });
    } else if (ttfb > 800) {
        suggestions.push({ type: 'error', text: `🔴 TTFB: ${ttfb}ms is too slow. Target < 600ms. Optimize server or use CDN.` });
    } else if (ttfb > 600) {
        suggestions.push({ type: 'warning', text: `🟡 TTFB: ${ttfb}ms could improve. Consider caching.` });
    } else {
        suggestions.push({ type: 'success', text: `🟢 TTFB: ${ttfb}ms is excellent!` });
    }

    return suggestions;
}

/**
 * Render CWV section with metrics and suggestions
 */
export function renderCWVSection(cwv, chartRenderer) {
    // Render the chart
    if (chartRenderer) {
        chartRenderer(cwv);
    }

    // Generate and display suggestions
    const suggestions = generateCWVSuggestions(cwv);

    // Try to find a dedicated CWV suggestions container
    const cwvSuggContainer = document.getElementById('cwv-suggestions');
    if (cwvSuggContainer) {
        cwvSuggContainer.innerHTML = '';
        suggestions.forEach(s => {
            const div = document.createElement('div');
            div.className = `suggestion-item ${s.type}`;
            div.textContent = s.text;
            cwvSuggContainer.appendChild(div);
        });
    }

    return suggestions;
}
