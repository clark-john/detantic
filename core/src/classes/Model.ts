import { validate } from "class-validator";
import { BaseModel } from "./BaseModel";
import { randomUUID } from "crypto";
import { BaseHttp } from "../http/BaseHttp";
import { keyToId } from "../utils";
import { isEqual, merge, set } from "lodash";
import { ValidationError } from "../errors/ValidationError";
import { ModelErrors } from "src/types";

type NoId<T extends BaseModel> = Omit<T, "id">;
type ValidateObj<T extends BaseModel> =
	| T
	| Partial<T>
	| NoId<T>
	| Partial<NoId<T>>;

// objectData can be a value from Model's findOne
interface ModifyOptions<T> { 
	fetchId: boolean, 
	objectData?: Partial<T> | null
}

/**
 * A class used to manage a base with some extended functions.
 */
export class Model<T extends BaseModel> {
	classSchema: BaseModel;
	http: BaseHttp;

	constructor(classInst: BaseModel, http: BaseHttp) {
		this.classSchema = classInst;
		this.http = http;
	}

	/**
	 * Insert a single item
	 */
	async insert(obj: NoId<T>, id?: string): Promise<T> {
		const o = obj as T;
		o.id = randomUUID();
		if (id) {
			o.id = id;
		}
		const errors = await this.validate(o);
		if (errors.length) {
			throw new ValidationError(errors);
		}
		return keyToId(await this.http.insertItem(o));
	}

	/**
	 * Insert several items at the same time
	 */
	async insertMany(items: NoId<T>[]): Promise<T[]> {
		const valproms: Promise<any>[] = [];

		items.forEach(x => {
			(x as T).id = randomUUID();
			valproms.push(this.validate(x));
		});

		await Promise.all(valproms);

		return (await this.http.putItems(items as T[])).processed.items.map(x => keyToId(x));
	}

	/**
	 * Find single item using a query
	 */
	async findOne(obj: Partial<T> = {}): Promise<T | null> {
		const errs = await this.validate(obj, true);

		if (isEqual(obj, {})) {
			return null;
		}

		if (errs.length) {
			throw new ValidationError(errs as any);
		}

		const item = (
			await this.http.queryItems({ query: [obj], limit: 1 })
		).items.at(0);

		if (item) {
			return keyToId(item) as T;
		} else {
			return null;
		}
	}

	/**
	 * Find several items by query
	 */
	async findMany(obj: Partial<T> = {}, options?: { limit: number }): Promise<T[]> {
		const errs = await this.validate(obj, true);
		
		const opts = { query: [obj] };
		
		if (errs.length) {
			throw new ValidationError(errs);
		}
		
		if (options?.limit) {
			set(opts, "limit", options.limit);
		}

		const items = (await this.http.queryItems(opts)).items;
		return items.map(x => keyToId(x) as T);
	}

	/**
	 * Delete an item by key, returns an item deleted otherwise null if not found
	 */
	async deleteById(key: string, options: ModifyOptions<T> = { fetchId: true }): Promise<T | null> {
		const { fetchId, objectData } = options;
		
		let item: T;

		if (!fetchId) {
			if (!objectData) {
				throw new Error("Object data is required if fetchId is false");
			}
			item = objectData as T;
		} else {
			try {
				item = keyToId(await this.http.getByKey(key)) as T;
			} catch (e) {
				return null;
			}
		}

		await this.http.deleteByKey(key);
		return item;
	}

	/**
	 * Delete items at the same time in a single query
	 */
	async deleteMany(query: Partial<T>): Promise<T[]> {
		const errs = await this.validate(query, true);

		if (errs.length) {
			throw new ValidationError(errs as ModelErrors[]);
		}

		const deleteProms = [];
		const { items } = await this.http.queryItems({ query: [query] });
		const itemsToReturn: T[] = [];

		items.forEach(x => {
			deleteProms.push(this.http.deleteByKey(x.key));
			itemsToReturn.push(keyToId(x) as T);
		});

		return itemsToReturn;
	}

	/**
	 * update an item using a key
	 */
	async updateById(
		updates: Partial<NoId<T>>,
		id: string,
		options: ModifyOptions<T> = { fetchId: true }
	): Promise<T | null> {

		const { fetchId, objectData } = options;
		const errs = await this.validate(updates, true);

		if (errs.length) {
			throw new ValidationError(errs as any);
		}

		const proms: Promise<any>[] = [
			this.http.updateItem(updates, id)
		];

		if (fetchId) {
			try {
				proms.splice(0, 0, this.http.getByKey(id));
			} catch (e) {
				return null;
			}
		}

		if (!fetchId && !objectData) {
			throw new Error("Object data is required if fetchId is false");
		}

		const [mainObj] = await Promise.all(proms);

		return merge(fetchId ? keyToId(mainObj) : objectData, updates) as T;
	}

	/**
	 * update items in a single query
	 */
	async updateMany(
		query: Partial<T>,
		updates: Partial<NoId<T>>
	): Promise<T[]> {
		const updateProms: Promise<any>[] = [];

		const errs = await this.validate(query, true);

		if (errs.length) {
			throw new ValidationError(errs);
		}

		const { items } = await this.http.queryItems({ query: [query] });

		const itemsToReturn: T[] = [];

		items.forEach(x => {
			updateProms.push(this.http.updateItem(updates, x.key));
			itemsToReturn.push(merge(keyToId(x), updates) as T);
		});

		await Promise.all(updateProms);

		return itemsToReturn;
	}

	/**
	 * private function used to validate objects from desired class schema
	 */
	private validate(
		obj: ValidateObj<T>,
		partial: boolean = false
	): Promise<ModelErrors[]> {
		const modelInst = this.classSchema;
		Object.assign(modelInst, obj);

		const errors: ModelErrors[] = [];

		return new Promise(res => {
			validate(modelInst, {
				skipMissingProperties: partial,
				skipNullProperties: partial,
				skipUndefinedProperties: partial
			}).then(errs => {
				errs.forEach(x => {
					if (x.constraints) {
						const obj = x.constraints as ModelErrors;
						obj.property = x.property;
						errors.push(obj);
					}
				});
				res(errors);
			});
		});
	}
}
