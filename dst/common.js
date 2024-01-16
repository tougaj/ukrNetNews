"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNews = exports.sleep = exports.UKRNET_SECTIONS = exports.OUTPUT_DIR = void 0;
const moment_1 = __importDefault(require("moment"));
exports.OUTPUT_DIR = './output';
const MESSAGES_MAX_COUNT = 50;
const MAX_LENGTH = {
    title: 200,
    description: 1000,
};
exports.UKRNET_SECTIONS = [
    { route: 'main', longTitle: 'Головні події України та світу' },
    { route: 'russianaggression', longTitle: 'Війна РФ проти України' },
    { route: 'politics', longTitle: 'Політичні новини країни' },
    { route: 'economics', longTitle: 'Економіка та бізнес' },
    // { route: 'covid19', longTitle: 'Коронавірус COVID-19' },
    { route: 'criminal', longTitle: 'Оперативно про надзвичайні події' },
    { route: 'society', longTitle: 'Соціальні та культурні події' },
    { route: 'world', longTitle: 'Ситуація в світі' },
    { route: 'kyiv', longTitle: 'Київ' },
    { route: 'vinnytsya', longTitle: 'Вінниця' },
    { route: 'lutsk', longTitle: 'Волинь' },
    { route: 'dnipro', longTitle: 'Дніпро' },
    { route: 'donetsk', longTitle: 'Донецьк' },
    { route: 'zhytomyr', longTitle: 'Житомир' },
    { route: 'uzhgorod', longTitle: 'Закарпаття' },
    { route: 'zaporizhzhya', longTitle: 'Запоріжжя' },
    { route: 'ivano_frankivsk', longTitle: 'Івано-Франківськ' },
    { route: 'kropivnitskiy', longTitle: 'Кропивницький' },
    { route: 'luhansk', longTitle: 'Луганськ' },
    { route: 'lviv', longTitle: 'Львів' },
    { route: 'mikolayiv', longTitle: 'Миколаїв' },
    { route: 'odesa', longTitle: 'Одеса' },
    { route: 'poltava', longTitle: 'Полтава' },
    { route: 'rivne', longTitle: 'Рівне' },
    { route: 'sumy', longTitle: 'Суми' },
    { route: 'ternopil', longTitle: 'Тернопіль' },
    { route: 'kharkiv', longTitle: 'Харків' },
    { route: 'kherson', longTitle: 'Херсон' },
    { route: 'hmelnitskiy', longTitle: 'Хмельницький' },
    { route: 'cherkasy', longTitle: 'Черкаси' },
    { route: 'chernihiv', longTitle: 'Чернігів' },
    { route: 'chernivtsi', longTitle: 'Чернівці' },
    { route: 'crimea', longTitle: 'Крим' },
    // { route: 'kyiv', longTitle: 'Події в Києві та області' },
    // { route: 'dnipro', longTitle: 'Події в Дніпрі та області' },
    // { route: 'zaporizhzhya', longTitle: 'Події в Запоріжжі та області' },
    // { route: 'mikolayiv', longTitle: 'Події в Миколаєві та області' },
    // { route: 'odesa', longTitle: 'Події в Одесі та області' },
    // { route: 'kharkiv', longTitle: 'Події в Харкові та області' },
    // { route: 'kherson', longTitle: 'Події в Херсоні та області' },
    // { route: 'crimea', longTitle: 'Події в Криму' },
    // { route: 'donetsk', longTitle: 'Події в Донецьку та області' },
    // { route: 'luhansk', longTitle: 'Події в Луганську та області' },
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const getNews = (messages, tops, maxCount = MESSAGES_MAX_COUNT) => {
    const news = tops
        .slice(0, maxCount)
        .map(({ Title = '', Description = '', DateCreated, NewsCount, NewsId }) => {
        if (messages[NewsId] === undefined)
            messages[NewsId] = {
                title: Title.substring(0, MAX_LENGTH.title),
                description: Description.substring(0, MAX_LENGTH.description),
                created: (0, moment_1.default)(DateCreated * 1000).toISOString(),
                count: NewsCount,
            };
        return NewsId;
    });
    return news;
};
exports.getNews = getNews;
