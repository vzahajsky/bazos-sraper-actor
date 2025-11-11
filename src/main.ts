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
    
    // Phone verification (optional)
    phoneServiceConfig?: PhoneServiceConfig;
    smsServiceConfig?: SMSServiceConfig;
    enableAutoVerification?: boolean; // default: false
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

// Load and test cookies if enabled
if (userInput.testCookiesBeforeRun !== false) {
    log.info('Checking for existing cookies...');
    cookies = await loadCookies();
    
    if (cookies) {
        log.info('Cookies found, testing validity...');
        const isValid = await testCookies(cookies, TEST_AD_URL);
        
        if (!isValid) {
            log.warning('Cookies are invalid, clearing them');
            await clearCookies();
            cookies = null;
        } else {
            log.info('Cookies are valid, will use for phone extraction');
        }
    } else {
        log.info('No cookies found in storage');
    }
}

// Auto-verification if enabled and no valid cookies
if (!cookies && userInput.enableAutoVerification) {
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
}

if (!cookies) {
    log.warning(
        'No cookies available. Phone numbers will not be extracted from ads. ' +
        'To enable phone extraction, set enableAutoVerification: true and provide API configs.'
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
