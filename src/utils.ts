import { log } from 'apify';
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

export function createStartQueryUrls(searchQueries: string[]): string[] {
    return searchQueries.map((searchQuery) => BASE_URL + searchQuery.split(' ').join('+'));
}

export function validateInput(input: Input): void {
    // check inputs
    if (!input || !input.searchQueries || !input.maxRequestsPerCrawl) {
        throw new Error('Invalid input, must be a JSON object with the '
            + '"searchQueries" and "maxRequestsPerCrawl" field!');
    }
}
