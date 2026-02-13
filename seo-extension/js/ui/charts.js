/**
 * Charts module for all Chart.js visualizations
 * Handles CWV, Links, Headings, PAA, and AI charts
 */

// Chart instances (global state for destruction)
let cwvChartInstance = null;
let linksChartInstance = null;
let headingsChartInstance = null;
let paaChartInstance = null;
let aiMetricsChartInstance = null;
let aiComparisonChartInstance = null;

/**
 * Render Core Web Vitals chart
 */
export function renderCWVChart(cwv) {
    const ctx = document.getElementById('cwv-chart');
    if (!ctx || !cwv) return;

    // Process Data
    let labels = [];
    let lcpData = [];
    let clsData = [];
    let fcpData = [];
    let ttfbData = [];
    let inpData = [];

    // Use consolidated history if available
    let history = cwv.history || cwv.clsHistory || [];

    if (history.length > 0) {
        labels = history.map(h => {
             const date = new Date(h.timestamp);
             return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' }); // shorter label
        });
        lcpData = history.map(h => h.lcp || 0);
        clsData = history.map(h => h.cls || (h.value || 0));
        fcpData = history.map(h => h.fcp || 0);
        ttfbData = history.map(h => h.ttfb || 0);
        inpData = history.map(h => h.inp || 0);
    } else {
        // Fallback for initial load
        const now = new Date().toLocaleTimeString();
        labels = [now];
        lcpData = [cwv.lcp || 0];
        clsData = [cwv.cls || 0];
        fcpData = [cwv.fcp || 0];
        ttfbData = [cwv.ttfb || 0];
        inpData = [cwv.inp || 0];
    }

    // Optimization: Update existing chart if it exists
    if (cwvChartInstance) {
        cwvChartInstance.data.labels = labels;
        cwvChartInstance.data.datasets[0].data = lcpData; // LCP
        cwvChartInstance.data.datasets[1].data = clsData; // CLS
        cwvChartInstance.data.datasets[2].data = fcpData; // FCP
        cwvChartInstance.data.datasets[3].data = ttfbData; // TTFB
        if (cwvChartInstance.data.datasets[4]) {
            cwvChartInstance.data.datasets[4].data = inpData; // INP if exists
        } else {
            // Hot-add INP if not present in old instance
             cwvChartInstance.data.datasets.push({
                label: 'INP (ms)',
                data: inpData,
                borderColor: 'rgba(255, 206, 86, 1)', // Yellow
                backgroundColor: 'rgba(255, 206, 86, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                yAxisID: 'y',
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 4
            });
        }
        cwvChartInstance.update('none'); // 'none' for performance (no animation on every tick)
        return;
    }

    // Modern Gradient
    const chartCtx = ctx.getContext('2d');
    const gradientCLS = chartCtx.createLinearGradient(0, 0, 0, 400);
    gradientCLS.addColorStop(0, 'rgba(54, 162, 235, 0.4)');
    gradientCLS.addColorStop(1, 'rgba(54, 162, 235, 0.0)');

    cwvChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'LCP (ms)',
                    data: lcpData,
                    borderColor: 'rgba(255, 99, 132, 1)', // Red
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'CLS',
                    data: clsData,
                    borderColor: 'rgba(54, 162, 235, 1)', // Blue
                    backgroundColor: gradientCLS,
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1', // Separate axis
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'FCP (ms)',
                    data: fcpData,
                    borderColor: 'rgba(75, 192, 192, 1)', // Green
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'TTFB (ms)',
                    data: ttfbData,
                    borderColor: 'rgba(153, 102, 255, 1)', // Purple
                    backgroundColor: 'rgba(153, 102, 255, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'INP (ms)',
                    data: inpData,
                    borderColor: 'rgba(255, 206, 86, 1)', // Yellow
                    backgroundColor: 'rgba(255, 206, 86, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // Disable initial animation for snappiness
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 8,
                        usePointStyle: true,
                        font: { size: 9 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(28, 28, 30, 0.95)', // Darker tooltip
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    titleFont: { size: 11 },
                    bodyFont: { size: 10 },
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            let value = context.parsed.y;
                            if (label.includes('CLS')) {
                                return `CLS: ${value.toFixed(3)}`;
                            }
                            return `${label}: ${Math.round(value)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 9 },
                        maxTicksLimit: 4,
                        maxRotation: 0
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Timing (ms)',
                        font: { size: 9 },
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: { size: 9 },
                        color: '#9ca3af'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    suggestedMax: 0.25,
                    title: {
                        display: true,
                        text: 'CLS Score',
                        font: { size: 9 },
                        color: '#9ca3af'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        font: { size: 9 },
                        color: '#9ca3af'
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
    if (aiMetricsChartInstance) {
        aiMetricsChartInstance.destroy();
        aiMetricsChartInstance = null;
    }
    if (aiComparisonChartInstance) {
        aiComparisonChartInstance.destroy();
        aiComparisonChartInstance = null;
    }
}

/**
 * Render AI Metrics Chart (Bar chart)
 */
export function renderAIMetricsChart(canvas, labels, scores, colors) {
    if (!canvas || !scores) return;

    // Destroy existing chart if any
    if (aiMetricsChartInstance) {
        aiMetricsChartInstance.destroy();
        aiMetricsChartInstance = null;
    }

    const ctx = canvas.getContext('2d');

    // Create bar chart for metrics
    aiMetricsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: scores,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.5', '1')),
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Score: ${context.parsed.y}/100`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        callback: function (value) {
                            return value;
                        }
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Render AI Comparison Chart
 */
export function renderAIComparisonChart(canvas, comparison) {
    if (!canvas || !comparison) return;

    // Destroy existing chart if any
    if (aiComparisonChartInstance) {
        aiComparisonChartInstance.destroy();
        aiComparisonChartInstance = null;
    }

    const ctx = canvas.getContext('2d');

    const labels = ['Your Score', 'Industry Average', 'Best Practice'];
    const scores = [
        comparison.yourScore || 0,
        comparison.industryAverage || 0,
        comparison.bestPractice || 0
    ];
    const colors = [
        'rgba(66, 133, 244, 0.8)',
        'rgba(158, 158, 158, 0.8)',
        'rgba(76, 175, 80, 0.8)'
    ];

    aiComparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: scores,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Score: ${context.parsed.y}/100`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        callback: function (value) {
                            return value;
                        }
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}