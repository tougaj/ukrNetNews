export interface IUkrNetNews {
	Title: string;
	Description: string;
	DateCreated: number;
	NewsCount: number;
}

export interface IUkrNetResponse {
	Title: string;
	tops: IUkrNetNews[];
}
