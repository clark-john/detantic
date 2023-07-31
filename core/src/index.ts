import { DetanticInst } from "./classes/DetanticInst";
import { Model } from "./classes/Model";
import { Storage } from "./classes/Storage";
import { BaseModel } from "./classes/BaseModel";
import isBrowser from "is-browser";

/**
 * This function is used to create an actual instance of Detantic
 */
export function Detantic(projKey?: string) {
	if (isBrowser) {
		throw new Error("Cannot run on browser.");
	}

	const key = projKey || process.env.DETA_PROJECT_KEY;

	if (!key) {
		throw new Error("Key not defined");
	}
	return new DetanticInst(key);
}

export * from './types';
export { Model, Storage, BaseModel };
