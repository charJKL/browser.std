import { BrowserApiError } from "../BrowserApiError";
import { type ApiReturn } from "../ApiReturn.type";

// #region private types
type StorageArea = browser.storage.StorageArea;
type StorageBlueprint = { [key: string]: unknown }; // TODO supports only simple type.
type StorageBlueprintKeyName<B extends StorageBlueprint> = Exclude<keyof B, symbol | number>;
// #endregion

// #region errors
class StorageError<ID, I> extends BrowserApiError<ID, Storage<any>, I>{ };
export class StorageApiCallError extends StorageError<"StorageApiCallError", {}>{ };
// #endregion 

// #region Storage
// TODO implement support for Map<>.
export class Storage<B extends StorageBlueprint>
{
	private storage: StorageArea;
	private blueprint: B;
	
	constructor(storage: StorageArea, blueprint: B)
	{
		this.storage = storage;
		this.blueprint = blueprint;
	}
	
	public get<K extends StorageBlueprintKeyName<B>>(key: K) : ApiReturn<B[K], StorageApiCallError>
	{
		const entry = { key: this.blueprint[key] }; 
		const flatternReturnedObject = (obj: StorageBlueprint) : B[K] => obj[key] as B[K]; // TODO does casting is nessessary?
		const onExceptionReturnBrowserApiError = (reason: string) => new StorageApiCallError(this, this.storage.get, {key, entry}, reason);
		return this.storage.get(entry).then(flatternReturnedObject).catch(onExceptionReturnBrowserApiError);
	}
	
	public save<K extends StorageBlueprintKeyName<B>>(key: K, value: B[K]) : ApiReturn<B[K], StorageApiCallError>
	{
		// TODO check if storage limit is exceeded.
		const entry = { [key]: value };
		const returnSavedObject = () => value;
		const returnError = (reason: string) => new StorageApiCallError(this, this.storage.set, {key, value, entry}, reason);
		return this.storage.set(entry).then(returnSavedObject).catch(returnError);
	}
	
	public remove<K extends StorageBlueprintKeyName<B>>(key: K) : ApiReturn<boolean, StorageApiCallError>
	{
		const returnTrueOnSucess = () => true;
		const returnError = (reason: string) => new StorageApiCallError(this, this.storage.remove, {key}, reason);
		return this.storage.remove(key).then(returnTrueOnSucess).catch(returnError);
	}
}

