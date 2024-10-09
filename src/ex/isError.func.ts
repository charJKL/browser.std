type ErrorId = abstract new (...args: any) => any;

export function isError<T extends ErrorId>(type: T, value: any) : value is InstanceType<T>
{
	if(value instanceof type) return true;
	return false;
}
