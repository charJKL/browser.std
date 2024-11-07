export function isSymbol(value: unknown) : value is symbol
{
	return typeof value === "symbol";
}
export function isNotSymbol(value: unknown) : value is unknown
{
	return typeof value !== "symbol";
}