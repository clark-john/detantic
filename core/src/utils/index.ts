import { unset } from "lodash";
import { BaseModel } from "..";
import { BaseModelWithKey } from "src/types";

export function keyToId<T extends BaseModel>(
	obj: T | Partial<T> | BaseModelWithKey<T>
): T {
	const id = (obj as BaseModelWithKey<T>).key;
	unset(obj, "key");
	(obj as T).id = id!;
	return obj as T;
}

// for http reqs
export function idToKey<T extends BaseModel>(obj: T | Partial<T>): T {
	const id = obj.id;
	unset(obj, "id");
	(obj as T & { key: string }).key = id!;
	return obj as T;
}
