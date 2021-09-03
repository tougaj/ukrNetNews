export interface ISection {
	route: string;
	longTitle: string;
}

export interface IUkrNetSection extends ISection {
	title: string;
	tops: number[];
}

export interface IUkrNetNews {
	Title: string;
	Description: string;
	DateCreated: number;
	NewsCount: number;
	NewsId: number;
}

export interface IUkrNetResponse {
	Title: string;
	tops: IUkrNetNews[];
}

export interface INews {
	title: string;
	description: string;
	created: string;
	count: number;
}
