export function isArray<T>(value: unknown) : value is T[]
{
	return Array.isArray(value);
}
export function isNotArray<T>(value: T) : value is Exclude<T, unknown[]>
{
	return Array.isArray(value) === false; // eslint-disable-line @typescript-eslint/no-unnecessary-boolean-literal-compare -- it's matter of code style
}