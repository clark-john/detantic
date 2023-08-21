import { ModelErrors } from "src/types";

export class ValidationError extends Error {
	errors: ModelErrors[];
	constructor(errors: ModelErrors[], message?: string){
		super(message || "Invalid query");
		this.errors = errors;
	}
}
