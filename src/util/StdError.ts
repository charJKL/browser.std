import { isNotUndefined } from "$src/util/func/isUndefined";

/**
 * Base class for all errors returned from API calls.
 */
export abstract class StdError<T extends string, I extends object> extends Error
{
	public readonly $type: T;
	private readonly $message: string;
	private readonly $info : unknown;
	private readonly $cause: unknown;
	
	constructor(type: T, message: string, info: I, cause?: unknown)
	{
		super();
		this.$type = type;
		this.$message = message;
		this.$info = info;
		this.$cause = isNotUndefined(cause) ? cause : null;
	}
}
