import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { router } from './routes.js';
import { createStartQueryUrls, validateInput } from './utils.js';
import { Nullable } from './types.js';

export interface Input {
    searchQueries: string[];
    minPrice: Nullable<number>;
    maxPrice: Nullable<number>;
    postalCode: Nullable<number>;
    distance: Nullable<number>;
    maxRequestsPerCrawl: number;
}

await Actor.init();

const defaultInput: Input = {
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

const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
});

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl: userInput.maxRequestsPerCrawl,
    requestHandler: router,
});

await crawler.run(startUrls, {

});

await Actor.exit();
