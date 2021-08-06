'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const getNews = (tops, maxCount = MESSAGES_MAX_COUNT) => {
    const news = tops.slice(0, maxCount).map(({ Title, Description, DateCreated, NewsCount }) => ({
        title: Title.substring(0, MAX_LENGTH.title),
        description: Description.substring(0, MAX_LENGTH.description),
        created: moment(DateCreated * 1000).toISOString(),
        count: NewsCount,
    }));
    return news;
};
const loadUkrNetNews = (route) => nodeFetch(`https://www.ukr.net/news/dat/${route}/0/`, {
    agent: proxyAgent,
})
    .then((data) => data.json())
    .then((data) => {
    const { tops, Title } = data;
    console.log(`${Title} (${route}) loaded`);
    return {
        route,
        title: Title,
        tops: getNews(tops),
    };
});
// .catch((error) => console.error(error));
const loadAllNews = () => __awaiter(void 0, void 0, void 0, function* () {
    const news = yield Promise.all(['main', 'politics', 'economics', 'criminal', 'world', 'society', 'kyiv'].map(loadUkrNetNews));
    const result = {
        created: moment().toISOString(),
        news,
    };
    const sResult = JSON.stringify(result, null, '\t');
    fs.writeFileSync(`${outputDir}/ukrnet.json`, sResult);
    console.log('\nAll routes loaded');
});
if (!fs.existsSync(outputDir))
    fs.mkdirSync(outputDir);
try {
    loadAllNews();
}
catch (error) {
    console.error(error);
}
