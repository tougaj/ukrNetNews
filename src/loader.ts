'use strict';

import { IUkrNetNews, IUkrNetResponse } from './interfaces';

const nodeFetch = require('node-fetch');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');
const moment = require('moment');

const outputDir = './output';
const MESSAGES_MAX_COUNT = 50;
const MAX_LENGTH = {
	title: 200,
	description: 1000,
};

const proxy = 'http://192.168.0.1:3128';
const proxyAgent = new HttpsProxyAgent(proxy);

// const getFileName = () => moment().format('YYYYMMDD_HHmmss') + '.json';

const getNews = (tops: IUkrNetNews[], maxCount = MESSAGES_MAX_COUNT) => {
	const news = tops.slice(0, maxCount).map(({ Title, Description, DateCreated, NewsCount }) => ({
		title: Title.substring(0, MAX_LENGTH.title),
		description: Description.substring(0, MAX_LENGTH.description),
		created: moment(DateCreated * 1000).toISOString(),
		count: NewsCount,
	}));
	return news;
};

const loadUkrNetNews = (route: string) =>
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
				tops: getNews(tops),
			};
		});
// .catch((error) => console.error(error));

const loadAllNews = async () => {
	const news = await Promise.all(
		['main', 'politics', 'economics', 'criminal', 'world', 'society', 'kyiv'].map(loadUkrNetNews)
	);
	const result = {
		created: moment().toISOString(),
		news,
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
