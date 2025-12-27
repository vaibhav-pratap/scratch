/**
 * Data exporters module
 * Functions for exporting SEO data in various formats
 */

import { collectAllData } from './exporters/export-manager.js';
import { generatePDF } from './exporters/pdf-generator.js';
import { generateExcel } from './exporters/excel-generator.js';

/**
 * Main download function
 * Orchestrates data collection and format-specific generation
 */
export async function downloadData(coreData, format) {
    console.log(`[Exporters] Initiating ${format} download...`);

    try {
        // 1. Collect all available data from various modules
        const fullData = await collectAllData(coreData);
        console.log('[Exporters] Data collected:', fullData);

        // 2. Delegate to specific generator
        switch (format) {
            case 'pdf':
                generatePDF(fullData);
                break;
            case 'excel':
                generateExcel(fullData);
                break;
            case 'csv':
                _downloadCSV(fullData);
                break;
            default:
                _downloadJSON(fullData);
                break;
        }

    } catch (error) {
        console.error('[Exporters] Export failed:', error);
        alert('Export failed. See console for details.');
    }
}

// Wrappers matching sidepanel.js expectations
export const downloadPDF = (data) => downloadData(data, 'pdf');
export const downloadExcel = (data) => downloadData(data, 'excel');
export const downloadCSV = (data) => downloadData(data, 'csv');
export const downloadJSON = (data) => downloadData(data, 'json');

/**
 * Helper: Download data as JSON
 */
function _downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Helper: Download data as CSV (Simple flat fallback)
 */
function _downloadCSV(data) {
    const { XLSX } = window;
    if (!XLSX) {
        console.error('XLSX library not found');
        return;
    }

    try {
        // Helper to flatten basic properties for CSV
        const flatData = {
            url: data.url,
            title: data.title,
            description: data.description,
            score: data.score,
            meta_title: data.meta?.title?.value,
            meta_description: data.meta?.description?.value,
            cwv_lcp: data.cwv?.lcp?.value,
            cwv_cls: data.cwv?.cls?.value,
            cwv_inp: data.cwv?.inp?.value,
            text_word_count: data.content?.wordCount,
            // Add other core fields as needed
        };

        const ws = XLSX.utils.json_to_sheet([flatData]);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seo-data-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        console.error('CSV export failed', e);
        _downloadJSON(data);
    }
}