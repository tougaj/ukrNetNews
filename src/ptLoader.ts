import fs from 'fs';
import puppeteer, { Page } from 'puppeteer';
import { getNews, OUTPUT_DIR, PUPPETEER_TIMEOUT, sleep, UKRNET_SECTIONS } from './common';
import { ISection, IUkrNetSection, NewsItem, TMessages } from './interfaces';

const TIMEOUT_BETWEEN_SESSIONS = (5 * 60 + 0) * 1000;
// const TIMEOUT_BETWEEN_SESSIONS = (0 * 60 + 10) * 1000;
const browserOptions = {
	width: 800,
	height: 600,
};

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

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
	.alias('h', 'help').argv as {
	proxy?: string;
	headless?: boolean;
	debug?: boolean;
	sections?: string;
	timeout?: number;
	noSandbox?: boolean;
};
const isDebug = argv.debug;
const MAIN_PAGE_LOADING_TIMEOUT = (argv.timeout || PUPPETEER_TIMEOUT) * 1000;

const init = async () => {
	const browser = await puppeteer.launch({
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
	await page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
	);
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

function extractIdFromDataCount(dataCount: string): string | null {
	const parts = dataCount.split(',').filter((p) => p.trim() !== '');
	return parts[1] ?? null;
}

function extractIdFromUkrNetHref(href: string): string | null {
	const match = href.match(/-(\d+)\.html$/);
	return match?.[1] ?? null;
}

const loadSectionNews = async (
	page: Page,
	messages: TMessages,
	{ route, title, longTitle }: ISection,
	timeout: number = MAIN_PAGE_LOADING_TIMEOUT,
) => {
	const rawItems = await getRawNews(route, page, timeout, isDebug);

	const news: NewsItem[] = [];

	for (const { title, href, dataCount, created } of rawItems) {
		let id: string | null = null;

		if (dataCount) {
			id = extractIdFromDataCount(dataCount);
		} else if (href.includes('ukr.net')) {
			id = extractIdFromUkrNetHref(href);
		}

		if (!id || !title) continue;

		news.push({ id, title, created });
	}

	const shortTitle = title ?? longTitle;
	console.log(`✅ ${shortTitle} (${route}) loaded`);
	return {
		route,
		title: shortTitle,
		longTitle,
		tops: getNews(messages, news),
	} as IUkrNetSection;
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

const loadAllNews = async (page: Page, sections: ISection[]) => {
	const messages: TMessages = {};

	const news: (IUkrNetSection | null)[] = [];
	for (let index = 0; index < sections.length; index++) {
		if (index !== 0) {
			const sleepTime = Math.round(100 + Math.random() * 1000);
			// console.log(`Sleeping for ${sleepTime}ms`);
			await sleep(sleepTime);
		}
		const section = sections[index];
		news.push(await loadSectionNews(page, messages, section, 5_000));
		// news.push(await loadUkrNetNews(page, messages, { route, longTitle }));
	}
	console.log(Object.keys(messages).length);

	const result = {
		created: new Date().toISOString(),
		news: news.filter((section) => section !== null),
		messages,
	};
	const sResult = JSON.stringify(result, null, '\t');
	fs.writeFileSync(`${OUTPUT_DIR}/ukrnet.json`, sResult);
};

interface IRawItem {
	title: string;
	href: string;
	dataCount: string | null;
	created: string;
}
async function getRawNews(route: string, page: Page, timeout: number, caching = false) {
	const cacheFileName = `${OUTPUT_DIR}/local.${route}.json`;
	if (caching)
		try {
			return JSON.parse(fs.readFileSync(cacheFileName).toString()) as IRawItem[];
		} catch (error) {
			console.warn(`⚠️ ${route} — кеш відсутній. Використовуємо стандартний відбір повідомлень.`);
		}

	const url = `https://www.ukr.net/news/${route}.html`;

	// ⏳ goto з networkidle2 — таймаут очікуваний, продовжуємо
	try {
		// await page.goto(url, { waitUntil: 'networkidle2', timeout});
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
	} catch {
		console.warn(`⚠️ networkidle2 не настав за ${timeout}ms, продовжуємо...`);
	}

	// 🔍 Чекаємо секцій — але навіть якщо не дочекались, збираємо що є
	try {
		await page.waitForSelector('section.im', { timeout: timeout });
	} catch {
		console.warn('⚠️ waitForSelector не спрацював, спробуємо зібрати наявний контент...');
	}
	// const html = await page.content();

	// 📜 Два скроли до кінця — для підвантаження lazy load
	// for (let i = 0; i < 2; i++) {
	// 	await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
	// 	await new Promise((resolve) => setTimeout(resolve, 1_500));
	// }
	const rawItems = await page.evaluate(() => {
		const results: IRawItem[] = [];

		for (const section of document.querySelectorAll('article section.im')) {
			const anchor = section.querySelector<HTMLAnchorElement>('div.im-tl > a.im-tl_a');
			if (!anchor) continue;
			const time = section.querySelector<HTMLTimeElement>('.im-tm');
			if (!time) continue;

			results.push({
				title: anchor.textContent?.trim() ?? '',
				href: anchor.getAttribute('href') ?? '',
				dataCount: anchor.getAttribute('data-count'),
				created: time.textContent?.trim() ?? '',
			});
		}

		return results;
	});
	if (caching) fs.writeFileSync(cacheFileName, JSON.stringify(rawItems, null, '\t'));
	return rawItems;
}

(async () => {
	let { browser, page } = await init();
	const userSections = argv.sections ? new Set(argv.sections?.split(/\s+/)) : null;
	const sections = userSections ? UKRNET_SECTIONS.filter(({ route }) => userSections.has(route)) : UKRNET_SECTIONS;

	console.log('\nNews loading started');
	console.time('🏁 News loaded');
	try {
		if (!browser.connected) {
			({ browser, page } = await init());
		}
		await loadAllNews(page, sections);
		// console.log('🟢 News loading finished at ' + moment().format('HH:mm:ss'));
		console.timeEnd('🏁 News loaded');
	} catch (error) {
		console.log(`🔴 Error loading news ${error}`);
	}

	await browser.close();
})();
