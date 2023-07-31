export interface QueryItemsRequest<T> {
	query?: T[];
	limit?: number;
	last?: string;
}

export interface ListFilesRequest {
	limit?: number;
	prefix?: string;
	last?: string;
}
