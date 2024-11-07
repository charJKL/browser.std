export function isNumber(value: unknown) : value is number
{
	return typeof value === "number";
}
export function isNotNumber<T>(value: T) : value is T
{
	return typeof value !== "number";
}