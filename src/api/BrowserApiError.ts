import { StdError } from "$src/util/StdError";

/**
 * Base class for all errors returned from API calls.
 */
export abstract class BrowserApiError<T extends string, I extends object> extends StdError<T, I>
{
	
}
