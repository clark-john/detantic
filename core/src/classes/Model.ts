import { validate } from "class-validator";
import { BaseModel } from "./BaseModel";
import { randomUUID } from "crypto";
import { BaseHttp } from "../http/BaseHttp";
import { keyToId } from "../utils";
import { isEmpty, isEqual, merge, set } from "lodash";

type ModelErrors = Record<string, any>[];
type NoId<T extends BaseModel> = Omit<T, "id">;
type ValidateObj<T extends BaseModel> =
	| T
	| Partial<T>
	| NoId<T>
	| Partial<NoId<T>>;

type ModelReturn<T> = Promise<[T | null, ModelErrors | ModelErrors[] | null]>;

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
	async insert(obj: NoId<T>, id?: string): ModelReturn<T> {
		const o = obj as T;
		o.id = randomUUID();
		if (id) {
			o.id = id;
		}
		const errors = await this.validate(o);
		if (errors.length) {
			return [null, errors];
		}
		return [keyToId(await this.http.insertItem(o)), null];
	}

	/**
	 * Insert several items at the same time
	 */
	async insertMany(items: NoId<T>[]): ModelReturn<T[]> {
		const errors = await this.validateItems(items);

		items.forEach(x => {
			(x as T).id = randomUUID();
		});

		if (errors.some(x => isEmpty(x))) {
			return [
				(await this.http.putItems(items as T[])).processed.items.map(x =>
					keyToId(x as T)
				),
				null
			];
		} else {
			return [null, errors];
		}
	}

	/**
	 * Find single item using a query
	 */
	async findOne(obj: Partial<T> = {}): ModelReturn<T | object> {
		const errs = await this.validate(obj, true);
		if (isEqual(obj, {})) {
			return [{}, null];
		}
		if (errs.length) {
			return [null, errs];
		}
		const item = (
			await this.http.queryItems({ query: [obj], limit: 1 })
		).items.at(0);
		if (item) {
			return [keyToId(item), null];
		} else {
			throw new Error("Item not found");
		}
	}

	/**
	 * Find several items by query
	 */
	async findMany(obj: Partial<T> = {}, options?: { limit: number }): ModelReturn<T[]> {
		const errs = await this.validate(obj, true);
		const opts = { query: [obj] };
		if (errs.length) {
			return [null, errs];
		}
		if (options?.limit) {
			set(opts, "limit", options.limit);
		}
		const items = (await this.http.queryItems(opts)).items;
		return [items.map<T>(x => keyToId(x) as T), null];
	}

	/**
	 * Delete an item by key
	 */
	async deleteByKey(key: string) {
		const item = keyToId(await this.http.getByKey(key));
		await this.http.deleteByKey(key);
		return item;
	}

	/**
	 * Delete items at the same time in a single query
	 */
	async deleteMany(query: Partial<T>): ModelReturn<T[]> {
		const errs = await this.validate(query, true);

		if (errs) {
			return [null, errs];
		}

		const deleteProms = [];
		const { items } = await this.http.queryItems({ query: [query] });
		const itemsToReturn: T[] = [];

		items.forEach(x => {
			deleteProms.push(this.http.deleteByKey(x.key));
			itemsToReturn.push(keyToId(x) as T);
		});

		return [itemsToReturn, null];
	}

	/**
	 * update an item using a key
	 */
	async updateById(
		obj: Partial<NoId<T>>,
		id: string
	): Promise<T | ModelErrors> {
		const mainObj = keyToId(await this.http.getByKey(id));

		const errs = await this.validate(obj, true);
		console.log(errs);
		if (errs.length) {
			return errs;
		}

		await this.http.updateItem(obj, id);
		return merge(mainObj, obj) as T;
	}

	/**
	 * update items in a single query
	 */
	async updateMany(
		query: Partial<T>,
		updates: Partial<NoId<T>>
	): ModelReturn<T[]> {
		const updateProms: Promise<any>[] = [];

		const errs = await this.validate(query, true);

		if (errs.length) {
			return [null, errs];
		}

		const { items } = await this.http.queryItems({ query: [query] });

		const itemsToReturn: T[] = [];

		items.forEach(x => {
			updateProms.push(this.http.updateItem(updates, x.key));
			itemsToReturn.push(merge(keyToId(x), updates) as T);
		});

		await Promise.all(updateProms);

		return [itemsToReturn, null];
	}

	/**
	 * private function used to validate objects from desired class schema
	 */
	private validate(
		obj: ValidateObj<T>,
		partial: boolean = false
	): Promise<ModelErrors> {
		const modelInst = this.classSchema;
		Object.assign(modelInst, obj);

		const errors: ModelErrors = [];

		return new Promise(res => {
			validate(modelInst, {
				skipMissingProperties: partial,
				skipNullProperties: partial,
				skipUndefinedProperties: partial
			}).then(errs => {
				errs.forEach(x => {
					if (x.constraints) {
						const obj = x.constraints;
						obj.property = x.property;
						errors.push(x.constraints);
					}
				});
				res(errors);
			});
		});
	}

	/**
	 * Validate two or more items, it uses the private function validate
	 */
	private async validateItems(items: any[]) {
		const errors: ModelErrors[] = [];
		for (const x of items) {
			errors.push(await this.validate(x));
		}
		return errors;
	}
}
