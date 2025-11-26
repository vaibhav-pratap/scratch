/**
 * Comprehensive Technology Stack Detector
 * Detects 200+ technologies across multiple categories
 * Enhanced version with expanded detection coverage
 */

/**
 * Detect all technologies used on the page
 * Returns categorized list of technologies
 */
export function detectTechStack() {
    const techStack = {
        cms: detectCMS(),
        frameworks: detectFrameworks(),
        libraries: detectLibraries(),
        uiFrameworks: detectUIFrameworks(),
        analytics: detectAnalytics(),
        ecommerce: detectEcommerce(),
        cdn: detectCDN(),
        fonts: detectFonts(),
        advertising: detectAdvertising(),
        seo: detectSEOTools(),
        server: detectServerTech(),
        security: detectSecurity(),
        language: detectLanguageIndicators(),
        payment: detectPaymentProcessors(),
        communication: detectCommunication(),
        media: detectMedia(),
        buildTools: detectBuildTools(),
        hosting: detectHosting(),
        social: detectSocialIntegrations()
    };

    // Filter out empty categories
    return Object.fromEntries(
        Object.entries(techStack).filter(([_, value]) => value.length > 0)
    );
}

/**
 * Detect CMS platforms (expanded)
 */
function detectCMS() {
    const detected = [];

    // WordPress
    if (document.querySelector('meta[name="generator"][content*="WordPress"]') ||
        document.querySelector('link[href*="wp-content"]') ||
        document.querySelector('script[src*="wp-includes"]') ||
        document.querySelector('link[href*="wp-includes"]') ||
        document.body.classList.contains('wordpress') ||
        window.wp) {
        const version = getMetaContent('generator', 'WordPress');
        detected.push({ name: 'WordPress', version });
    }

    // Shopify
    if (document.querySelector('meta[name="shopify-digital-wallet"]') ||
        document.querySelector('script[src*="cdn.shopify.com"]') ||
        window.Shopify) {
        detected.push({ name: 'Shopify' });
    }

    // Wix
    if (document.querySelector('meta[name="generator"][content*="Wix"]') ||
        window.wixBiSession) {
        detected.push({ name: 'Wix' });
    }

    // Squarespace
    if (document.querySelector('meta[name="generator"][content*="Squarespace"]') ||
        window.Squarespace) {
        detected.push({ name: 'Squarespace' });
    }

    // Webflow
    if (document.querySelector('meta[name="generator"][content*="Webflow"]') ||
        document.querySelector('script[src*="webflow"]')) {
        detected.push({ name: 'Webflow' });
    }

    // Joomla
    if (document.querySelector('meta[name="generator"][content*="Joomla"]') ||
        document.querySelector('script[src*="/media/joomla/"]') ||
        window.Joomla) {
        const version = getMetaContent('generator', 'Joomla');
        detected.push({ name: 'Joomla', version });
    }

    // Drupal
    if (document.querySelector('meta[name="generator"][content*="Drupal"]') ||
        window.Drupal ||
        document.querySelector('script[src*="drupal"]')) {
        const version = getMetaContent('generator', 'Drupal');
        detected.push({ name: 'Drupal', version });
    }

    // Magento
    if (document.querySelector('script[src*="mage/"]') ||
        window.Magento ||
        document.body.classList.contains('cms-index-index')) {
        detected.push({ name: 'Magento' });
    }

    // PrestaShop
    if (document.querySelector('meta[name="generator"][content*="PrestaShop"]') ||
        window.prestashop) {
        detected.push({ name: 'PrestaShop' });
    }

    // Ghost
    if (document.querySelector('meta[name="generator"][content*="Ghost"]')) {
        const version = getMetaContent('generator', 'Ghost');
        detected.push({ name: 'Ghost', version });
    }

    // Adobe Experience Manager
    if (window.Granite || document.querySelector('script[src*="/etc.clientlibs/"]')) {
        detected.push({ name: 'Adobe Experience Manager' });
    }

    // Contentful
    if (document.querySelector('meta[name="generator"][content*="Contentful"]')) {
        detected.push({ name: 'Contentful' });
    }

    // HubSpot CMS
    if (document.querySelector('script[src*="hubspot"]') ||
        window._hsq ||
        document.querySelector('meta[name="generator"][content*="HubSpot"]')) {
        detected.push({ name: 'HubSpot CMS' });
    }

    // Blogger
    if (document.querySelector('meta[name="generator"][content*="Blogger"]')) {
        detected.push({ name: 'Blogger' });
    }

    // Medium
    if (window.__APOLLO_STATE__ && window.location.hostname.includes('medium')) {
        detected.push({ name: 'Medium' });
    }

    // Notion
    if (window.location.hostname.includes('notion.site') || window.notion) {
        detected.push({ name: 'Notion' });
    }

    return detected;
}

/**
 * Detect JavaScript frameworks (expanded)
 */
function detectFrameworks() {
    const detected = [];

    // React
    if (window.React ||
        document.querySelector('[data-reactroot]') ||
        document.querySelector('[data-reactid]') ||
        document.querySelector('[data-react-helmet]') ||
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const version = window.React?.version;
        detected.push({ name: 'React', version });
    }

    // Next.js
    if (window.__NEXT_DATA__ ||
        document.querySelector('script[src*="_next"]') ||
        document.getElementById('__next')) {
        const buildId = window.__NEXT_DATA__?.buildId;
        detected.push({ name: 'Next.js', version: buildId ? undefined : undefined });
    }

    // Gatsby
    if (window.___gatsby ||
        document.querySelector('meta[name="generator"][content*="Gatsby"]') ||
        document.getElementById('___gatsby')) {
        detected.push({ name: 'Gatsby' });
    }

    // Vue.js
    if (window.Vue ||
        document.querySelector('[data-v-]') ||
        document.querySelector('[v-cloak]')) {
        const version = window.Vue?.version;
        detected.push({ name: 'Vue.js', version });
    }

    // Nuxt.js
    if (window.__NUXT__ ||
        document.querySelector('#__nuxt') ||
        document.querySelector('#__layout')) {
        detected.push({ name: 'Nuxt.js' });
    }

    // Angular
    if (window.ng ||
        window.getAllAngularRootElements ||
        document.querySelector('[ng-version]') ||
        window.angular) {
        const ngVersion = document.querySelector('[ng-version]')?.getAttribute('ng-version');
        detected.push({ name: 'Angular', version: ngVersion });
    }

    // AngularJS (legacy)
    if (window.angular && !window.ng) {
        const version = window.angular.version?.full;
        detected.push({ name: 'AngularJS', version });
    }

    // Svelte
    if (document.querySelector('[class*="svelte-"]')) {
        detected.push({ name: 'Svelte' });
    }

    // SvelteKit
    if (window.__sveltekit ||
        document.querySelector('script[src*="sveltekit"]')) {
        detected.push({ name: 'SvelteKit' });
    }

    // Ember.js
    if (window.Ember) {
        const version = window.Ember.VERSION;
        detected.push({ name: 'Ember.js', version });
    }

    // Backbone.js
    if (window.Backbone) {
        const version = window.Backbone.VERSION;
        detected.push({ name: 'Backbone.js', version });
    }

    // Meteor
    if (window.Meteor) {
        detected.push({ name: 'Meteor' });
    }

    // Polymer
    if (window.Polymer) {
        const version = window.Polymer.version;
        detected.push({ name: 'Polymer', version });
    }

    // Alpine.js
    if (window.Alpine ||
        document.querySelector('[x-data]') ||
        document.querySelector('[x-cloak]')) {
        detected.push({ name: 'Alpine.js' });
    }

    // Preact
    if (window.preact) {
        detected.push({ name: 'Preact' });
    }

    // Lit
    if (window.litHtml) {
        detected.push({ name: 'Lit' });
    }

    // Astro
    if (document.querySelector('script[type="module"][src*="astro"]')) {
        detected.push({ name: 'Astro' });
    }

    // Remix
    if (window.__remixContext) {
        detected.push({ name: 'Remix' });
    }

    // SolidJS
    if (window.solid) {
        detected.push({ name: 'SolidJS' });
    }

    return detected;
}

/**
 * Detect UI Frameworks & Component Libraries
 */
function detectUIFrameworks() {
    const detected = [];

    // Bootstrap
    if (document.querySelector('link[href*="bootstrap"]') ||
        document.querySelector('script[src*="bootstrap"]') ||
        document.querySelector('.container-fluid') ||
        window.bootstrap) {
        detected.push({ name: 'Bootstrap' });
    }

    // Tailwind CSS
    if (document.querySelector('script[src*="tailwind"]') ||
        document.documentElement.classList.toString().match(/\b(flex|grid|pt-|mt-|px-|mx-)\d/)) {
        detected.push({ name: 'Tailwind CSS' });
    }

    // Material-UI / MUI
    if (document.querySelector('[class*="MuiBox"]') ||
        document.querySelector('[class*="MuiButton"]') ||
        window.mui) {
        detected.push({ name: 'Material-UI' });
    }

    // Ant Design
    if (document.querySelector('[class*="ant-"]') ||
        document.querySelector('link[href*="antd"]')) {
        detected.push({ name: 'Ant Design' });
    }

    // Chakra UI
    if (document.querySelector('[class*="chakra-"]')) {
        detected.push({ name: 'Chakra UI' });
    }

    // Semantic UI
    if (document.querySelector('link[href*="semantic"]') ||
        document.querySelector('.ui.container')) {
        detected.push({ name: 'Semantic UI' });
    }

    // Foundation
    if (document.querySelector('link[href*="foundation"]') ||
        window.Foundation) {
        detected.push({ name: 'Foundation' });
    }

    // Bulma
    if (document.querySelector('link[href*="bulma"]') ||
        document.querySelector('.section.hero')) {
        detected.push({ name: 'Bulma' });
    }

    // Materialize
    if (window.M || document.querySelector('script[src*="materialize"]')) {
        detected.push({ name: 'Materialize' });
    }

    // shadcn/ui
    if (document.querySelector('[class*="radix-"]')) {
        detected.push({ name: 'shadcn/ui' });
    }

    return detected;
}

/**
 * Detect JavaScript libraries (expanded)
 */
function detectLibraries() {
    const detected = [];

    // jQuery
    if (window.jQuery || window.$?.fn?.jquery) {
        const version = window.jQuery?.fn?.jquery || window.$?.fn?.jquery;
        detected.push({ name: 'jQuery', version });
    }

    // jQuery UI
    if (window.jQuery?.ui) {
        const version = window.jQuery.ui.version;
        detected.push({ name: 'jQuery UI', version });
    }

    // Lodash
    if (window._ && window._.VERSION) {
        detected.push({ name: 'Lodash', version: window._.VERSION });
    }

    // Underscore
    if (window._ && !window._.VERSION) {
        detected.push({ name: 'Underscore.js' });
    }

    // Moment.js
    if (window.moment) {
        const version = window.moment.version;
        detected.push({ name: 'Moment.js', version });
    }

    // Day.js
    if (window.dayjs) {
        detected.push({ name: 'Day.js' });
    }

    // date-fns
    if (window.dateFns) {
        detected.push({ name: 'date-fns' });
    }

    // Axios
    if (window.axios) {
        detected.push({ name: 'Axios' });
    }

    // GSAP
    if (window.gsap) {
        const version = window.gsap.version;
        detected.push({ name: 'GSAP', version });
    }

    // Three.js
    if (window.THREE) {
        const version = window.THREE.REVISION;
        detected.push({ name: 'Three.js', version: version ? `r${version}` : undefined });
    }

    // Chart.js
    if (window.Chart) {
        const version = window.Chart.version;
        detected.push({ name: 'Chart.js', version });
    }

    // D3.js
    if (window.d3) {
        const version = window.d3.version;
        detected.push({ name: 'D3.js', version });
    }

    // Anime.js
    if (window.anime) {
        detected.push({ name: 'Anime.js' });
    }

    // ScrollReveal
    if (window.ScrollReveal) {
        detected.push({ name: 'ScrollReveal' });
    }

    // AOS (Animate On Scroll)
    if (window.AOS || document.querySelector('[data-aos]')) {
        detected.push({ name: 'AOS' });
    }

    // Swiper
    if (window.Swiper || document.querySelector('.swiper-container')) {
        detected.push({ name: 'Swiper' });
    }

    // Slick Carousel
    if (window.Slick || document.querySelector('.slick-slider')) {
        detected.push({ name: 'Slick' });
    }

    // Owl Carousel
    if (window.OwlCarousel || document.querySelector('.owl-carousel')) {
        detected.push({ name: 'Owl Carousel' });
    }

    // Intersection Observer polyfill
    if (window.IntersectionObserver && window.IntersectionObserver.toString().includes('polyfill')) {
        detected.push({ name: 'IntersectionObserver Polyfill' });
    }

    return detected;
}

/**
 * Detect analytics and tracking tools (expanded)
 */
function detectAnalytics() {
    const detected = [];

    // Google Analytics
    if (window.ga || window.gtag ||
        document.querySelector('script[src*="google-analytics.com"]') ||
        document.querySelector('script[src*="googletagmanager.com/gtag"]') ||
        window.GoogleAnalyticsObject) {
        detected.push({ name: 'Google Analytics' });
    }

    // Google Tag Manager
    if (window.google_tag_manager ||
        window.dataLayer ||
        document.querySelector('script[src*="googletagmanager.com/gtm"]')) {
        detected.push({ name: 'Google Tag Manager' });
    }

    // Google Analytics 4
    if (window.gtag && document.querySelector('script[src*="gtag/js"]')) {
        detected.push({ name: 'Google Analytics 4' });
    }

    // Facebook Pixel
    if (window.fbq ||
        document.querySelector('script[src*="connect.facebook.net"]')) {
        detected.push({ name: 'Facebook Pixel' });
    }

    // Hotjar
    if (window.hj ||
        document.querySelector('script[src*="hotjar"]')) {
        detected.push({ name: 'Hotjar' });
    }

    // Mixpanel
    if (window.mixpanel) {
        detected.push({ name: 'Mixpanel' });
    }

    // Segment
    if (window.analytics && window.analytics.page) {
        detected.push({ name: 'Segment' });
    }

    // Matomo (Piwik)
    if (window._paq || window.Piwik) {
        detected.push({ name: 'Matomo' });
    }

    // Amplitude
    if (window.amplitude) {
        detected.push({ name: 'Amplitude' });
    }

    // Heap Analytics
    if (window.heap) {
        detected.push({ name: 'Heap' });
    }

    // Crazy Egg
    if (window.CE2 || document.querySelector('script[src*="crazyegg"]')) {
        detected.push({ name: 'Crazy Egg' });
    }

    // Clicky
    if (window.clicky || document.querySelector('script[src*="static.getclicky.com"]')) {
        detected.push({ name: 'Clicky' });
    }

    // Plausible
    if (document.querySelector('script[src*="plausible.io"]')) {
        detected.push({ name: 'Plausible' });
    }

    // Fathom
    if (document.querySelector('script[src*="fathom"]')) {
        detected.push({ name: 'Fathom' });
    }

    // Adobe Analytics
    if (window.s_gi || window.AppMeasurement) {
        detected.push({ name: 'Adobe Analytics' });
    }

    return detected;
}

/**
 * Detect e-commerce platforms (expanded)
 */
function detectEcommerce() {
    const detected = [];

    // WooCommerce
    if (document.querySelector('script[src*="woocommerce"]') ||
        document.querySelector('link[href*="woocommerce"]') ||
        document.body.classList.contains('woocommerce') ||
        window.wc_add_to_cart_params) {
        detected.push({ name: 'WooCommerce' });
    }

    // Shopify (if not already in CMS)
    if (window.Shopify && !detected.find(t => t.name === 'Shopify')) {
        detected.push({ name: 'Shopify' });
    }

    // BigCommerce
    if (document.querySelector('script[src*="bigcommerce"]')) {
        detected.push({ name: 'BigCommerce' });
    }

    // Magento (if not in CMS)
    if (window.Magento) {
        detected.push({ name: 'Magento' });
    }

    // OpenCart
    if (window.opencart || document.querySelector('link[href*="opencart"]')) {
        detected.push({ name: 'OpenCart' });
    }

    // Salesforce Commerce Cloud
    if (window.SiteGenesis || document.querySelector('script[src*="demandware"]')) {
        detected.push({ name: 'Salesforce Commerce Cloud' });
    }

    // SAP Commerce Cloud (Hybris)
    if (document.querySelector('script[src*="hybris"]')) {
        detected.push({ name: 'SAP Commerce Cloud' });
    }

    return detected;
}

/**
 * Detect CDN services (greatly expanded)
 */
function detectCDN() {
    const detected = new Set();

    // Check all scripts and links
    const resources = [
        ...Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
        ...Array.from(document.querySelectorAll('link[href]')).map(l => l.href),
        ...Array.from(document.querySelectorAll('img[src]')).map(i => i.src)
    ];

    resources.forEach(url => {
        // Cloudflare
        if (url.includes('cloudflare') ||
            url.includes('cdnjs.cloudflare.com')) {
            detected.add('Cloudflare');
        }

        // Fastly
        if (url.includes('fastly')) {
            detected.add('Fastly');
        }

        // Amazon CloudFront
        if (url.includes('cloudfront.net')) {
            detected.add('Amazon CloudFront');
        }

        // Akamai
        if (url.includes('akamai')) {
            detected.add('Akamai');
        }

        // jsDelivr
        if (url.includes('jsdelivr.net')) {
            detected.add('jsDelivr');
        }

        // unpkg
        if (url.includes('unpkg.com')) {
            detected.add('unpkg');
        }

        // Google CDN
        if (url.includes('ajax.googleapis.com') ||
            url.includes('gstatic.com')) {
            detected.add('Google CDN');
        }

        // Microsoft Azure CDN
        if (url.includes('azureedge.net')) {
            detected.add('Azure CDN');
        }

        // StackPath (MaxCDN)
        if (url.includes('stackpath') || url.includes('maxcdn')) {
            detected.add('StackPath');
        }

        // KeyCDN
        if (url.includes('keycdn')) {
            detected.add('KeyCDN');
        }

        // BunnyCDN
        if (url.includes('bunnycdn')) {
            detected.add('BunnyCDN');
        }

        // Imperva (Incapsula)
        if (url.includes('incapsula')) {
            detected.add('Imperva');
        }
    });

    // Check cookies for CDN indicators
    if (document.cookie.includes('__cfduid') || document.cookie.includes('__cf_bm')) {
        detected.add('Cloudflare');
    }

    return Array.from(detected).map(name => ({ name }));
}

/**
 * Detect font services (expanded)
 */
function detectFonts() {
    const detected = [];

    // Google Fonts
    if (document.querySelector('link[href*="fonts.googleapis.com"]') ||
        document.querySelector('link[href*="fonts.gstatic.com"]')) {
        detected.push({ name: 'Google Fonts' });
    }

    // Google Sans (Specific check)
    if (document.fonts && Array.from(document.fonts).some(f => f.family.includes('Google Sans'))) {
        detected.push({ name: 'Google Sans' });
    }

    // Adobe Fonts (Typekit)
    if (document.querySelector('link[href*="use.typekit.net"]') ||
        document.querySelector('script[src*="use.typekit.net"]')) {
        detected.push({ name: 'Adobe Fonts' });
    }

    // Font Awesome
    if (document.querySelector('link[href*="font-awesome"]') ||
        document.querySelector('script[src*="fontawesome"]') ||
        document.querySelector('[class*="fa-"]')) {
        detected.push({ name: 'Font Awesome' });
    }

    // Google Material Icons
    if (document.querySelector('link[href*="fonts.googleapis.com/icon"]') ||
        document.querySelector('.material-icons')) {
        detected.push({ name: 'Material Icons' });
    }

    // Ionicons
    if (document.querySelector('script[src*="ionicons"]') ||
        document.querySelector('[class*="ion-icon"]')) {
        detected.push({ name: 'Ionicons' });
    }

    return detected;
}

/**
 * Detect advertising platforms (expanded)
 */
function detectAdvertising() {
    const detected = [];

    // Google AdSense
    if (document.querySelector('script[src*="googlesyndication.com"]') ||
        window.adsbygoogle) {
        detected.push({ name: 'Google AdSense' });
    }

    // Google Ads
    if (document.querySelector('script[src*="googleadservices.com"]')) {
        detected.push({ name: 'Google Ads' });
    }

    // DoubleClick
    if (document.querySelector('script[src*="doubleclick.net"]')) {
        detected.push({ name: 'DoubleClick' });
    }

    // Taboola
    if (window._taboola || document.querySelector('script[src*="taboola"]')) {
        detected.push({ name: 'Taboola' });
    }

    // Outbrain
    if (window.OBR || document.querySelector('script[src*="outbrain"]')) {
        detected.push({ name: 'Outbrain' });
    }

    // Media.net
    if (document.querySelector('script[src*="media.net"]')) {
        detected.push({ name: 'Media.net' });
    }

    return detected;
}

/**
 * Detect SEO tools and plugins (same as before)
 */
function detectSEOTools() {
    const detected = [];

    // Yoast SEO
    if (document.querySelector('meta[name="generator"][content*="Yoast"]') ||
        document.querySelector('script[src*="yoast"]') ||
        document.querySelector('link[href*="yoast"]')) {
        detected.push({ name: 'Yoast SEO' });
    }

    // Rank Math
    if (document.querySelector('meta[name="generator"][content*="Rank Math"]') ||
        document.querySelector('script[src*="rank-math"]')) {
        detected.push({ name: 'Rank Math' });
    }

    // All in One SEO
    if (document.querySelector('meta[name="generator"][content*="All in One SEO"]') ||
        document.querySelector('script[src*="all-in-one-seo"]')) {
        detected.push({ name: 'All in One SEO' });
    }

    // SEOPress
    if (document.querySelector('meta[name="generator"][content*="SEOPress"]') ||
        document.querySelector('script[src*="seopress"]')) {
        detected.push({ name: 'SEOPress' });
    }

    // The SEO Framework
    if (document.querySelector('meta[name="generator"][content*="The SEO Framework"]')) {
        detected.push({ name: 'The SEO Framework' });
    }

    return detected;
}

/**
 * Detect server technologies and hosting
 */
function detectServerTech() {
    const detected = [];

    // Vercel
    if (document.querySelector('meta[name="next-head-count"]') ||
        window.__NEXT_DATA__) {
        detected.push({ name: 'Vercel' });
    }

    // Netlify
    if (document.querySelector('meta[name="generator"][content*="Netlify"]')) {
        detected.push({ name: 'Netlify' });
    }

    // GitHub Pages
    if (window.location.hostname.includes('github.io')) {
        detected.push({ name: 'GitHub Pages' });
    }

    // Amazon S3
    if (window.location.hostname.includes('s3.amazonaws.com') ||
        window.location.hostname.includes('s3-website')) {
        detected.push({ name: 'Amazon S3' });
    }

    return detected;
}

/**
 * Detect security and SSL/TLS information (Enhanced)
 */
function detectSecurity() {
    const detected = [];

    // HTTPS
    if (window.location.protocol === 'https:') {
        detected.push({ name: 'HTTPS', version: null });

        // Enhanced TLS Detection
        try {
            const perfEntries = performance.getEntriesByType('navigation');
            if (perfEntries.length > 0) {
                const entry = perfEntries[0];
                if (entry.secureConnectionStart > 0) {
                    // TLS is enabled - try to get version from SecurityInfo API
                    // Note: Actual TLS version requires background script with webRequest API
                    // For now, indicate TLS 1.2+ is likely (modern browsers requirement)
                    detected.push({ name: 'TLS 1.2+', version: null });

                    // Add SSL certificate indicator
                    detected.push({ name: 'SSL Certificate', version: 'Valid' });
                }
            }
        } catch (e) {
            // Fallback - just indicate TLS is likely present
            detected.push({ name: 'TLS Enabled', version: null });
        }

        // Check for HSTS
        try {
            // Can't directly access headers from client-side, but can check meta tag
            const hstsTag = document.querySelector('meta[http-equiv="Strict-Transport-Security"]');
            if (hstsTag) {
                detected.push({ name: 'HSTS', version: null });
            }
        } catch (e) { }
    }

    // reCAPTCHA
    if (window.grecaptcha || document.querySelector('.g-recaptcha')) {
        const version = window.grecaptcha?.enterprise ? 'Enterprise' :
            document.querySelector('[data-sitekey]')?.getAttribute('data-size') === 'invisible' ? 'v3' : 'v2';
        detected.push({ name: 'reCAPTCHA', version });
    }

    // hCaptcha
    if (window.hcaptcha || document.querySelector('.h-captcha')) {
        detected.push({ name: 'hCaptcha', version: null });
    }

    // Cloudflare Turnstile
    if (document.querySelector('script[src*="challenges.cloudflare.com"]') ||
        document.querySelector('.cf-turnstile')) {
        detected.push({ name: 'Cloudflare Turnstile', version: null });
    }

    // Content Security Policy
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
        detected.push({ name: 'CSP', version: 'Enabled' });
    }

    return detected;
}

/**
 * Detect programming language indicators (limited client-side)
 */
function detectLanguageIndicators() {
    const detected = [];

    // PHP indicators
    if (document.querySelector('meta[name="generator"][content*="PHP"]') ||
        window.location.href.includes('.php') ||
        document.querySelector('input[name="PHPSESSID"]')) {
        detected.push({ name: 'PHP' });
    }

    // ASP.NET
    if (document.querySelector('input[name="__VIEWSTATE"]') ||
        document.querySelector('meta[name="generator"][content*="ASP.NET"]')) {
        detected.push({ name: 'ASP.NET' });
    }

    // Ruby on Rails
    if (document.querySelector('meta[name="csrf-param"]') ||
        document.querySelector('meta[name="csrf-token"]')) {
        detected.push({ name: 'Ruby on Rails' });
    }

    // Django
    if (document.querySelector('input[name="csrfmiddlewaretoken"]')) {
        detected.push({ name: 'Django (Python)' });
    }

    // Laravel
    if (document.querySelector('meta[name="csrf-token"]') &&
        document.querySelector('script[src*="laravel"]')) {
        detected.push({ name: 'Laravel (PHP)' });
    }

    // Express.js
    if (document.querySelector('meta[name="generator"][content*="Express"]')) {
        detected.push({ name: 'Express.js (Node.js)' });
    }

    return detected;
}

/**
 * Detect payment processors
 */
function detectPaymentProcessors() {
    const detected = [];

    // Stripe
    if (window.Stripe || document.querySelector('script[src*="stripe.com"]')) {
        detected.push({ name: 'Stripe' });
    }

    // PayPal
    if (window.paypal || document.querySelector('script[src*="paypal"]')) {
        detected.push({ name: 'PayPal' });
    }

    // Square
    if (window.Square || document.querySelector('script[src*="squareup.com"]')) {
        detected.push({ name: 'Square' });
    }

    // Braintree
    if (window.braintree) {
        detected.push({ name: 'Braintree' });
    }

    // Klarna
    if (window.Klarna || document.querySelector('script[src*="klarna"]')) {
        detected.push({ name: 'Klarna' });
    }

    // Razorpay
    if (window.Razorpay) {
        detected.push({ name: 'Razorpay' });
    }

    return detected;
}

/**
 * Detect communication tools (chat, email, etc.)
 */
function detectCommunication() {
    const detected = [];

    // Intercom
    if (window.Intercom || document.querySelector('script[src*="intercom"]')) {
        detected.push({ name: 'Intercom' });
    }

    // Drift
    if (window.drift || document.querySelector('script[src*="drift"]')) {
        detected.push({ name: 'Drift' });
    }

    // Zendesk
    if (window.zE || document.querySelector('script[src*="zendesk"]')) {
        detected.push({ name: 'Zendesk' });
    }

    // LiveChat
    if (window.LiveChatWidget || document.querySelector('script[src*="livechatinc"]')) {
        detected.push({ name: 'LiveChat' });
    }

    // Tawk.to
    if (window.Tawk_API) {
        detected.push({ name: 'Tawk.to' });
    }

    // Crisp
    if (window.$crisp) {
        detected.push({ name: 'Crisp' });
    }

    // Freshchat
    if (window.fcWidget) {
        detected.push({ name: 'Freshchat' });
    }

    // HubSpot Chat
    if (window.HubSpotConversations) {
        detected.push({ name: 'HubSpot Chat' });
    }

    return detected;
}

/**
 * Detect media platforms
 */
function detectMedia() {
    const detected = [];

    // YouTube
    if (document.querySelector('iframe[src*="youtube.com"]') ||
        document.querySelector('iframe[src*="youtu.be"]')) {
        detected.push({ name: 'YouTube' });
    }

    // Vimeo
    if (document.querySelector('iframe[src*="vimeo.com"]') ||
        window.Vimeo) {
        detected.push({ name: 'Vimeo' });
    }

    // Wistia
    if (window.Wistia || document.querySelector('script[src*="wistia"]')) {
        detected.push({ name: 'Wistia' });
    }

    // Brightcove
    if (window.bc || document.querySelector('script[src*="brightcove"]')) {
        detected.push({ name: 'Brightcove' });
    }

    // SoundCloud
    if (document.querySelector('iframe[src*="soundcloud"]')) {
        detected.push({ name: 'SoundCloud' });
    }

    // Spotify
    if (document.querySelector('iframe[src*="spotify.com"]')) {
        detected.push({ name: 'Spotify' });
    }

    // Google Maps
    if (document.querySelector('script[src*="maps.googleapis.com"]') ||
        window.google?.maps) {
        detected.push({ name: 'Google Maps' });
    }

    // Mapbox
    if (window.mapboxgl || document.querySelector('script[src*="mapbox"]')) {
        detected.push({ name: 'Mapbox' });
    }

    // Leaflet
    if (window.L && window.L.version) {
        detected.push({ name: 'Leaflet' });
    }

    return detected;
}

/**
 * Detect build tools and bundlers
 */
function detectBuildTools() {
    const detected = [];

    // Webpack
    if (window.webpackJsonp || window.__webpack_require__) {
        detected.push({ name: 'Webpack' });
    }

    // Vite
    if (document.querySelector('script[type="module"][src*="/@vite"]')) {
        detected.push({ name: 'Vite' });
    }

    // Parcel
    if (document.querySelector('script[src*="parcel"]')) {
        detected.push({ name: 'Parcel' });
    }

    // Rollup
    if (window.__rollup__) {
        detected.push({ name: 'Rollup' });
    }

    return detected;
}

/**
 * Detect hosting providers and cloud platforms (Enhanced)
 */
function detectHosting() {
    const detected = [];

    const hostname = window.location.hostname;
    const href = window.location.href;

    // Collect all resource URLs for analysis
    const resources = [
        ...Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
        ...Array.from(document.querySelectorAll('link[href]')).map(l => l.href),
        ...Array.from(document.querySelectorAll('img[src]')).map(i => i.src)
    ];

    // AWS (Amazon Web Services)
    const awsPatterns = [
        'amazonaws.com',
        'cloudfront.net',
        's3.amazonaws',
        's3-website',
        'aws.amazon.com',
        'elasticbeanstalk.com',
        'awsapps.com',
        'amplifyapp.com',
        'execute-api',
        'lambda-url',
        'elb.amazonaws.com'
    ];

    if (awsPatterns.some(pattern => hostname.includes(pattern) ||
        resources.some(url => url.includes(pattern)))) {
        detected.push({ name: 'AWS (Amazon Web Services)', version: null });
    }

    // Google Cloud Platform (GCP)
    const gcpPatterns = [
        'appspot.com',
        'googleapis.com',
        'googleusercontent.com',
        'cloudfunctions.net',
        'run.app',
        'cloud.google.com',
        'firebase',
        'gcp.goog'
    ];

    if (gcpPatterns.some(pattern => hostname.includes(pattern) ||
        resources.some(url => url.includes(pattern)))) {
        detected.push({ name: 'Google Cloud Platform', version: null });
    }

    // Microsoft Azure
    const azurePatterns = [
        'azure.com',
        'azurewebsites.net',
        'azureedge.net',
        'cloudapp.azure.com',
        'blob.core.windows.net',
        'azure-api.net',
        'azurestaticapps.net'
    ];

    if (azurePatterns.some(pattern => hostname.includes(pattern) ||
        resources.some(url => url.includes(pattern)))) {
        detected.push({ name: 'Microsoft Azure', version: null });
    }

    // DigitalOcean
    const doPatterns = [
        'digitaloceanspaces.com',
        'ondigitalocean.app',
        'do-spaces',
        'digitalocean.com'
    ];

    if (doPatterns.some(pattern => hostname.includes(pattern) ||
        resources.some(url => url.includes(pattern)))) {
        detected.push({ name: 'DigitalOcean', version: null });
    }

    // Vercel
    if (hostname.includes('vercel.app') ||
        hostname.includes('vercel.com') ||
        window.__NEXT_DATA__ ||
        document.querySelector('meta[name="next-head-count"]')) {
        detected.push({ name: 'Vercel', version: null });
    }

    // Netlify
    if (hostname.includes('netlify.app') ||
        hostname.includes('netlify.com') ||
        document.querySelector('meta[name="generator"][content*="Netlify"]')) {
        detected.push({ name: 'Netlify', version: null });
    }

    // Heroku
    if (hostname.includes('herokuapp.com')) {
        detected.push({ name: 'Heroku', version: null });
    }

    // Firebase Hosting
    if (hostname.includes('firebaseapp.com') ||
        hostname.includes('web.app') ||
        window.firebase) {
        detected.push({ name: 'Firebase Hosting', version: null });
    }

    // GitHub Pages
    if (hostname.includes('github.io')) {
        detected.push({ name: 'GitHub Pages', version: null });
    }

    // GitLab Pages
    if (hostname.includes('gitlab.io')) {
        detected.push({ name: 'GitLab Pages', version: null });
    }

    // Cloudflare Pages
    if (hostname.includes('pages.dev')) {
        detected.push({ name: 'Cloudflare Pages', version: null });
    }

    // Render
    if (hostname.includes('onrender.com')) {
        detected.push({ name: 'Render', version: null });
    }

    // Fly.io
    if (hostname.includes('fly.dev') || hostname.includes('fly.io')) {
        detected.push({ name: 'Fly.io', version: null });
    }

    // Railway
    if (hostname.includes('railway.app')) {
        detected.push({ name: 'Railway', version: null });
    }

    // Cloudways
    if (resources.some(url => url.includes('cloudways'))) {
        detected.push({ name: 'Cloudways', version: null });
    }

    // WP Engine
    if (hostname.includes('wpengine.com') ||
        resources.some(url => url.includes('wpengine'))) {
        detected.push({ name: 'WP Engine', version: null });
    }

    // Kinsta
    if (hostname.includes('kinsta.cloud') ||
        resources.some(url => url.includes('kinstacdn'))) {
        detected.push({ name: 'Kinsta', version: null });
    }

    // Pantheon
    if (hostname.includes('pantheonsite.io')) {
        detected.push({ name: 'Pantheon', version: null });
    }

    // Platform.sh
    if (hostname.includes('platform.sh')) {
        detected.push({ name: 'Platform.sh', version: null });
    }

    return detected;
}

/**
 * Detect social media integrations
 */
function detectSocialIntegrations() {
    const detected = [];

    // Facebook SDK
    if (window.FB || document.querySelector('#fb-root')) {
        detected.push({ name: 'Facebook SDK' });
    }

    // Twitter/X Widget
    if (window.twttr || document.querySelector('script[src*="platform.twitter.com"]')) {
        detected.push({ name: 'Twitter Widget' });
    }

    // LinkedIn
    if (document.querySelector('script[src*="platform.linkedin.com"]')) {
        detected.push({ name: 'LinkedIn' });
    }

    // Instagram
    if (document.querySelector('script[src*="instagram.com/embed"]')) {
        detected.push({ name: 'Instagram Embed' });
    }

    // Pinterest
    if (document.querySelector('script[src*="pinterest.com"]')) {
        detected.push({ name: 'Pinterest' });
    }

    // AddThis
    if (window.addthis) {
        detected.push({ name: 'AddThis' });
    }

    // ShareThis
    if (window.__sharethis__) {
        detected.push({ name: 'ShareThis' });
    }

    return detected;
}

/**
 * Helper to extract version from meta generator tag
 */
function getMetaContent(name, contains) {
    const meta = document.querySelector(`meta[name="${name}"][content*="${contains}"]`);
    if (!meta) return undefined;

    const content = meta.getAttribute('content');
    const match = content.match(/[\d.]+/);
    return match ? match[0] : undefined;
}

/**
 * Legacy function for backward compatibility
 */
export function getSEOPlugins() {
    const techStack = detectTechStack();

    // Combine all detected technologies into a flat array
    const allTech = [];

    for (const [category, technologies] of Object.entries(techStack)) {
        technologies.forEach(tech => {
            const display = tech.version ? `${tech.name} ${tech.version}` : tech.name;
            allTech.push(display);
        });
    }

    return allTech;
}
