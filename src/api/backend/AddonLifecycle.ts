import { RuntimeEvent } from "./AddonLifecycle/RuntimeEvent";
import { type InstalledDetails , type UpdateAvailableDetails } from "./AddonLifecycle/RuntimeEventTypes";

export type InstaltionDetails = InstalledDetails;
export type UpdateDetails = UpdateAvailableDetails;

export class AddonLifecycle
{
	private readonly starting: RuntimeEvent<"onStartup">;
	private readonly installed: RuntimeEvent<"onInstalled">;
	private readonly suspending: RuntimeEvent<"onSuspend">;
	private readonly suspendingCanceled: RuntimeEvent<"onSuspendCanceled">;
	private readonly updateAvailable: RuntimeEvent<"onUpdateAvailable">;
	
	public get Starting()
	{ 
		return this.starting 
	};
	
	public get Installed()
	{
		return this.installed;
	}
	
	public get Suspending()
	{
		return this.suspending;
	}
	
	public get SuspendingCanceled()
	{
		return this.suspendingCanceled;
	}
	
	public get UpdateAvailable()
	{
		return this.updateAvailable;
	}
	
	constructor()
	{
		this.starting = new RuntimeEvent("onStartup");
		this.installed = new RuntimeEvent("onInstalled");
		this.suspending = new RuntimeEvent("onSuspend");
		this.suspendingCanceled = new RuntimeEvent("onSuspendCanceled");
		this.updateAvailable = new RuntimeEvent("onUpdateAvailable");
	}
}
