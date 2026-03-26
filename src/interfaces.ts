export interface ISection {
	route: string;
	title?: string;
	longTitle: string;
}

export interface IUkrNetSection extends ISection {
	tops: string[];
}

// export interface IUkrNetNews {
// 	Title: string;
// 	Description: string;
// 	DateCreated: number;
// 	NewsCount: number;
// 	NewsId: number;
// }

// export interface IUkrNetResponse {
// 	Title: string;
// 	tops: IUkrNetNews[];
// }

export interface INews {
	title: string;
	description?: string;
	created?: string;
	count?: number;
}

export interface NewsItem {
	id: string;
	title: string;
}

export type TMessages = { [key: string]: INews };
