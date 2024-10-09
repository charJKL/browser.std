
type ErrorIds<T> = { new (...args: any) : T }
export function isError<T extends ErrorIds<V>, V>(type: T, value: V) : value is InstanceType<T>
{
	if(value instanceof type) return true;
	return false;
}