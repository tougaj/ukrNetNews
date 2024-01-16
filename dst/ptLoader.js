"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    .describe('i', 'Infinity iteration')
    .alias('l', 'headless')
    .describe('l', 'Use headless browser')
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
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch({
        headless: argv.headless ? 'new' : false,
        ignoreHTTPSErrors: true,
        args: [
            `--window-size=${browserOptions.width},${browserOptions.height}`,
            // '--proxy-server=http://192.168.0.1:3128',
            `--proxy-server=${argv.proxy || ''}`,
        ],
    });
    const page = (yield browser.pages())[0];
    // const page = await browser.newPage();
    yield page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36');
    yield page.setViewport({ width: browserOptions.width - 45, height: browserOptions.height, deviceScaleFactor: 1 });
    try {
        yield page.goto('https://www.ukr.net/', { timeout: MAIN_PAGE_LOADING_TIMEOUT });
    }
    catch (error) {
        console.log('Goto timeout. Continuing...');
    }
    try {
        yield page.waitForSelector('body', { timeout: MAIN_PAGE_LOADING_TIMEOUT });
        // page.waitForNetworkIdle();
    }
    catch (error) {
        console.log('Wait timeout. Continuing...');
    }
    return { browser, page };
});
const loadUkrNetNews = (page, messages, { route, longTitle }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://www.ukr.net/news/dat/${route}/0/`;
    try {
        yield page.goto(url);
        // await page.waitForNetworkIdle();
        yield page.waitForSelector('body');
        const element = yield page.$('body pre');
        if (!element)
            throw new Error('Can\'t find selector "body pre"');
        const text = yield page.evaluate((node) => node.textContent, element);
        const { tops, Title } = JSON.parse(text || '');
        console.log(`✅ ${Title} (${route}) loaded`);
        return {
            route,
            title: Title,
            longTitle,
            tops: (0, common_1.getNews)(messages, tops),
        };
    }
    catch (error) {
        console.log(`❌ !!! ERROR !!! ${route} not loaded from url: ${url} with error: ${error}`);
        return null;
    }
});
const loadAllNews = (page, sections) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = {};
    const news = [];
    for (let index = 0; index < sections.length; index++) {
        if (index !== 0) {
            const sleepTime = Math.round(100 + Math.random() * 1000);
            // console.log(`Sleeping for ${sleepTime}ms`);
            yield (0, common_1.sleep)(sleepTime);
        }
        const { route, longTitle } = sections[index];
        news.push(yield loadUkrNetNews(page, messages, { route, longTitle }));
        if (isDebug && 2 <= index)
            break;
    }
    const result = {
        created: (0, moment_1.default)().toISOString(),
        news: news.filter((section) => section !== null),
        messages,
    };
    const sResult = JSON.stringify(result, null, '\t');
    fs_1.default.writeFileSync(`${common_1.OUTPUT_DIR}/ukrnet.json`, sResult);
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { browser, page } = yield init();
    const userSections = argv.sections ? new Set((_a = argv.sections) === null || _a === void 0 ? void 0 : _a.split(/\s+/)) : null;
    const sections = userSections ? common_1.UKRNET_SECTIONS.filter(({ route }) => userSections.has(route)) : common_1.UKRNET_SECTIONS;
    while (true) {
        console.log('\nNews loading start at ' + (0, moment_1.default)().format('HH:mm:ss'));
        try {
            if (!browser.connected) {
                ({ browser, page } = yield init());
            }
            yield loadAllNews(page, sections);
            console.log('🟢 News loaded at ' + (0, moment_1.default)().format('HH:mm:ss'));
        }
        catch (error) {
            console.log(`🔴 Error loading news ${error}`);
        }
        if (!argv.infinity)
            break;
        console.log(`⏰ Next run at ${(0, moment_1.default)().add(TIMEOUT_BETWEEN_SESSIONS, 'ms').format('HH:mm:ss')}`);
        yield (0, common_1.sleep)(TIMEOUT_BETWEEN_SESSIONS);
    }
    yield browser.close();
}))();
