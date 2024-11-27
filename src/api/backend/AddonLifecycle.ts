import { Api } from "$src/api/Api";

/**
 * AddonLifecycle class
 */
export class AddonLifecycle
{
	private readonly $starting : RuntimeEvent<typeof Api.runtime.onStartUp>;
	private readonly $installed: RuntimeEvent<typeof Api.runtime.onInstalled>;
	private readonly $suspending: RuntimeEvent<typeof Api.runtime.onSuspend>;
	private readonly $suspendingCanceled: RuntimeEvent<typeof Api.runtime.onSuspendCanceled>;
	private readonly $updateAvailable: RuntimeEvent<typeof Api.runtime.onUpdateAvailable>;
	
	public get Starting()
	{ 
		return this.$starting 
	};
	
	public get Installed()
	{
		return this.$installed;
	}
	
	public get Suspending()
	{
		return this.$suspending;
	}
	
	public get SuspendingCanceled()
	{
		return this.$suspendingCanceled;
	}
	
	public get UpdateAvailable()
	{
		return this.$updateAvailable;
	}
	
	constructor()
	{
		this.$starting = new RuntimeEvent(Api.runtime.onStartUp);
		this.$installed = new RuntimeEvent(Api.runtime.onInstalled);
		this.$suspending = new RuntimeEvent(Api.runtime.onSuspend);
		this.$suspendingCanceled = new RuntimeEvent(Api.runtime.onSuspendCanceled);
		this.$updateAvailable = new RuntimeEvent(Api.runtime.onUpdateAvailable);
	}
}


/**
 * IRuntimeEvent
 */
interface IRuntimeEvent
{
	addListener(cb: unknown): void
	removeListener(cb: unknown): void
}

/**
 * RuntimeEventTypeCallback
 */
type RuntimeEventTypeCallback<T extends IRuntimeEvent> = Parameters<T["addListener"]>[0];

/**
 * RuntimeEvent
 */
class RuntimeEvent<T extends IRuntimeEvent> 
{
	private readonly $type: T;
	
	public constructor(type: T)
	{
		this.$type = type;
	}
	
	public addListener(handler: RuntimeEventTypeCallback<T>) : void 
	{
		this.$type.addListener(handler);
	}
	
	public removeListener(handler: RuntimeEventTypeCallback<T>) : void 
	{
		this.$type.removeListener(handler);
	}
}