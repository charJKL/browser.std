export function isObject(value: unknown) : value is object
{
	return typeof value === "object";
}
export function isNotObject(value: unknown) : value is unknown
{
	return typeof value !== "object";
}
