import { Actor, log } from 'apify';
import { BASE_URL } from './const.js';
import { Input } from './main.js';

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
        .map(([key, value]) => (value !== null ? `&${key}=${value}` : ''))
        .join('');

    return input.searchQueries.map((searchQuery) => BASE_URL + searchQuery.split(' ').join('+') + urlQueryParams);
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
