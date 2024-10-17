
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
	
	public static AsyncMap<T, V>(array: Array<T>, callbackfn: (value: T, index: number, array: Array<T>) => Promise<V>, thisArg?: unknown) : Promise<PromiseSettledResult<V>[]>
	{
		const result = array.map(callbackfn, thisArg);
		return Promise.allSettled(result);
	}
}