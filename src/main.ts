import { Actor, log, LogLevel } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { router } from './routes.js';
import { createStartQueryUrls } from './utils.js';

export interface Input {
    searchQueries: string[];
    maxRequestsPerCrawl: number;
}

log.setLevel(LogLevel.DEBUG);

await Actor.init();

const {
    searchQueries = ['bmw 1200gs', '1200gs'],
    maxRequestsPerCrawl = 10,
} = await Actor.getInput<Input>() ?? {} as Input;

const startUrls = createStartQueryUrls(searchQueries);

const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
});

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    requestHandler: router,
});

await crawler.run(startUrls, {

});

await Actor.exit();
