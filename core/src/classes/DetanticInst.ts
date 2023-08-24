import { DriveHttp } from "../http/DriveHttp";
import { BaseHttp } from "../http/BaseHttp";
import { BaseModel } from "./BaseModel";
import { Model } from "./Model";
import { Storage } from "./Storage";

/**
 * A class that is returned by Detantic function. It contains functions that are used to create models and storages.
 */
export class DetanticInst {
	key: string;
	constructor(key: string) {
		this.key = key;
	}

	/**
	 * a function used to create a model together with its schema.
	 */
	createModel<T extends BaseModel>(base: string, classInst: T) {
		return new Model<T>(classInst, new BaseHttp(base, this.key));
	}

	/**
	 * a function used to create a storage
	 */
	createStorage(drive: string) {
		return new Storage(new DriveHttp(drive, this.key));
	}
}
