import moment from 'moment';
import { ISection, IUkrNetNews, TMessages } from './interfaces';

export const OUTPUT_DIR = './output';
const MESSAGES_MAX_COUNT = 50;
const MAX_LENGTH = {
	title: 200,
	description: 1000,
};
export const UKRNET_SECTIONS: ISection[] = [
	{ route: 'russianaggression', longTitle: 'Війна РФ проти України' },
	{ route: 'politics', longTitle: 'Політичні новини країни' },
	{ route: 'economics', longTitle: 'Економіка та бізнес' },
	// { route: 'covid19', longTitle: 'Коронавірус COVID-19' },
	{ route: 'criminal', longTitle: 'Оперативно про надзвичайні події' },
	{ route: 'society', longTitle: 'Соціальні та культурні події' },
	{ route: 'world', longTitle: 'Ситуація в світі' },
	{ route: 'kyiv', longTitle: 'Події в Києві та області' },
	{ route: 'dnipro', longTitle: 'Події в Дніпрі та області' },
	{ route: 'zaporizhzhya', longTitle: 'Події в Запоріжжі та області' },
	{ route: 'mikolayiv', longTitle: 'Події в Миколаєві та області' },
	{ route: 'odesa', longTitle: 'Події в Одесі та області' },
	{ route: 'kharkiv', longTitle: 'Події в Харкові та області' },
	{ route: 'kherson', longTitle: 'Події в Херсоні та області' },
	{ route: 'crimea', longTitle: 'Події в Криму' },
	{ route: 'donetsk', longTitle: 'Події в Донецьку та області' },
	{ route: 'luhansk', longTitle: 'Події в Луганську та області' },
];

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getNews = (messages: TMessages, tops: IUkrNetNews[], maxCount = MESSAGES_MAX_COUNT) => {
	const news: number[] = tops
		.slice(0, maxCount)
		.map(({ Title = '', Description = '', DateCreated, NewsCount, NewsId }) => {
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
