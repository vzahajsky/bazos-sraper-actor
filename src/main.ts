import { Actor, log } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { router } from './routes.js';
import { createStartQueryUrls, validateInput } from './utils.js';
import { CountryCode, Nullable, PhoneServiceConfig, SMSServiceConfig } from './types.js';
import { loadCookies, testCookies, clearCookies } from './services/bazos/cookieManager.js';
import { performVerificationWorkflow } from './workflows/verificationWorkflow.js';
import { TEST_AD_URL } from './const.js';
import type { BazosCookies } from './services/bazos/phoneVerification.js';

export interface Input {
    countryCode: CountryCode;
    searchQueries: string[];
    minPrice: Nullable<number>;
    maxPrice: Nullable<number>;
    postalCode: Nullable<number>;
    distance: Nullable<number>;
    maxRequestsPerCrawl: number;
    
    // Manual cookies (recommended - replaces auto-verification)
    bid?: string; // User ID (8-digit number)
    bkod?: string; // Auth token (10-char alphanumeric) - SECRET
    testcookie?: string; // Feature flag (default: "ano")
    
    // Phone verification (optional - currently NOT IMPLEMENTED, use manual cookies instead)
    phoneServiceConfig?: PhoneServiceConfig;
    smsServiceConfig?: SMSServiceConfig;
    enableAutoVerification?: boolean; // default: false - NOT IMPLEMENTED YET
    testCookiesBeforeRun?: boolean; // default: true
}

await Actor.init();

const defaultInput: Input = {
    countryCode: 'cz',
    searchQueries: ['bmw 1200gs', '1200 gs'],
    maxRequestsPerCrawl: 20,
    minPrice: null,
    maxPrice: null,
    postalCode: null,
    distance: null,
};

const userInput = await Actor.getInput<Input>() ?? defaultInput;
await validateInput(userInput);

const startUrls = createStartQueryUrls(userInput);

// === Phone Verification Setup ===
let cookies: BazosCookies | null = null;

// Priority 1: Manual cookies from input (recommended)
if (userInput.bid && userInput.bkod) {
    log.info('Using manual cookies from input');
    cookies = {
        bid: userInput.bid,
        bkod: userInput.bkod,
        testcookie: userInput.testcookie || 'ano',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    
    // Test manual cookies if enabled
    if (userInput.testCookiesBeforeRun !== false) {
        log.info('Testing manual cookies validity...');
        const isValid = await testCookies(cookies, TEST_AD_URL);
        
        if (!isValid) {
            log.warning('Manual cookies are invalid! Please provide valid bid and bkod.');
            cookies = null;
        } else {
            log.info('Manual cookies are valid, will use for phone extraction');
        }
    }
}

// Priority 2: Load cookies from storage (if no manual cookies)
if (!cookies && userInput.testCookiesBeforeRun !== false) {
    log.info('Checking for existing cookies in storage...');
    cookies = await loadCookies();
    
    if (cookies) {
        log.info('Cookies found in storage, testing validity...');
        const isValid = await testCookies(cookies, TEST_AD_URL);
        
        if (!isValid) {
            log.warning('Stored cookies are invalid, clearing them');
            await clearCookies();
            cookies = null;
        } else {
            log.info('Stored cookies are valid, will use for phone extraction');
        }
    } else {
        log.info('No cookies found in storage');
    }
}

// Priority 3: Auto-verification if enabled and no valid cookies
// NOTE: Auto-verification is currently NOT FULLY IMPLEMENTED
// External services (temp phone, SMS) require real API integration
// Use manual cookies instead (bid, bkod in input)
if (!cookies && userInput.enableAutoVerification) {
    log.warning('Auto-verification is currently NOT FULLY IMPLEMENTED');
    log.warning('External services (temp phone, SMS) need real API endpoints');
    log.warning('Please provide manual cookies (bid, bkod) in Actor input instead');
    
    /* COMMENTED OUT - NOT FULLY IMPLEMENTED
    if (!userInput.phoneServiceConfig || !userInput.smsServiceConfig) {
        throw new Error(
            'Auto-verification requires phoneServiceConfig and smsServiceConfig in input. ' +
            'Please provide API configuration or set enableAutoVerification to false.'
        );
    }
    
    log.info('No valid cookies, starting automatic verification...');
    
    try {
        cookies = await performVerificationWorkflow();
        log.info('Automatic verification completed successfully!');
    } catch (error) {
        log.error('Automatic verification failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw new Error('Failed to obtain authentication cookies via auto-verification');
    }
    */
}

if (!cookies) {
    log.warning(
        'No cookies available. Phone numbers will not be extracted from ads. ' +
        'To enable phone extraction, provide manual cookies (bid, bkod) in Actor input.'
    );
}
// === End Phone Verification Setup ===

const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
});

    const crawler = new CheerioCrawler({
        proxyConfiguration,
        maxRequestsPerCrawl: userInput.maxRequestsPerCrawl,
        requestHandler: router,
        preNavigationHooks: [
            (crawlingContext) => {
                // Add cookies to context for phone extraction in routes.ts
                (crawlingContext as any).cookies = cookies;
            },
        ],
    });await crawler.run(startUrls, {

});

await Actor.exit();
