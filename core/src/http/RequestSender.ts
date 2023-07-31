import { $Fetch, FetchOptions, ofetch } from "ofetch";

type NoMethodOptions = Omit<FetchOptions, "method">;

export class RequestSender {
	protected url: string;
	protected fetcher: $Fetch;

	constructor(key: string, urlCreator: (projectId?: string) => string) {
		const [projectId] = key.split("_");

		const headers = new Headers({
			"Content-Type": "application/json",
			"X-Api-Key": key
		});

		this.url = urlCreator(projectId);

		this.fetcher = ofetch.create({
			baseURL: urlCreator(projectId),
			headers
		});
	}

	/**
	 * Get method
	 */
	protected async get(path: string, options?: NoMethodOptions) {
		return await this.request(path, "GET", options);
	}
	/**
	 * Put method
	 */
	protected async put(path: string, options?: NoMethodOptions) {
		return await this.request(path, "PUT", options);
	}
	/**
	 * Post method
	 */
	protected async post(path: string, options?: NoMethodOptions) {
		return await this.request(path, "POST", options);
	}
	/**
	 * Patch method
	 */
	protected async patch(path: string, options?: NoMethodOptions) {
		return await this.request(path, "PATCH", options);
	}
	/**
	 * Delete method
	 */
	protected async delete(path: string, options?: NoMethodOptions) {
		return await this.request(path, "DELETE", options);
	}
	/**
	 * main HTTP Request
	 */
	private async request(
		path: string,
		method: string,
		options?: NoMethodOptions
	) {
		return await this.fetcher(path, {
			method,
			...options
		});
	}
}
