export type InstallationDetails = browser.runtime._OnInstalledDetails;
export type UpdateDetails = browser.runtime._OnUpdateAvailableDetails;

/**
 * AddonLifecycle class
 */
export class AddonLifecycle
{
	private readonly $starting: RuntimeEvent<"onStartup">;
	private readonly $installed: RuntimeEvent<"onInstalled">;
	private readonly $suspending: RuntimeEvent<"onSuspend">;
	private readonly $suspendingCanceled: RuntimeEvent<"onSuspendCanceled">;
	private readonly $updateAvailable: RuntimeEvent<"onUpdateAvailable">;
	
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
		this.$starting = new RuntimeEvent("onStartup");
		this.$installed = new RuntimeEvent("onInstalled");
		this.$suspending = new RuntimeEvent("onSuspend");
		this.$suspendingCanceled = new RuntimeEvent("onSuspendCanceled");
		this.$updateAvailable = new RuntimeEvent("onUpdateAvailable");
	}
}

/**
 * Private class RuntimeEvent 
 */
type SupportedRuntimeEvents = keyof RuntimeEventTypes;
type SupportedRuntimeEventsBlueprint<T extends SupportedRuntimeEvents> = RuntimeEventTypes[T];

class RuntimeEvent<T extends SupportedRuntimeEvents>
{
	private readonly $type: T;
	
	public constructor(type: T)
	{
		this.$type = type;
	}
	
	public add(handler: SupportedRuntimeEventsBlueprint<T>) : this
	{
		browser.runtime[this.$type].addListener(handler as () => void);
		return this;
	}
	
	public remove(listener: SupportedRuntimeEventsBlueprint<T>) : this
	{
		browser.runtime[this.$type].removeListener(listener as () => void);
		return this;
	}
}


/**
 * Private class RuntimeEventTypes
 */
interface RuntimeEventTypes
{
	"onStartup": () => void,
	"onInstalled": (details: InstallationDetails) => void,
	"onSuspend": () => void,
	"onSuspendCanceled": () => void,
	"onUpdateAvailable": (details: UpdateDetails) => void
}
