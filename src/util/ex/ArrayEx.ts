import { safeCast } from "@src/util/Func";
import { AllowBeAsync } from "@src/util/Helpers";

export class ArrayEx // eslint-disable-line @typescript-eslint/no-extraneous-class -- there is not other way to implement it
{
	public static IsEmpty<T>(array: Array<T>) : boolean
	{
		return array.length === 0;
	}
	
	public static SortAscending(array: Array<number>) : Array<number>
	{
		if(ArrayEx.IsEmpty(array)) return array;
		return array.sort((a, b) => a - b);
	}
	
	public static AsyncMap<T, V>(array: Array<T>, callbackfn: (value: T, index: number, array: Array<T>) => AllowBeAsync<V>, thisArg?: unknown) : Promise<Array<V | Error>>
	{
		const waitingResult = array.map(callbackfn, thisArg);
		const unwrapSettledValue = (result: PromiseSettledResult<V>) => result.status === "fulfilled" ? result.value : new Error(safeCast<any, string>(result.reason));
		const resolveSettledValues = (results: PromiseSettledResult<V>[]) => results.map(unwrapSettledValue);
		return  Promise.allSettled(waitingResult).then(resolveSettledValues);
	}
	
	public static TransformError<T, F extends Error>(array: Array<T | Error>, toError: (error: Error) => F) : Array<T | F>
	{
		return array.map(value => value instanceof Error ? toError(value) : value);
	}
	
}