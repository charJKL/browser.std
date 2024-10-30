import { hasProp } from "src/util";

export interface IComparable<T>
{
	isEqual(this: T, obj: T): boolean;
}

/**
 * List of types which are easy comparable.
 */
type IsComperable = string | number | IComparable<unknown>;

/**
 * MultiMap
 */
export class MultiMap<K, V extends IsComperable>
{
	private readonly $map: Map<K, Array<V>>;
	
	public constructor()
	{
		this.$map = new Map();
	}
	
	public has(key: K) : boolean
	{
		return this.$map.has(key);
	}
	
	public get(key: K) : Array<V>
	{
		return this.$map.get(key) ?? [];
	}
	
	public set(key: K, value: V) : this
	{
		const values = this.$map.get(key) ?? [];
					values.push(value);
		this.$map.set(key, values);
		return this;
	}
	
	public delete(key: K, value: V) : this
	{
		const isComparable = (value: unknown) : value is IComparable<V> => hasProp(value, "isEqual");
		const values = this.$map.get(key) ?? [];
		const index = isComparable(value) ? values.findIndex(v => value.isEqual(v)) : values.indexOf(value);
		if(index >= 0) values.splice(index, 1);
		if(values.length === 0) this.$map.delete(key);
		return this;
	}
}
