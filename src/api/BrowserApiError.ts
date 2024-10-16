import { StdError } from "../ex/StdError";

/**
 * Base class for all errors returned from API calls.
 */
export abstract class BrowserApiError<ID extends string, API, I extends object> extends StdError<ID, I>
{
	private api: API;
	
	constructor(api: API, message: string, info: I, cause?: unknown)
	{
		super(message, info, cause);
		this.api = api;
	}
}
