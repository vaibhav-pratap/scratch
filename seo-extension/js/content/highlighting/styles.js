/**
 * Highlighting styles module
 * Injects CSS for link highlighting
 */

/**
 * Inject CSS styles for link highlighting
 */
export function injectHighlightStyles() {
    if (document.getElementById('seo-analyzer-highlight-styles')) return;

    const style = document.createElement('style');
    style.id = 'seo-analyzer-highlight-styles';
    style.textContent = `
        /* SEO Analyzer Link Highlighting */
        a.seo-highlight-nofollow {
            outline: 2px dashed #ff6b6b !important;
            outline-offset: 2px !important;
            background-color: rgba(255, 107, 107, 0.1) !important;
        }
        a.seo-highlight-follow {
            outline: 2px solid #51cf66 !important;
            outline-offset: 2px !important;
            background-color: rgba(81, 207, 102, 0.1) !important;
        }
        a.seo-highlight-external {
            outline: 2px solid #339af0 !important;
            outline-offset: 2px !important;
            background-color: rgba(51, 154, 240, 0.1) !important;
        }
        a.seo-highlight-internal {
            outline: 2px solid #ffd43b !important;
            outline-offset: 2px !important;
            background-color: rgba(255, 212, 59, 0.1) !important;
        }
        a.seo-highlight-mailto {
            outline: 2px solid #ff6b9d !important;
            outline-offset: 2px !important;
            background-color: rgba(255, 107, 157, 0.1) !important;
        }
        a.seo-highlight-tel {
            outline: 2px solid #9775fa !important;
            outline-offset: 2px !important;
            background-color: rgba(151, 117, 250, 0.1) !important;
        }

        /* Image Highlighting */
        .seo-ext-highlight-image {
            outline: 4px solid #ff6b00 !important;
            outline-offset: 4px !important;
            box-shadow: 0 0 20px rgba(255, 107, 0, 0.6) !important;
            animation: imageHighlightPulse 1.5s ease-in-out infinite !important;
            position: relative !important;
            z-index: 999999 !important;
        }

        @keyframes imageHighlightPulse {
            0%, 100% {
                outline-color: #ff6b00;
                box-shadow: 0 0 20px rgba(255, 107, 0, 0.6);
            }
            50% {
                outline-color: #ff8c00;
                box-shadow: 0 0 30px rgba(255, 107, 0, 1);
            }
        }

        /* Content Quality Highlighting */
        .seo-ext-highlight-content {
            position: relative !important;
            z-index: 999998 !important;
            transition: all 0.3s ease !important;
        }

        /* Passive Voice */
        .seo-ext-highlight-passive-voice {
            outline: 3px solid #9775fa !important;
            outline-offset: 3px !important;
            background-color: rgba(151, 117, 250, 0.08) !important;
            animation: contentHighlightPulse 2s ease-in-out infinite !important;
        }

        /* Long Sentence */
        .seo-ext-highlight-long-sentence {
            outline: 3px solid #ff6b00 !important;
            outline-offset: 3px !important;
            background-color: rgba(255, 107, 0, 0.08) !important;
            animation: contentHighlightPulse 2s ease-in-out infinite !important;
        }

        /* Long Paragraph */
        .seo-ext-highlight-long-paragraph {
            outline: 3px solid #ffd43b !important;
            outline-offset: 3px !important;
            background-color: rgba(255, 212, 59, 0.08) !important;
            animation: contentHighlightPulse 2s ease-in-out infinite !important;
        }

        /* No Transition Words */
        .seo-ext-highlight-no-transition {
            outline: 3px solid #339af0 !important;
            outline-offset: 3px !important;
            background-color: rgba(51, 154, 240, 0.08) !important;
            animation: contentHighlightPulse 2s ease-in-out infinite !important;
        }

        @keyframes contentHighlightPulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.7;
            }
        }

        /* Tooltip for highlighted content */
        .seo-ext-highlight-content::before {
            content: attr(data-seo-issue);
            position: absolute;
            top: -30px;
            left: 0;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            z-index: 999999;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            text-transform: capitalize;
        }

        .seo-ext-highlight-content:hover::before {
            opacity: 1;
        }

        /* Generic Element Highlighting (Overlays) */
        .seo-ext-highlight-overlay {
            position: absolute !important;
            pointer-events: none !important;
            z-index: 2147483647 !important; /* Max z-index */
            background-color: rgba(26, 115, 232, 0.25) !important;
            border: 2px solid #1a73e8 !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8), 0 0 15px rgba(26, 115, 232, 0.6) !important;
            border-radius: 4px !important;
            animation: seo-pulse-overlay 2s infinite !important;
            transition: opacity 0.3s ease !important;
        }

        .seo-ext-highlight-label {
            position: absolute !important;
            bottom: 100% !important;
            left: 0 !important;
            background-color: #1a73e8 !important;
            color: white !important;
            padding: 4px 12px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            border-radius: 4px 4px 0 0 !important;
            white-space: nowrap !important;
            margin-bottom: 2px !important;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2) !important;
            z-index: 2147483647 !important;
        }

        @keyframes seo-pulse-overlay {
            0%, 100% {
                background-color: rgba(26, 115, 232, 0.25);
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8), 0 0 15px rgba(26, 115, 232, 0.6);
            }
            50% {
                background-color: rgba(26, 115, 232, 0.4);
                box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9), 0 0 25px rgba(26, 115, 232, 0.8);
            }
        }
    `;
    document.head.appendChild(style);
}
