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
const messages = {};
// const getFileName = () => moment().format('YYYYMMDD_HHmmss') + '.json';
const getNews = (tops, maxCount = MESSAGES_MAX_COUNT) => {
    const news = tops.slice(0, maxCount).map(({ Title, Description, DateCreated, NewsCount, NewsId }) => {
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
const loadUkrNetNews = ({ route, longTitle }) => nodeFetch(`https://www.ukr.net/news/dat/${route}/0/`, {
    agent: proxyAgent,
})
    .then((data) => data.json())
    .then((data) => {
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
const loadAllNews = () => __awaiter(void 0, void 0, void 0, function* () {
    const sections = [
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
    const news = yield Promise.all(sections.map(loadUkrNetNews));
    const result = {
        created: moment().toISOString(),
        news,
        messages,
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
