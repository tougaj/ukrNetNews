'use strict';

const fetch = require('node-fetch');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');
const moment = require('moment');

const outputDir = './output';

const proxy = 'http://192.168.0.1:3128';
const proxyAgent = new HttpsProxyAgent(proxy);

// const getFileName = () => moment().format('YYYYMMDD_HHmmss') + '.json';

const getNews = (tops) => {
	const news = tops.map(({ Title, Description, DateCreated, NewsCount }) => ({
		title: Title,
		description: Description,
		created: moment(DateCreated * 1000).toISOString(),
		count: NewsCount,
	}));
	return news;
};

// 212.42.76.252
const loadUkrNetNews = (route) =>
	fetch(`https://www.ukr.net/news/dat/${route}/0/`, {
		agent: proxyAgent,
	})
		.then((data) => data.json())
		.then((json) => {
			const { tops, Title } = json;
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
	const sResult = JSON.stringify(news, null, '\t');
	fs.writeFileSync(`${outputDir}/ukrnet`, sResult);
	console.log('\nAll routes loaded');
};

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

try {
	loadAllNews();
} catch (error) {
	console.error(error);
}
