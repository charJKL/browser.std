
/**
 * Base class for all errors returned from API calls.
 */
export abstract class BrowserApiError<ID, I>
{
	/**
	 * Because TS is `structurally typed`, we must use hack field `Id` as discriminate property, 
	 * that way type system would be able to to disgistish between concrete implementation of error. 
	 * Read more on https://www.typescriptlang.org/docs/handbook/2/classes.html#relationships-between-classes.
	 */
	// @ts-ignore 
	private id: ID;
	private info : I
	
	constructor(info: I)
	{
		this.info = info;
	}
}
