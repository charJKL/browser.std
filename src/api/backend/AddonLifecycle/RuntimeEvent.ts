import { type RuntimeEventTypes } from "./RuntimeEventTypes";

type SupportedRuntimeEvents = keyof RuntimeEventTypes;
type SupportedRuntimeEventsBlueprint<T extends SupportedRuntimeEvents> = RuntimeEventTypes[T];

export class RuntimeEvent<T extends SupportedRuntimeEvents>
{
	private type: T;
	
	public constructor(type: T)
	{
		this.type = type;
	}
	
	public add(handler: SupportedRuntimeEventsBlueprint<T>) : this
	{
		browser.runtime[this.type].addListener(handler as () => void);
		return this;
	}
	
	public remove(listener: SupportedRuntimeEventsBlueprint<T>) : this
	{
		browser.runtime[this.type].removeListener(listener as () => void);
		return this;
	}
}
