'use strict';

import { INews, ISection, IUkrNetNews, IUkrNetResponse } from './interfaces';

const nodeFetch = require('node-fetch');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');
const moment = require('moment');

const argv = require('yargs')
	.usage('Usage: node ./dist/$0 -p [str]')
	.string(['p'])
	.alias('p', 'proxy')
	.nargs('p', 1)
	.describe('p', 'Proxy configuration in format http://login:password@address:port/')
	.help('h')
	.alias('h', 'help').argv;

const outputDir = './output';
const MESSAGES_MAX_COUNT = 50;
const MAX_LENGTH = {
	title: 200,
	description: 1000,
};

const proxyAddress = argv.proxy;
const proxyAgent = proxyAddress ? new HttpsProxyAgent(proxyAddress) : undefined;
const messages: { [key: number]: INews } = {};

// const getFileName = () => moment().format('YYYYMMDD_HHmmss') + '.json';

const getNews = (tops: IUkrNetNews[], maxCount = MESSAGES_MAX_COUNT) => {
	const news: number[] = tops.slice(0, maxCount).map(({ Title, Description, DateCreated, NewsCount, NewsId }) => {
		if (messages[NewsId] === undefined)
			messages[NewsId] = {
				title: Title.substring(0, MAX_LENGTH.title),
				description: Description.substring(0, MAX_LENGTH.description),
				created: moment(DateCreated * 1000).toISOString(),
				count: NewsCount,
			};
		return NewsId;
	});
	return news;
};

const loadUkrNetNews = ({ route, longTitle }: ISection) =>
	nodeFetch(`https://www.ukr.net/news/dat/${route}/0/`, {
		agent: proxyAgent,
	})
		.then((data: Response) => data.json())
		.then((data: IUkrNetResponse) => {
			const { tops, Title } = data;
			console.log(`${Title} (${route}) loaded`);
			return {
				route,
				title: Title,
				longTitle,
				tops: getNews(tops),
			};
		});
// .catch((error) => console.error(error));

const loadAllNews = async () => {
	const sections: ISection[] = [
		{ route: 'main', longTitle: 'Головні події України та світу' },
		{ route: 'politics', longTitle: 'Політичні новини країни' },
		{ route: 'economics', longTitle: 'Економіка та бізнес' },
		{ route: 'covid19', longTitle: 'Коронавірус COVID-19' },
		{ route: 'criminal', longTitle: 'Оперативно про надзвичайні події' },
		{ route: 'society', longTitle: 'Соціальні та культурні події' },
		{ route: 'world', longTitle: 'Ситуація в світі' },
		{ route: 'kyiv', longTitle: 'Події в Києві та області' },
		{ route: 'crimea', longTitle: 'Події в Криму' },
	];
	const news = await Promise.all(sections.map(loadUkrNetNews));
	const result = {
		created: moment().toISOString(),
		news,
		messages,
	};
	const sResult = JSON.stringify(result, null, '\t');
	fs.writeFileSync(`${outputDir}/ukrnet.json`, sResult);
	console.log('\nAll routes loaded');
};

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

try {
	loadAllNews();
} catch (error) {
	console.error(error);
}
