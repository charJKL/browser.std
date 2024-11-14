import { Api, BrowserNativeApiCallError, type ApiReturn } from "@src/api/Api";
import { isError } from "@src/util/Func";

// #region private types
type StorageBlueprint = { [key: string]: unknown }; // TODO supports only simple type.
type StorageBlueprintKeyName<B extends StorageBlueprint> = Exclude<keyof B, symbol | number>;
// #endregion

// TODO implement support for Map<>.
/**
 * LocalStorage
 */
export class LocalStorage<B extends StorageBlueprint>
{
	private readonly $blueprint: B;
	
	constructor(blueprint: B)
	{
		this.$blueprint = blueprint;
	}
	
	public async get<K extends StorageBlueprintKeyName<B>>(key: K) : ApiReturn<B[K], BrowserNativeApiCallError>
	{
		const entry = { [key]: this.$blueprint[key] }; 
		const result = await Api.storage.local.get(entry);
		if(isError(BrowserNativeApiCallError, result)) return result;
		return result as B[K]; // TODO does this casting safe?
	}
	
	public async save<K extends StorageBlueprintKeyName<B>>(key: K, value: B[K]) : ApiReturn<B[K], BrowserNativeApiCallError>
	{
		// TODO check if storage limit is exceeded.
		const entry = { [key]: value };
		const result = await Api.storage.local.set(entry);
		if(isError(BrowserNativeApiCallError, result)) return result;
		return value;
	}
	
	public async remove(key: StorageBlueprintKeyName<B>) : ApiReturn<boolean, BrowserNativeApiCallError>
	{
		const result = await Api.storage.local.remove(key);
		if(isError(BrowserNativeApiCallError, result)) return result;
		return true;
	}
}
