/**
 * Export Manager
 * Aggregates data from various sources for comprehensive reporting
 */

import { getKeywordsData } from '../../services/keywords.js';
import { getLastAnalysis } from '../renderers/ai-analysis.js';

export async function collectAllData(coreData) {
    console.log('[ExportManager] Collecting comprehensive data...');

    // 1. Start with core SEO data (Meta, CWV, Headings, Images, Links, Schema, Tech, etc.)
    const fullData = {
        ...coreData,
        exportDate: new Date().toISOString(),
        keywords: {
            performance: null,
            planner: [],
            trends: []
        },
        aiAnalysis: null
    };

    // 2. Fetch Keywords Performance Data (GSC)
    try {
        const keywordsState = getKeywordsData();
        if (keywordsState) {
            fullData.keywords.performance = {
                domain: keywordsState.domain,
                dateRange: keywordsState.dateRange,
                queries: keywordsState.queries,
                pages: keywordsState.pages,
                totals: keywordsState.totals
            };
        }
    } catch (e) {
        console.warn('[ExportManager] Could not collect keywords performance data:', e);
    }

    // 3. Fetch AI Analysis Data
    try {
        const aiData = getLastAnalysis();
        if (aiData) {
            fullData.aiAnalysis = aiData;
        }
    } catch (e) {
        console.warn('[ExportManager] Could not collect AI data:', e);
    }

    return fullData;
}
