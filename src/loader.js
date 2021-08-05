'use strict';

const fetch = require('node-fetch');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');
const moment = require('moment');

const outputDir = './output';

const proxy = 'http://192.168.0.1:3128';
const proxyAgent = new HttpsProxyAgent(proxy);

const getFileName = () => moment().format('YYYYMMDD_HHmmss') + '.json';

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
			// let tops = json.tops.slice(0, 2);
			const tops = json.tops;

			const result = {
				route,
				news: getNews(tops),
			};

			const sResult = JSON.stringify(result, null, '\t');
			fs.writeFileSync(`${outputDir}/ukrnet_${route}_${getFileName()}`, sResult);
			console.log(`${route} loaded`);
		})
		.catch((error) => console.error(error));

const loadAllNews = async () => {
	await Promise.all(['main', 'politics', 'economics', 'criminal', 'world'].map(loadUkrNetNews));
	console.log('\nAll routes loaded');
};

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

loadAllNews();

// console.log(moment(1628158063 * 1000).toISOString());
