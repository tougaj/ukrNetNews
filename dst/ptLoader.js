"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const common_1 = require("./common");
const browserOptions = {
    width: 800,
    height: 600,
};
process.on('SIGINT', async () => {
    console.log('🛑 SIGINT');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM');
    process.exit(0);
});
if (!fs_1.default.existsSync(common_1.OUTPUT_DIR))
    fs_1.default.mkdirSync(common_1.OUTPUT_DIR);
const argv = require('yargs')
    .usage('Usage: node ./dist/$0 [Options]')
    .string(['p', 's'])
    .number(['t'])
    .alias('d', 'debug')
    .describe('d', 'Debug mode')
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
            '--disable-dev-shm-usage',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-features=Translate,BackForwardCache,AcceptCHFrame',
            '--disable-ipc-flooding-protection',
        ],
    });
    const page = (await browser.pages())[0];
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
        const type = req.resourceType();
        if (type === 'image' || type === 'font' || type === 'media' || type === 'stylesheet') {
            await req.abort();
            return;
        }
        await req.continue();
    });
    /**
     * Сучасний headless Chrome вже має нормальний UA.
     * Більше того:
     * старий Chrome 83 виглядає підозріло;
     * антиботи це бачать;
     * версія Chrome не збігається з реальною Chromium версією Puppeteer.
     */
    // await page.setUserAgent({
    // 	userAgent:
    // 		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    // });
    await page.setViewport({ width: browserOptions.width - 45, height: browserOptions.height, deviceScaleFactor: 1 });
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
const loadSectionNews = async (page, messages, { route, title, longTitle }, timeout = MAIN_PAGE_LOADING_TIMEOUT) => {
    const rawItems = await getRawNews(route, page, timeout, isDebug);
    const news = [];
    for (const { title, href, dataCount, created } of rawItems) {
        let id = null;
        if (dataCount) {
            id = extractIdFromDataCount(dataCount);
        }
        else if (href.includes('ukr.net')) {
            id = extractIdFromUkrNetHref(href);
        }
        if (!id || !title)
            continue;
        news.push({ id, title, created });
    }
    const shortTitle = title ?? longTitle;
    console.log(`✅ ${shortTitle} (${route}) loaded`);
    return {
        route,
        title: shortTitle,
        longTitle,
        tops: (0, common_1.getNews)(messages, news),
    };
};
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
    console.log(`${Object.keys(messages).length} titles loaded`);
    const result = {
        created: new Date().toISOString(),
        news: news.filter((section) => section !== null),
        messages,
    };
    const sResult = JSON.stringify(result, null, '\t');
    fs_1.default.writeFileSync(`${common_1.OUTPUT_DIR}/ukrnet.json`, sResult);
};
async function getRawNews(route, page, timeout, caching = false) {
    const cacheFileName = `${common_1.OUTPUT_DIR}/local.${route}.json`;
    if (caching)
        try {
            return JSON.parse(fs_1.default.readFileSync(cacheFileName).toString());
        }
        catch (error) {
            console.warn(`⚠️ ${route} — кеш відсутній. Використовуємо стандартний відбір повідомлень.`);
        }
    const url = `https://www.ukr.net/news/${route}.html`;
    // ⏳ goto з networkidle2 — таймаут очікуваний, продовжуємо
    try {
        // await page.goto(url, { waitUntil: 'networkidle2', timeout});
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    }
    catch {
        console.warn(`⚠️ domcontentloaded не настав за ${timeout}ms, продовжуємо...`);
    }
    // 🔍 Чекаємо секцій — але навіть якщо не дочекались, збираємо що є
    try {
        await page.waitForSelector('section.im', { timeout: timeout });
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
            const time = section.querySelector('.im-tm');
            if (!time)
                continue;
            results.push({
                title: anchor.textContent?.trim() ?? '',
                href: anchor.getAttribute('href') ?? '',
                dataCount: anchor.getAttribute('data-count'),
                created: time.textContent?.trim() ?? '',
            });
        }
        return results;
    });
    if (caching)
        fs_1.default.writeFileSync(cacheFileName, JSON.stringify(rawItems, null, '\t'));
    return rawItems;
}
async function closeBrowser(browser, page) {
    try {
        page?.removeAllListeners();
        await page?.close().catch(() => { });
        await Promise.race([
            browser.close(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Browser close timeout')), 15000)),
        ]);
    }
    catch (e) {
        console.error('💀 browser.close failed:', e);
        try {
            browser.process()?.kill('SIGKILL');
        }
        catch { }
    }
}
(async () => {
    let browser = null;
    let page = null;
    let exitCode = 0;
    try {
        const initResult = await init();
        browser = initResult.browser;
        page = initResult.page;
        const userSections = argv.sections ? new Set(argv.sections?.split(/\s+/)) : null;
        const sections = userSections ? common_1.UKRNET_SECTIONS.filter(({ route }) => userSections.has(route)) : common_1.UKRNET_SECTIONS;
        console.log('\nNews loading started');
        console.time('🏁 News loaded');
        await loadAllNews(page, sections);
        // console.log('🟢 News loading finished at ' + moment().format('HH:mm:ss'));
        console.timeEnd('🏁 News loaded');
    }
    catch (error) {
        exitCode = 1;
        console.log(`🔴 Error loading news ${error}`);
    }
    finally {
        if (browser) {
            await closeBrowser(browser, page);
        }
    }
    process.exit(exitCode);
})();
