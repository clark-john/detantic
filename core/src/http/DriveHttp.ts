import {
	DeleteFilesResponse,
	ListFilesRequest,
	ListFilesResponse
} from "src/types";
import { RequestSender } from "./RequestSender";

export class DriveHttp extends RequestSender {
	constructor(drive: string, key: string) {
		super(key, projId => {
			return `https://drive.deta.sh/v1/${projId}/${drive}`;
		});
	}

	async putFile(name: string, data: Buffer) {
		await this.post("/files", {
			query: {
				name
			},
			body: new Blob([data])
		});
		return null;
	}

	async initializeChunkedUpload(name: string): Promise<string> {
		return (await this.post("/uploads", { query: { name } })).upload_id;
	}

	async uploadChunkedPart(
		uploadId: string,
		name: string,
		data: Buffer,
		part: number
	) {
		await this.post("/uploads/" + uploadId + "/parts", {
			query: { name, part },
			body: new Blob([data])
		});
		return null;
	}

	async completeChunkedUpload(uploadId: string, name: string) {
		await this.patch("/uploads/" + uploadId, { query: { name } });
		return null;
	}

	async abortChunkedUpload(uploadId: string, name: string) {
		await this.delete("/uploads/" + uploadId, { query: { name } });
		return null;
	}

	async downloadFile(name: string): Promise<Blob> {
		return await this.get("/files/download", { query: { name }, responseType: 'blob' });
	}

	async listFiles(ls: ListFilesRequest): Promise<ListFilesResponse> {
		return await this.get("/files", { query: ls });
	}

	async deleteFiles(names: string[]): Promise<DeleteFilesResponse> {
		return await this.delete("/files", {
			body: { names }
		});
	}
}
