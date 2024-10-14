export function isNull(value: unknown) : value is null 
{
	if(typeof value === "object" && value === null) return true;
	return false;
}
export function isNotNull<T>(value: T | null) : value is NonNullable<T>
{
	if(typeof value === "object" && value === null) return false;
	return true;
}