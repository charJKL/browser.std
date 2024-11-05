export function isTrue(value: unknown) : value is boolean
{
	return typeof value === "boolean" && value;
}
export function isFalse(value: unknown): value is boolean
{
	return typeof value === "boolean" && !value;
}