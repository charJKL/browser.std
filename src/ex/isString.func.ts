export function isString(value: any) : value is string
{
	return typeof value === "string";
}
export function isNotString(value: any) : value is unknown
{
	return typeof value !== "string";
}