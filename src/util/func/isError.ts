
/**
 * ErrorIds<T> reference to all classes which can provide instance of T. 
 * In function we don't create instance of those classes hence using `any`
 * here is okey.
 * 
 * We can't use `unknown` here because then construction parameters won't
 * match signature bacause noting can be assigned to `unknown`.
 */
type ErrorIds<T> = { new (...args: any[]) : T } // eslint-disable-line @typescript-eslint/no-explicit-any -- reason is in comment above

export function isError<T extends ErrorIds<V>, V>(type: T, value: V) : value is InstanceType<T>
{
	if(value instanceof type) return true;
	return false;
}