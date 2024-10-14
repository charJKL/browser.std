
type func = (...args: unknown[]) => unknown

export function isFunction(value: unknown) : value is func
{
	return typeof value === "function";
}