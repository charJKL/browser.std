
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
}