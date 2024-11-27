import { Api, BrowserNativeApiCallError } from "@src/api/Api";
import { hasProp, isError, unsafeCast } from "@src/util/Func";
import { ApiReturn } from "@src/util/Helpers";

// #region private types
type DataPrimitive = { [key: string] : DataPrimitive } | Array<DataPrimitive> | string | number | boolean;
type Data = DataPrimitive | Map<string, DataPrimitive>;
type StorageBlueprint = { [key: string]: Data };
type StorageBlueprintKeyName<B extends StorageBlueprint> = Exclude<keyof B, symbol | number>;
// #endregion

// errors
export { BrowserNativeApiCallError } from "@src/api/Api";

interface ISerializer<T extends Data>
{
	serialize(value: T) : Data
  deserialize(value: unknown) : unknown
}

/**
 * LocalStorage
 */
export class LocalStorage<B extends StorageBlueprint>
{
	// TODO support for Map<,> is not perfect, Map<,> is allowed only on first key.
	private readonly $blueprint: B;
	private readonly $serializers: Array<ISerializer<Data>>;
	
	constructor(blueprint: B)
	{
		this.$blueprint = blueprint;
		this.$serializers = [new MapSerializer()];
	}
	
	public async set<K extends StorageBlueprintKeyName<B>>(key: K, value: B[K]) : ApiReturn<B[K], BrowserNativeApiCallError>
	{
		// TODO check if storage limit is exceeded.
		const entry = { [key]: value };
		const serializedValue = this.serialize(entry);
		const result = await Api.storage.local.set(serializedValue);
		if(isError(BrowserNativeApiCallError, result)) return result;
		return value;
	}
	
	public async get<K extends StorageBlueprintKeyName<B>>(key: K) : ApiReturn<B[K], BrowserNativeApiCallError>
	{
		const entry = { [key]: this.$blueprint[key] }; 
		const result = await Api.storage.local.get(entry);
		if(isError(BrowserNativeApiCallError, result)) return result;
		const deserializedValue = this.deserialize(result);
		const safeResult = unsafeCast<unknown, B[K]>(deserializedValue[key]); // TODO check if returned value conform wanted type.
		return safeResult;
	}
	
	public async remove(key: StorageBlueprintKeyName<B>) : ApiReturn<boolean, BrowserNativeApiCallError>
	{
		const result = await Api.storage.local.remove(key);
		if(isError(BrowserNativeApiCallError, result)) return result;
		return true;
	}
	
	private serialize(blueprint: StorageBlueprint) : StorageBlueprint
	{
		for(const [key, value] of Object.entries(blueprint))
		{
			for(const serializer of this.$serializers)
			{
				blueprint[key] = serializer.serialize(value);
			}
		}
		return blueprint;
	}
	
	private deserialize(blueprint: { [key: string]: unknown }) : { [key: string]: unknown }
	{
		for(const [key, value] of Object.entries(blueprint))
		{
			for(const serializer of this.$serializers)
			{
				blueprint[key] = serializer.deserialize(value);
			}
		}
		return blueprint;
	}
}

type EncodedMap = { [MapSerializer.$propertyName]: true, entries: Array<{key: string, value: DataPrimitive}> };
/**
 * MapSerializer
 */
class MapSerializer implements ISerializer<Map<string, DataPrimitive>>
{
	// TODO DRY `CommProtocol` also have Map<> serializer.
	static readonly $propertyName = "__map__";
	
	public serialize(value: Data): Data
	{
		if(this.isMapInstance(value))
		{
			const map : EncodedMap = { [MapSerializer.$propertyName]: true, entries: [] };
			value.forEach((value, key) => map.entries.push({key, value}));
			return map;
		}
		return value;
	}
	
	public deserialize(value: unknown): unknown
	{
		if(this.isEncodedMapInstance(value))
		{
			const map = new Map();
			value.entries.forEach((entry) => map.set(entry.key, entry.value));
			return map;
		}
		return value;
	}
	
	private isMapInstance(value: Data) : value is Map<string, DataPrimitive>
	{
		if(value instanceof Map) return true;
		return false
	}
	
	private isEncodedMapInstance(value: unknown) : value is EncodedMap
	{
		if(hasProp(value, MapSerializer.$propertyName) && hasProp(value, "entries")) return true;
		return false;
	}
}