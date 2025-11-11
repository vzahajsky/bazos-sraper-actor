import { Actor, log } from 'apify';
import { getBaseUrl, setCountryCode} from './const.js';
import { Input } from './main.js';
import type { BazosCookies } from './services/bazos/phoneVerification.js';
import type { CheerioRoot } from 'crawlee';

export function extractISODateFromString(text: string): string | null {
    const regex = /\[(\d{1,2})\.(\d{1,2})\. (\d{4})\]/;
    const match = text.match(regex);

    if (match && match.length === 4) {
        const year = match[3];
        const month = match[2].padStart(2, '0'); // Přidání nuly před měsíc, pokud je potřeba
        const day = match[1].padStart(2, '0'); // Přidání nuly před den, pokud je potřeba
        return `${year}-${month}-${day}`;
    }

    log.warning('Date not found');
    return null;
}

export function createStartQueryUrls(input: Input): string[] {
    let urlQueryParams = '';

    const inputParams = {
        cenaod: input.minPrice,
        cenado: input.maxPrice,
        hlokalita: input.postalCode,
        humkreis: input.distance,
    };

    urlQueryParams = Object.entries(inputParams)
        .map(([key, value]) => (value !== null && value !== undefined ? `&${key}=${value}` : ''))
        .join('');

    setCountryCode(input.countryCode);
    return input.searchQueries.map((searchQuery) => getBaseUrl() + searchQuery.split(' ').join('+') + urlQueryParams);
}

export async function validateInput(input: Input): Promise<void> {
    // check inputs
    if (!input || !input.searchQueries || !input.maxRequestsPerCrawl) {
        await Actor.fail('Invalid input, must be a JSON object with the '
            + '"searchQueries" and "maxRequestsPerCrawl" field!');
    }

    if (!(input.searchQueries instanceof Array)) {
        await Actor.fail('"searchQueries" have to be array!');
    }

    if ((input.minPrice && input.maxPrice) && (input.minPrice > input.maxPrice)) {
        await Actor.fail('"minPrice" is bigger then "maxPrice"!');
    }
}

/**
 * Extracts phone number from Bazos ad using authenticated cookies
 * @param $ - Cheerio instance with loaded ad page
 * @param adUrl - URL of the ad
 * @param cookies - Authenticated Bazos cookies
 * @returns Phone number or null if extraction fails
 */
export async function extractPhoneNumber(
    $: CheerioRoot,
    adUrl: string,
    cookies: BazosCookies,
): Promise<string | null> {
    try {
        // Find the phone display element
        const teldetailElement = $('.teldetail');
        
        if (teldetailElement.length === 0) {
            log.debug('No .teldetail element found on page', { adUrl });
            return null;
        }
        
        const onclick = teldetailElement.attr('onclick');
        
        if (!onclick) {
            log.debug('Element .teldetail has no onclick handler', { adUrl });
            return null;
        }
        
        // Parse: odeslatrequest('/ad-phone.php','idi=210563707&idphone=5812530','overlaytel')
        const match = onclick.match(/idi=(\d+)&idphone=(\d+)/);
        
        if (!match) {
            log.warning('Could not parse idi and idphone from onclick handler', { 
                adUrl, 
                onclick: onclick.substring(0, 100),
            });
            return null;
        }
        
        const [, idi, idphone] = match;
        
        log.debug('Extracted phone request parameters', { idi, idphone });
        
        // Make POST request with cookies
        const response = await fetch('https://www.bazos.cz/ad-phone.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `bid=${cookies.bid}; bkod=${cookies.bkod}; testcookie=${cookies.testcookie}`,
            },
            body: `idi=${idi}&idphone=${idphone}`,
        });
        
        const text = await response.text();
        
        // Check if we got verification form (expired cookies)
        if (text.includes('Zobrazit telefon může pouze ověřený uživatel') ||
            text.includes('Ověření je zdarma')) {
            throw new Error('Cookies expired - requires verified user');
        }
        
        // Extract phone number from response
        // Response format: plain text phone number or HTML with phone
        const phoneMatch = text.match(/(\+?\d{3}\s?\d{3}\s?\d{3}\s?\d{3}|\d{9})/);
        
        if (!phoneMatch) {
            log.warning('Could not extract phone number from response', { 
                adUrl,
                responsePreview: text.substring(0, 200),
            });
            return null;
        }
        
        const phoneNumber = phoneMatch[1].replace(/\s/g, '');
        log.debug('Successfully extracted phone number', { adUrl, phoneNumber });
        
        return phoneNumber;
        
    } catch (error) {
        log.error('Error extracting phone number', { 
            adUrl, 
            error: error instanceof Error ? error.message : String(error),
        });
        
        // Re-throw if cookies are expired (so caller can handle re-verification)
        if (error instanceof Error && error.message.includes('Cookies expired')) {
            throw error;
        }
        
        return null;
    }
}

