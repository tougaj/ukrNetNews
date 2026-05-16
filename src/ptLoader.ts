import fs from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getNews, OUTPUT_DIR, PUPPETEER_TIMEOUT, sleep, UKRNET_SECTIONS } from './common.js';
import { ISection, IUkrNetSection, NewsItem, TMessages } from './interfaces.js';

const browserOptions = {
	width: 800,
	height: 600,
};

let browser: Browser | null = null;
let page: Page | null = null;

const shutdown = async (signal: string) => {
	console.log(`🛑 ${signal}`);
	if (browser) await closeBrowser(browser, page);
	process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const argv = yargs(hideBin(process.argv))
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
			'--disable-dev-shm-usage',
			'--disable-background-networking',
			'--disable-background-timer-throttling',
			'--disable-renderer-backgrounding',
			'--disable-features=Translate,BackForwardCache,AcceptCHFrame',
			'--disable-ipc-flooding-protection',
		].filter(Boolean),
	});
	const page = (await browser.pages())[0];

	await page.setRequestInterception(true);

	page.on('request', (req) => {
		const type = req.resourceType();
		if (type === 'image' || type === 'font' || type === 'media' || type === 'stylesheet') {
			req.abort().catch(() => {});
			return;
		}
		req.continue().catch(() => {});
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

	for (const { title: newsTitle, href, dataCount, created } of rawItems) {
		let id: string | null = null;

		if (dataCount) {
			id = extractIdFromDataCount(dataCount);
		} else if (href.includes('ukr.net')) {
			id = extractIdFromUkrNetHref(href);
		}

		if (!id || !newsTitle) continue;

		news.push({ id, title: newsTitle, created });
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
		// news.push(await loadSectionNews(page, messages, section, 5_000));
		try {
			news.push(await loadSectionNews(page, messages, section, 5_000));
		} catch (err) {
			console.error(`🔴 Помилка завантаження секції ${section.route}:`, err);
			news.push(null);
		}
	}
	console.log(`${Object.keys(messages).length} titles loaded`);

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
async function getRawNews(route: string, page: Page, timeout: number, isDebug = false) {
	const cacheFileName = `${OUTPUT_DIR}/local.${route}.json`;
	if (isDebug)
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
		console.warn(`⚠️ domcontentloaded не настав за ${timeout}ms, продовжуємо...`);
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
	if (isDebug) fs.writeFileSync(cacheFileName, JSON.stringify(rawItems, null, '\t'));
	return rawItems;
}

async function closeBrowser(browser: Browser, page: Page | null) {
	try {
		page?.removeAllListeners();
		await page?.close().catch(() => {});

		await Promise.race([
			browser.close(),
			new Promise((_, reject) => setTimeout(() => reject(new Error('Browser close timeout')), 15000)),
		]);
		console.log(`☑️ Browser closed at ${formatLocalDate()}`);
	} catch (e) {
		console.error('💀 browser.close failed:', e);

		try {
			browser.process()?.kill('SIGKILL');
		} catch {}
	}
}

function formatLocalDate(locale = 'uk-UA') {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	return `${new Date().toLocaleString(locale, { timeZone: tz })} (${tz})`;
}

(async () => {
	let exitCode = 0;
	try {
		const initResult = await init();
		browser = initResult.browser;
		page = initResult.page;

		const userSections = argv.sections ? new Set(argv.sections.split(/\s+/)) : null;
		const sections = userSections ? UKRNET_SECTIONS.filter(({ route }) => userSections.has(route)) : UKRNET_SECTIONS;

		console.log('\nNews loading started');
		console.time('🏁 News loaded');
		await loadAllNews(page, sections);
		// console.log('🟢 News loading finished at ' + moment().format('HH:mm:ss'));
		console.timeEnd('🏁 News loaded');
		console.log(`at ${formatLocalDate()}`);
	} catch (error) {
		exitCode = 1;
		console.log(`🔴 Error loading news ${error}`);
	} finally {
		if (browser) {
			await closeBrowser(browser, page);
		}
	}
	process.exit(exitCode);
})();
