import { BrowserApiError } from "src/api/BrowserApiError";
import { type ApiReturn } from "src/api/ApiReturn.type";

// #region private types
type StorageArea = browser.storage.StorageArea;
type StorageBlueprint = { [key: string]: unknown }; // TODO supports only simple type.
type StorageBlueprintKeyName<B extends StorageBlueprint> = Exclude<keyof B, symbol | number>;
// #endregion

// #region errors
class StorageError<ID extends string, I extends object> extends BrowserApiError<ID, Storage<StorageBlueprint>, I>{ };
export class StorageApiCallError extends StorageError<"StorageApiCallError", object>{ };
// #endregion 

// #region Storage
// TODO implement support for Map<>.
export class Storage<B extends StorageBlueprint>
{
	private readonly $storage: StorageArea;
	private readonly $blueprint: B;
	
	constructor(storage: StorageArea, blueprint: B)
	{
		this.$storage = storage;
		this.$blueprint = blueprint;
	}
	
	public get<K extends StorageBlueprintKeyName<B>>(key: K) : ApiReturn<B[K], StorageApiCallError>
	{
		const entry = { key: this.$blueprint[key] }; 
		const flatternReturnedObject = (obj: StorageBlueprint) : B[K] => obj[key] as B[K]; // TODO does casting is nessessary?
		const returnError = (reason: unknown) => new StorageApiCallError(this, "Browser internal api call `storage.get()` throw error", {key, entry}, reason);
		return this.$storage.get(entry).then(flatternReturnedObject).catch(returnError);
	}
	
	public save<K extends StorageBlueprintKeyName<B>>(key: K, value: B[K]) : ApiReturn<B[K], StorageApiCallError>
	{
		// TODO check if storage limit is exceeded.
		const entry = { [key]: value };
		const returnSavedObject = () => value;
		const returnError = (reason: unknown) => new StorageApiCallError(this, "Browser internal api call `storage.set()` throw error", {key, value, entry}, reason);
		return this.$storage.set(entry).then(returnSavedObject).catch(returnError);
	}
	
	public remove<K extends StorageBlueprintKeyName<B>>(key: K) : ApiReturn<boolean, StorageApiCallError> // eslint-disable-line @typescript-eslint/no-unnecessary-type-parameters -- matter of code style
	{
		const returnTrueOnSucess = () => true;
		const returnError = (reason: unknown) => new StorageApiCallError(this, "Browser internal api call `storage.remove()` throw error", {key}, reason);
		return this.$storage.remove(key).then(returnTrueOnSucess).catch(returnError);
	}
}

