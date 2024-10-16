import { isNotUndefined } from "../ex";

/**
 * Base class for all errors returned from API calls.
 */
export abstract class StdError<ID extends string, I extends object> extends Error
{
	/**
	 * Because TS is `structurally typed`, we must use hack field `Id` as discriminate property, 
	 * that way type system would be able to to disgistish between concrete implementation of error. 
	 * Read more on https://www.typescriptlang.org/docs/handbook/2/classes.html#relationships-between-classes.
	 */
	// @ts-expect-error: reason is in the comment above.
	private id: ID;
	private message: string;
	private info : I;
	private cause: unknown;
	
	constructor(message: string, info: I, cause?: unknown)
	{
		this.message = message;
		this.info = info;
		this.cause = isNotUndefined(cause) ? cause : null;
	}
}
