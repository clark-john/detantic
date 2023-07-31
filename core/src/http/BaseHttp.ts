import { BaseModel } from "..";
import {
	QueryResponse,
	QueryItemsRequest,
	UpdateResponse,
	PutResponse,
	BaseModelWithKey
} from "../types";
import { RequestSender } from "./RequestSender";
import { idToKey } from "../utils";
import { StatusCodes } from 'http-status-codes';

export class BaseHttp extends RequestSender {
	constructor(base: string, key: string) {
		super(key, projectId => {
			return `https://database.deta.sh/v1/${projectId}/${base}`;
		});
	}

	async queryItems<T>(
		req: QueryItemsRequest<T>
	): Promise<QueryResponse<BaseModelWithKey<T>>> {
		req.query?.map(x => {
			if ((x as { id: string }).id) {
				return idToKey(x as any);
			} else {
				return x;
			}
		});
		return await this.post("/query", { body: req });
	}

	async getByKey<T>(key: string): Promise<BaseModelWithKey<T>> {
		return await this.get("/items/" + key);
	}

	async insertItem<T extends BaseModel>(obj: T) {
		return await this.post("/items", {
			body: {
				item: idToKey(obj)
			},
			onResponseError(context) {
				const status = context.response.status;
				if (status === StatusCodes.CONFLICT) {
					throw new Error("A key already exists.");
				}
			},
		});
	}

	async updateItem<T>(
		updates: T,
		key: string
	): Promise<UpdateResponse<BaseModelWithKey<T>>> {
		return await this.patch("/items/" + key, {
			body: {
				set: {
					...updates
				}
			}
		});
	}

	async putItems<T extends BaseModel>(
		items: T[]
	): Promise<PutResponse<BaseModelWithKey<T>>> {
		return await this.put("/items", {
			body: {
				items: items.map(x => idToKey(x))
			}
		});
	}

	async deleteByKey(key: string) {
		await this.delete("/items/" + key);
		return null;
	}
}
