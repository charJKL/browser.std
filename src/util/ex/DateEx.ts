
export class DateEx
{
	public static getTimestamp(): number
	{
		return Math.floor(Date.now() / 1000);
	}
}