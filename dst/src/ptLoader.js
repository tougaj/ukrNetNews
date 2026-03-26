"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const moment_1 = __importDefault(require("moment"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const common_1 = require("./common");
const TIMEOUT_BETWEEN_SESSIONS = (5 * 60 + 0) * 1000;
// const TIMEOUT_BETWEEN_SESSIONS = (0 * 60 + 10) * 1000;
const browserOptions = {
    width: 800,
    height: 600,
};
if (!fs_1.default.existsSync(common_1.OUTPUT_DIR))
    fs_1.default.mkdirSync(common_1.OUTPUT_DIR);
const argv = require('yargs')
    .usage('Usage: node ./dist/$0 [Options]')
    .string(['p', 's'])
    .number(['t'])
    .alias('d', 'debug')
    .describe('d', 'Debug mode')
    .alias('i', 'infinity')
    .describe('i', 'Infinity iterations')
    .alias('l', 'headless')
    .describe('l', 'Use headless browser')
    .alias('b', 'no-sandbox')
    .describe('b', "Don't use Chrome sandbox")
    .alias('p', 'proxy')
    .nargs('p', 1)
    .describe('p', 'Proxy configuration in format http://login:password@address:port/')
    .alias('s', 'sections')
    .nargs('s', 1)
    .describe('s', "Sections' names for download separated by spaces")
    .alias('t', 'timeout')
    .nargs('t', 1)
    .describe('t', 'Main page loading timeout in seconds')
    .help('h')
    .alias('h', 'help').argv;
const isDebug = argv.debug;
const MAIN_PAGE_LOADING_TIMEOUT = (argv.timeout || common_1.PUPPETEER_TIMEOUT) * 1000;
const init = async () => {
    const browser = await puppeteer_1.default.launch({
        headless: argv.headless ? true : false,
        // ignoreHTTPSErrors: true,
        args: [
            `--window-size=${browserOptions.width},${browserOptions.height}`,
            // '--proxy-server=http://192.168.0.1:3128',
            `--proxy-server=${argv.proxy || ''}`,
            argv.noSandbox ? '--no-sandbox' : '',
            // '--disable-setuid-sandbox',
        ],
    });
    const page = (await browser.pages())[0];
    // const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36');
    await page.setViewport({ width: browserOptions.width - 45, height: browserOptions.height, deviceScaleFactor: 1 });
    // try {
    // 	await page.goto('https://www.ukr.net/', { timeout: MAIN_PAGE_LOADING_TIMEOUT });
    // 	// await page.goto('https://www.ukr.net/', { waitUntil: 'networkidle2' });
    // } catch (error) {
    // 	console.log('Goto timeout. Continuing...');
    // }
    // try {
    // 	await page.waitForSelector('body', { timeout: MAIN_PAGE_LOADING_TIMEOUT });
    // 	// page.waitForNetworkIdle();
    // } catch (error) {
    // 	console.log('Wait for selector timeout. Continuing...');
    // }
    return { browser, page };
};
function extractIdFromDataCount(dataCount) {
    const parts = dataCount.split(',').filter((p) => p.trim() !== '');
    return parts[1] ?? null;
}
function extractIdFromUkrNetHref(href) {
    const match = href.match(/-(\d+)\.html$/);
    return match?.[1] ?? null;
}
const loadSectionNews = async (page, messages, { route, title, longTitle }, timeoutMs = 15_000) => {
    const rawItems = await getRawNews(route, page, timeoutMs, true);
    const news = [];
    for (const { title, href, dataCount } of rawItems) {
        let id = null;
        if (dataCount) {
            id = extractIdFromDataCount(dataCount);
        }
        else if (href.includes('ukr.net')) {
            id = extractIdFromUkrNetHref(href);
        }
        if (!id || !title)
            continue;
        news.push({ id, title });
    }
    return {
        route,
        title: title ?? longTitle,
        longTitle,
        tops: (0, common_1.getNews)(messages, news),
    };
};
// const loadUkrNetNews = async (page: Page, messages: TMessages, { route, longTitle }: ISection) => {
// 	const url = `https://www.ukr.net/news/dat/${route}/0/`;
// 	try {
// 		await page.goto(url);
// 		// await page.waitForNetworkIdle();
// 		await page.waitForSelector('body');
// 		const element = await page.$('body pre');
// 		if (!element) throw new Error('Can\'t find the "body pre" selector');
// 		const text = await page.evaluate((node) => node.textContent, element);
// 		const { tops, Title } = JSON.parse(text || '');
// 		console.log(`✅ ${Title} (${route}) loaded`);
// 		return {
// 			route,
// 			title: Title,
// 			longTitle,
// 			tops: getNews(messages, tops),
// 		} as IUkrNetSection;
// 	} catch (error) {
// 		console.log(`❌ !!! ERROR !!! ${route} not loaded from url: ${url} with error: ${error}`);
// 		return null;
// 	}
// };
const loadAllNews = async (page, sections) => {
    const messages = {};
    const news = [];
    for (let index = 0; index < sections.length; index++) {
        if (index !== 0) {
            const sleepTime = Math.round(100 + Math.random() * 1000);
            // console.log(`Sleeping for ${sleepTime}ms`);
            await (0, common_1.sleep)(sleepTime);
        }
        const section = sections[index];
        news.push(await loadSectionNews(page, messages, section, 5_000));
        // news.push(await loadUkrNetNews(page, messages, { route, longTitle }));
    }
    const result = {
        created: (0, moment_1.default)().toISOString(),
        news: news.filter((section) => section !== null),
        messages,
    };
    const sResult = JSON.stringify(result, null, '\t');
    fs_1.default.writeFileSync(`${common_1.OUTPUT_DIR}/ukrnet.json`, sResult);
};
(async () => {
    let { browser, page } = await init();
    const userSections = argv.sections ? new Set(argv.sections?.split(/\s+/)) : null;
    const sections = userSections ? common_1.UKRNET_SECTIONS.filter(({ route }) => userSections.has(route)) : common_1.UKRNET_SECTIONS;
    while (true) {
        console.log('\nNews loading started at ' + (0, moment_1.default)().format('HH:mm:ss'));
        console.time('🏁 News loaded');
        try {
            if (!browser.connected) {
                ({ browser, page } = await init());
            }
            await loadAllNews(page, sections);
            // console.log('🟢 News loading finished at ' + moment().format('HH:mm:ss'));
            console.timeEnd('🏁 News loaded');
        }
        catch (error) {
            console.log(`🔴 Error loading news ${error}`);
        }
        if (!argv.infinity)
            break;
        console.log(`⏰ Next run at ${(0, moment_1.default)().add(TIMEOUT_BETWEEN_SESSIONS, 'ms').format('HH:mm:ss')}`);
        await (0, common_1.sleep)(TIMEOUT_BETWEEN_SESSIONS);
    }
    await browser.close();
})();
async function getRawNews(route, page, timeoutMs, caching = false) {
    const cacheFileName = `${common_1.OUTPUT_DIR}/local.${route}.json`;
    if (caching)
        try {
            return JSON.parse(fs_1.default.readFileSync(cacheFileName).toString());
        }
        catch (error) {
            console.warn('⚠️ Кеш відсутній. Використовуємо стандартний відбір повідомлень.');
        }
    const url = `https://www.ukr.net/news/${route}.html`;
    // ⏳ goto з networkidle2 — таймаут очікуваний, продовжуємо
    try {
        // await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    }
    catch {
        console.warn(`⚠️ networkidle2 не настав за ${timeoutMs}ms, продовжуємо...`);
    }
    // 🔍 Чекаємо секцій — але навіть якщо не дочекались, збираємо що є
    try {
        await page.waitForSelector('section.im', { timeout: timeoutMs });
    }
    catch {
        console.warn('⚠️ waitForSelector не спрацював, спробуємо зібрати наявний контент...');
    }
    // const html = await page.content();
    // 📜 Два скроли до кінця — для підвантаження lazy load
    // for (let i = 0; i < 2; i++) {
    // 	await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    // 	await new Promise((resolve) => setTimeout(resolve, 1_500));
    // }
    const rawItems = await page.evaluate(() => {
        const results = [];
        for (const section of document.querySelectorAll('article section.im')) {
            const anchor = section.querySelector('div.im-tl > a.im-tl_a');
            if (!anchor)
                continue;
            results.push({
                title: anchor.textContent?.trim() ?? '',
                href: anchor.getAttribute('href') ?? '',
                dataCount: anchor.getAttribute('data-count'),
            });
        }
        return results;
    });
    if (caching)
        fs_1.default.writeFileSync(cacheFileName, JSON.stringify(rawItems, null, '\t'));
    return rawItems;
}
//# sourceMappingURL=ptLoader.js.map