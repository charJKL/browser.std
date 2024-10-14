export function isUndefined<T>(value: T | undefined) : value is undefined // eslint-disable-line @typescript-eslint/no-unnecessary-type-parameters -- there is no other way to implement it, 
{
	if(typeof value === "undefined") return true;
	return false;
}
export function isNotUndefined<T>(value: T | undefined) : value is T
{
	if(typeof value !== "undefined") return true;
	return false;
}


