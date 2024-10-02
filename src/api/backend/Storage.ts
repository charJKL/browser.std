import { BrowserApiError } from "../BrowserApiError";
import { type ApiReturn } from "../ApiReturn.type";

// #region private types
type StorageArea = browser.storage.StorageArea;
type StorageBlueprint = { [key: string]: unknown }; // TODO supports only simple type.
type StorageBlueprintKeyName<B extends StorageBlueprint> = Exclude<keyof B, symbol | number>;
// #endregion

// #region errors
type StorageFailsInfo = {storage: Storage<StorageBlueprint>, key: StorageBlueprintKeyName<StorageBlueprint>, reason: unknown};
export class StorageGetMethodFails extends BrowserApiError<StorageFailsInfo> { }
export class StorageSetMethodFails extends BrowserApiError<StorageFailsInfo> { }
export class StorageRemoveMethodFails extends BrowserApiError<StorageFailsInfo> { }
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
	
	public get<K extends StorageBlueprintKeyName<B>>(key: K) : ApiReturn<B[K], StorageGetMethodFails>
	{
		const entry = { key: this.blueprint[key] }; 
		const flatternReturnedObject = (obj: StorageBlueprint) : B[K] => obj[key] as B[K]; // TODO does casting is nessessary?
		const onExceptionReturnBrowserApiError = (reason: unknown) => new StorageGetMethodFails({storage: this, key, reason});
		return this.storage.get(entry).then(flatternReturnedObject).catch(onExceptionReturnBrowserApiError);
	}
	
	public save<K extends StorageBlueprintKeyName<B>>(key: K, value: B[K]) : ApiReturn<B[K], StorageSetMethodFails>
	{
		// TODO check if storage limit is exceeded.
		const entry = { [key]: value };
		const returnSavedObject = () => value;
		const onExceptionReturnBrowserApiError = (reason: unknown) => new StorageSetMethodFails({storage: this, key, reason});
		return this.storage.set(entry).then(returnSavedObject).catch(onExceptionReturnBrowserApiError);
	}
	
	public remove<K extends StorageBlueprintKeyName<B>>(key: K) : ApiReturn<boolean, StorageRemoveMethodFails>
	{
		const returnTrueOnSucess = () => true;
		const onExceptionReturnBrowserApiError = (reason: unknown) => new StorageRemoveMethodFails({storage: this, key, reason});
		return this.storage.remove(key).then(returnTrueOnSucess).catch(onExceptionReturnBrowserApiError);
	}
}

