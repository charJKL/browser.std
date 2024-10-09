
export class ArrayEx
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