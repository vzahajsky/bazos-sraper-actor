/**
 * Cookie Manager for Bazos.cz
 * Handles persistence and validation of authentication cookies
 */

import { KeyValueStore, log } from 'apify';
import type { BazosCookies } from './phoneVerification.js';

export interface CookieStore {
    cookies: BazosCookies;
    createdAt: Date;
    lastUsedAt: Date;
    usageCount: number;
}

const COOKIE_STORE_KEY = 'BAZOS_COOKIES';

/**
 * Saves cookies to Apify Key-Value Store
 * @param cookies - Bazos cookies to persist
 */
export async function saveCookies(cookies: BazosCookies): Promise<void> {
    const store = await KeyValueStore.open();
    
    const cookieStore: CookieStore = {
        cookies,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        usageCount: 0,
    };
    
    await store.setValue(COOKIE_STORE_KEY, cookieStore);
    log.info('Cookies successfully saved to Key-Value Store', {
        bid: cookies.bid,
        expiresAt: cookies.expiresAt,
    });
}

/**
 * Loads cookies from Apify Key-Value Store
 * @returns Stored cookies or null if not found
 */
export async function loadCookies(): Promise<BazosCookies | null> {
    const store = await KeyValueStore.open();
    const cookieStore = await store.getValue<CookieStore>(COOKIE_STORE_KEY);
    
    if (!cookieStore) {
        log.debug('No cookies found in Key-Value Store');
        return null;
    }
    
    // Update usage statistics
    cookieStore.lastUsedAt = new Date();
    cookieStore.usageCount += 1;
    await store.setValue(COOKIE_STORE_KEY, cookieStore);
    
    log.info('Cookies loaded from Key-Value Store', {
        bid: cookieStore.cookies.bid,
        usageCount: cookieStore.usageCount,
        createdAt: cookieStore.createdAt,
    });
    
    return cookieStore.cookies;
}

/**
 * Checks if cookies are still valid based on expiration date
 * @param cookies - Cookies to validate
 * @returns true if valid, false if expired
 */
export function areCookiesValid(cookies: BazosCookies): boolean {
    const now = new Date();
    const expiresAt = new Date(cookies.expiresAt);
    
    const isValid = expiresAt > now;
    
    if (!isValid) {
        log.debug('Cookies are expired', {
            expiresAt: cookies.expiresAt,
            now: now.toISOString(),
        });
    }
    
    return isValid;
}

/**
 * Removes cookies from Key-Value Store
 */
export async function clearCookies(): Promise<void> {
    const store = await KeyValueStore.open();
    await store.setValue(COOKIE_STORE_KEY, null);
    log.info('Cookies cleared from Key-Value Store');
}

/**
 * Tests cookies by attempting to retrieve a phone number
 * @param cookies - Cookies to test
 * @param testUrl - Test ad URL to validate cookies against
 * @returns true if cookies work, false otherwise
 */
export async function testCookies(
    cookies: BazosCookies,
    testUrl: string,
): Promise<boolean> {
    try {
        log.debug('Testing cookies validity...', { testUrl });
        
        // Fetch the test ad page to extract phone request parameters
        const pageResponse = await fetch(testUrl);
        const html = await pageResponse.text();
        
        // Extract phone request parameters from onclick handler
        // Format: odeslatrequest('/ad-phone.php','idi=210563707&idphone=5812530','overlaytel')
        const onclickMatch = html.match(/odeslatrequest\('\/ad-phone\.php','(idi=\d+&idphone=\d+)'/);
        
        if (!onclickMatch) {
            log.warning('Could not extract phone request parameters from test URL');
            return false;
        }
        
        const params = onclickMatch[1]; // e.g., "idi=210563707&idphone=5812530"
        
        // Make POST request to phone API with cookies
        const phoneResponse = await fetch('https://www.bazos.cz/ad-phone.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `bid=${cookies.bid}; bkod=${cookies.bkod}; testcookie=ano`,
            },
            body: params,
        });
        
        const responseText = await phoneResponse.text();
        
        // Check if response contains verification form (expired cookies)
        if (responseText.includes('Zobrazit telefon může pouze ověřený uživatel') ||
            responseText.includes('Ověření je zdarma')) {
            log.debug('Cookies are invalid - verification required');
            return false;
        }
        
        // Check if response contains a phone number pattern
        const phonePattern = /(\+?\d{3}\s?\d{3}\s?\d{3}\s?\d{3}|\d{9})/;
        const hasPhone = phonePattern.test(responseText);
        
        if (hasPhone) {
            log.info('Cookies are valid - successfully retrieved phone number');
            return true;
        }
        
        log.warning('Unexpected response from phone API', {
            responsePreview: responseText.substring(0, 200),
        });
        return false;
        
    } catch (error) {
        log.error('Error testing cookies', { error });
        return false;
    }
}
