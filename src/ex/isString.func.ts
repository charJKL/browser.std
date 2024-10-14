export function isString(value: unknown) : value is string
{
	return typeof value === "string";
}
export function isNotString(value: unknown) : value is unknown
{
	return typeof value !== "string";
}