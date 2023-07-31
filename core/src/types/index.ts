export type BaseModelWithKey<T> = Omit<T & { key: string }, "id">;

export * from "./requests";
export * from "./responses";

export interface UploadFileOptions {
	name: string;
	directory?: string;
	data: Buffer;
}
