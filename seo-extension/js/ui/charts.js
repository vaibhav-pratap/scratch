/**
 * Charts module for all Chart.js visualizations
 * Handles CWV, Links, Headings, and PAA charts
 */

// Chart instances (global state for destruction)
let cwvChartInstance = null;
let linksChartInstance = null;
let headingsChartInstance = null;
let paaChartInstance = null;

/**
 * Render Core Web Vitals chart
 */
export function renderCWVChart(cwv) {
    const ctx = document.getElementById('cwv-chart');
    if (!ctx) return;

    if (cwvChartInstance) {
        cwvChartInstance.destroy();
    }

    const labels = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'];
    const values = [
        cwv.lcp || 0,
        cwv.cls || 0,
        cwv.inp || 0,
        cwv.fcp || 0,
        cwv.ttfb || 0
    ];

    cwvChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Metric Value',
                data: values.map((v, i) => i === 1 ? v * 1000 : v), // Scale CLS * 1000
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';

                            let value = context.raw;
                            if (context.dataIndex === 1) { // CLS
                                value = value / 1000;
                                label += value.toFixed(3);
                            } else {
                                label += Math.round(value) + ' ms';
                            }
                            return label;
                        }
                    }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value (ms) / CLS (*1000)'
                    }
                }
            }
        }
    });
}

/**
 * Render Links distribution chart
 */
export function renderLinksChart(links) {
    const ctx = document.getElementById('links-chart');
    if (!ctx) return;

    if (linksChartInstance) {
        linksChartInstance.destroy();
    }

    linksChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Internal', 'External'],
            datasets: [{
                data: [links.internal.length, links.external.length],
                backgroundColor: ['#36A2EB', '#FF6384'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

/**
 * Render Headings distribution chart
 */
export function renderHeadingsChart(headings) {
    const ctx = document.getElementById('headings-chart');
    if (!ctx) return;

    if (headingsChartInstance) {
        headingsChartInstance.destroy();
    }

    const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    headings.forEach(h => {
        const tag = h.tag.toLowerCase();
        if (counts[tag] !== undefined) counts[tag]++;
    });

    headingsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(counts).map(k => k.toUpperCase()),
            datasets: [{
                label: 'Count',
                data: Object.values(counts),
                backgroundColor: '#4BC0C0'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

/**
 * Render PAA (People Also Ask) chart
 */
export function renderPAAChart(paaData) {
    const ctx = document.getElementById('paa-chart');
    if (!ctx || !paaData) return;

    if (paaChartInstance) {
        paaChartInstance.destroy();
    }

    // Visualize word count of questions
    const wordCounts = paaData.map(q => q.split(' ').length);

    paaChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: paaData.map((_, i) => `Q${i + 1}`),
            datasets: [{
                label: 'Word Count',
                data: wordCounts,
                borderColor: '#FF9F40',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (context) => {
                            const index = context[0].dataIndex;
                            return paaData[index];
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Word Count' } }
            }
        }
    });
}

/**
 * Toggle PAA chart visibility
 */
export function togglePAAChart(paaData) {
    const container = document.getElementById('paa-chart-container');
    const list = document.getElementById('paa-list');
    const btn = document.getElementById('btn-paa-chart');

    if (!container || !list) return;

    if (container.style.display === 'none') {
        container.style.display = 'block';
        list.style.display = 'none';
        if (btn) btn.textContent = 'View List';
        renderPAAChart(paaData);
    } else {
        container.style.display = 'none';
        list.style.display = 'block';
        if (btn) btn.textContent = 'View Chart';
    }
}

/**
 * Destroy all chart instances (useful for cleanup)
 */
export function destroyAllCharts() {
    if (cwvChartInstance) {
        cwvChartInstance.destroy();
        cwvChartInstance = null;
    }
    if (linksChartInstance) {
        linksChartInstance.destroy();
        linksChartInstance = null;
    }
    if (headingsChartInstance) {
        headingsChartInstance.destroy();
        headingsChartInstance = null;
    }
    if (paaChartInstance) {
        paaChartInstance.destroy();
        paaChartInstance = null;
    }
}
