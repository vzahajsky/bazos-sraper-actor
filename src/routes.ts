import { createCheerioRouter, Dataset, EnqueueStrategy } from 'crawlee';
import { extractISODateFromString, extractPhoneNumber } from './utils.js';
import { clearCookies } from './services/bazos/cookieManager.js';
import type { BazosCookies } from './services/bazos/phoneVerification.js';

interface Output {
    id: number,
    title: string,
    date: string,
    priceRaw: string,
    locationPsc: string,
    locationName: string,
    views: number,
    url: string,
    content: string,
    imageUrl: string,
    phoneNumber: string | null,
}

export const router = createCheerioRouter();

router.addHandler('AD', async (context) => {
    const { request, $, log } = context;
    // Cookies can be passed via crawler context
    const cookies = (context as any).cookies as BazosCookies | undefined;
    
    log.debug('PARSING AD');

    const adId = Number(request.url.split('/')[4]);
    const title = $('.nadpisdetail').text();
    let date = $('.inzeratydetnadpis .velikost10').text();
    if (date) date = extractISODateFromString(date) ?? '';

    const details = $('.listadvlevo table');
    const { url } = request;
    const content = $('.popisdetail').text();

    const views = Number(details.find('td:contains("Vidělo:")').parent()
        .find('td').last()
        .text()
        .trim()
        .split(' ')[0]);

    const priceRaw = details.find('td:contains("Cena:")').parent()
        .find('td').last()
        .text()
        .trim();

    const locationLine = details.find('td:contains("Lokalita:")').parent();
    const locationPsc = locationLine.find('td a').first().text().trim();
    const locationName = locationLine.find('td a').next().text().trim();

    const imageUrl = $('.carousel-cell-image').first().attr('src')?.split('?')[0] ?? '';

    // Extract phone number if cookies available
    let phoneNumber: string | null = null;
    
    if (cookies) {
        try {
            phoneNumber = await extractPhoneNumber($, request.url, cookies);
            if (phoneNumber) {
                log.info('Successfully extracted phone number', { adId, phoneNumber });
            }
        } catch (error) {
            log.error('Error extracting phone number', { 
                adId, 
                error: error instanceof Error ? error.message : String(error),
            });
            
            // If cookies expired, clear them
            if (error instanceof Error && error.message.includes('Cookies expired')) {
                log.warning('Cookies are expired, clearing them from store');
                await clearCookies();
                // TODO: Trigger re-verification workflow
            }
        }
    } else {
        log.debug('Cookies not available, skipping phone extraction', { adId });
    }

    const result: Output = {
        id: adId,
        title,
        date,
        priceRaw,
        locationPsc,
        locationName,
        views,
        url,
        content,
        imageUrl,
        phoneNumber,
    };

    await Dataset.pushData(result);
});

router.addDefaultHandler(async ({ enqueueLinks, request, $, log }) => {
    log.debug(`Parsing (pages): ${typeof request.label}`);

    await enqueueLinks({
        selector: '.nadpis > a',
        label: 'AD',
        strategy: EnqueueStrategy.All,
    });

    const lastPageText = $('.strankovani a').last().text();
    const hasNextPage = Number.isNaN(Number(lastPageText));

    if (hasNextPage) {
        await enqueueLinks({
            selector: '.strankovani a:last-of-type',
        });
    }
});
