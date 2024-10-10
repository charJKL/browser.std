import { isFunction, isNotNull, isString } from "../ex";

/**
 * Base class for all errors returned from API calls.
 */
export abstract class BrowserApiError<ID, API, I>
{
	/**
	 * Because TS is `structurally typed`, we must use hack field `Id` as discriminate property, 
	 * that way type system would be able to to disgistish between concrete implementation of error. 
	 * Read more on https://www.typescriptlang.org/docs/handbook/2/classes.html#relationships-between-classes.
	 */
	// @ts-ignore 
	private id: ID;
	private api: API;
	private message: string;
	private info : I;
	private cause: BrowserApiError<any, any, any> | Error | null;
	
	constructor(api: API, message: string, info: I)
	constructor(api: API, message: string, info: I, cause: BrowserApiError<any, any, any>)
	constructor(api: API, func: Function, info: I, cause: string)
	constructor(api: API, message: string | Function, info: I, cause?: BrowserApiError<any, any, any> | string)
	{
		this.api = api;
		this.message = isFunction(message) ? `Internal function \`${message.name}\` throw exception.` : message;
		this.info = info;
		this.cause = isNotNull(cause) ? isString(cause) ? new Error(cause) : cause : null;
	}
}
