type Paging = {
	size: number;
	last: string;
};

export interface QueryResponse<T> {
	paging: Paging;
	items: T[];
}

export interface UpdateResponse<T> {
	key: string;
	set?: T;
	delete: (keyof T)[];
}

export interface PutResponse<T> {
	processed: { items: T[] };
	failed: { items: T[] };
}

export interface ListFilesResponse {
	paging: Paging;
	names: string[];
}

export interface DeleteFilesResponse {
	deleted: string[];
	failed: Record<string, string>;
}
