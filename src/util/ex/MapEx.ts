
export class MapEx
{
	public static getUniqueKey<V>(map: Map<string, V>): string
	{
		const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
		let id = generateId();
		while(map.has(id)) id = generateId();
		return id;
	}
}