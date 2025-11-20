import { Actor, log } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { router } from './routes.js';
import { createStartQueryUrls, validateInput } from './utils.js';
import { CountryCode, Nullable } from './types.js';
import { loadCookies, testCookies, clearCookies } from './services/bazos/cookieManager.js';
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
    
    // Phone extraction
    extractPhoneNumbers?: boolean; // Enable phone number extraction
    bid?: string; // User ID (8-digit number) - required when extractPhoneNumbers=true
    bkod?: string; // Auth token (10-char alphanumeric) - SECRET - required when extractPhoneNumbers=true
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

// Only process cookies if extractPhoneNumbers is enabled
if (userInput.extractPhoneNumbers) {
    // Validate required fields
    if (!userInput.bid || !userInput.bkod) {
        await Actor.fail(
            'Phone number extraction requires both "bid" and "bkod" cookies. ' +
            'Please provide these values in the Actor input, or disable the "Extract phone numbers" option.'
        );
        process.exit(1);
    }

    // Priority 1: Manual cookies from input (recommended)
    if (userInput.bid && userInput.bkod) {
        log.info('Using manual cookies from input');
        cookies = {
            bid: userInput.bid,
            bkod: userInput.bkod,
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

    if (!cookies) {
        log.warning(
            'No cookies available. Phone numbers will not be extracted from ads. ' +
            'To enable phone extraction, provide manual cookies (bid, bkod) in Actor input.'
        );
    }
} else {
    log.info('Phone number extraction disabled (extractPhoneNumbers=false)');
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
