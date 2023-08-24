import { IsString, IsNotEmpty } from "class-validator";

/**
 * This class is used as a base class to extend schemas/models from
 */
export class BaseModel {
	@IsString()
	@IsNotEmpty()
	id: string;

	/**
	 * static function used to return a new instance itself
	 * @deprecated
	 */
	static createSchema() {
		return new this;
	}
}
