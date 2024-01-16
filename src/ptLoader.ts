import fs from 'fs';
import moment from 'moment';
import puppeteer, { Page } from 'puppeteer';
import { getNews, OUTPUT_DIR, sleep, UKRNET_SECTIONS } from './common';
import { ISection, IUkrNetSection, TMessages } from './interfaces';

const TIMEOUT_BETWEEN_SESSIONS = (5 * 60 + 0) * 1000;
// const TIMEOUT_BETWEEN_SESSIONS = (0 * 60 + 10) * 1000;
const browserOptions = {
	width: 800,
	height: 600,
};

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const argv = require('yargs')
	.usage('Usage: node ./dist/$0 [Options]')
	.string(['p'])
	.alias('d', 'debug')
	.describe('d', 'Debug mode')
	.alias('i', 'infinity')
	.describe('i', 'Infinity iteration')
	.alias('l', 'headless')
	.describe('l', 'Use headless browser')
	.alias('p', 'proxy')
	.nargs('p', 1)
	.describe('p', 'Proxy configuration in format http://login:password@address:port/')
	.help('h')
	.alias('h', 'help').argv as { proxy: string; headless: boolean; debug: boolean; infinity: boolean };
const isDebug = argv.debug;

const init = async () => {
	const browser = await puppeteer.launch({
		headless: argv.headless ? 'new' : false,
		ignoreHTTPSErrors: true,
		args: [
			`--window-size=${browserOptions.width},${browserOptions.height}`,
			// '--proxy-server=http://192.168.0.1:3128',
			`--proxy-server=${argv.proxy || ''}`,
		],
	});
	const page = (await browser.pages())[0];
	// const page = await browser.newPage();
	await page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36'
	);
	await page.setViewport({ width: browserOptions.width - 45, height: browserOptions.height, deviceScaleFactor: 1 });
	// await page.goto('https://www.ukr.net/');
	page.goto('https://www.ukr.net/');
	try {
		await page.waitForSelector('body', { timeout: 5000 });
		// page.waitForNetworkIdle();
	} catch (error) {}
	return { browser, page };
};

const loadUkrNetNews = async (page: Page, messages: TMessages, { route, longTitle }: ISection) => {
	const url = `https://www.ukr.net/news/dat/${route}/0/`;
	try {
		await page.goto(url);
		// await page.waitForNetworkIdle();
		await page.waitForSelector('body');

		const element = await page.$('body pre');
		if (!element) throw new Error('Can\'t find selector "body pre"');

		const text = await page.evaluate((node) => node.textContent, element);
		const { tops, Title } = JSON.parse(text || '');
		console.log(`✅ ${Title} (${route}) loaded`);

		return {
			route,
			title: Title,
			longTitle,
			tops: getNews(messages, tops),
		} as IUkrNetSection;
	} catch (error) {
		console.log(`❌ !!! ERROR !!! ${route} not loaded from url: ${url} with error: ${error}`);
		return null;
	}
};

const loadAllNews = async (page: Page) => {
	const messages: TMessages = {};

	const news: (IUkrNetSection | null)[] = [];
	for (let index = 0; index < UKRNET_SECTIONS.length; index++) {
		if (index !== 0) {
			const sleepTime = Math.round(100 + Math.random() * 1000);
			// console.log(`Sleeping for ${sleepTime}ms`);
			await sleep(sleepTime);
		}
		const { route, longTitle } = UKRNET_SECTIONS[index];
		news.push(await loadUkrNetNews(page, messages, { route, longTitle }));
		if (isDebug && 3 <= index) break;
	}
	const result = {
		created: moment().toISOString(),
		news: news.filter((section) => section !== null),
		messages,
	};
	const sResult = JSON.stringify(result, null, '\t');
	fs.writeFileSync(`${OUTPUT_DIR}/ukrnet.json`, sResult);
};

(async () => {
	let { browser, page } = await init();

	while (true) {
		console.log('\nNews loading start at ' + moment().format('HH:mm:ss'));
		try {
			if (!browser.connected) {
				({ browser, page } = await init());
			}
			await loadAllNews(page);
			console.log('🟢 News loaded at ' + moment().format('HH:mm:ss'));
		} catch (error) {
			console.log(`🔴 Error loading news ${error}`);
		}
		if (!argv.infinity) break;

		console.log(`⏰ Next run at ${moment().add(TIMEOUT_BETWEEN_SESSIONS, 'ms').format('HH:mm:ss')}`);
		await sleep(TIMEOUT_BETWEEN_SESSIONS);
	}

	await browser.close();
})();
