import { join } from "path/posix";
import { DriveHttp } from "../http/DriveHttp";
import {
	DeleteFilesResponse,
	ListFilesRequest,
	ListFilesResponse,
	UploadFileOptions
} from "src/types";
import { chunk as splitBytes } from "lodash";

export interface ListFileParams {
	includePaging: boolean;
	ls: ListFilesRequest;
}

/**
 * A class used to manage a drive with some extended functions.
 */
export class Storage {
	private http: DriveHttp;
	constructor(http: DriveHttp) {
		this.http = http;
	}

	/**
	 * Upload a file, which has its size lower than 10 MB.
	*/
	async uploadSmallFile({ name, directory = "", data }: UploadFileOptions) {
		const fullname = this.createFullname(name, directory);

		// not mebibytes
		const maxBytes = 10_000_000;

		if (data.byteLength > maxBytes) {
			throw new Error("A file must not be higher than 10 MB.");
		}
		await this.http.putFile(fullname, data);
		return fullname;
	}

	/**
	 * Upload a file with any size through some endpoints.
	*/
	async uploadFile({ name, directory = "", data }: UploadFileOptions) {
		const fullname = this.createFullname(name, directory);

		const uploadId = await this.http.initializeChunkedUpload(fullname);

		let part = 1;

		for (const chunk of splitBytes(data, 5 * 1024 * 1024)) {
			await this.http.uploadChunkedPart(
				uploadId,
				fullname,
				Buffer.from(chunk),
				part
			);
			part += 1;
		}

		await this.http.completeChunkedUpload(uploadId, fullname);
		return fullname;
	}

	/**
	 * Get a file by name from your drive and return its buffer.
	*/
	async getFile(name: string) {
		return Buffer.from(await (await this.http.downloadFile(name)).arrayBuffer());
	}

	/**
	 * Get a list of files from your drive.
	*/
	async listFiles(
		{ includePaging, ls = {} }: ListFileParams = { includePaging: false, ls: {} }
	): Promise<ListFilesResponse | string[]> {
		const resp = await this.http.listFiles(ls);
		if (includePaging) {
			return resp;
		}
		return resp.names;
	}

	/**
	 * Delete a list of files from your drive.
	*/
	async deleteFiles(
		names: string[],
		includeFailedFiles = false
	): Promise<DeleteFilesResponse | string[]> {
		const resp = await this.http.deleteFiles(names);
		if (includeFailedFiles) {
			return resp;
		}
		return resp.deleted;
	}

	/**
	 * A private function used to check the name and create a full name together with the directory.
	*/
	private createFullname(name: string, directory: string) {
		if (name.match(/[\\/]/)) {
			throw new Error("File shouldn't contain slashes.");
		}

		if (directory.startsWith("/")) {
			directory = directory.substring(1);
		}

		return join(directory, name);
	}
}
