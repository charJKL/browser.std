import { CommProtocol, CorruptedPacketError } from "../CommProtocol";
import type { MessageBlueprintArgs, MessageBlueprintResponse, Packet, SupportedMessages } from "../CommProtocol";
import type { NotificationBlueprint, NotificationData, SupportedNotifications } from "../CommProtocol";
import type { MessageSender, SendResponse, Variants } from "../CommProtocol";
import { isError, IComparable, MultiMap } from "../../ex";
import { BrowserApiError } from "../BrowserApiError";

export type NotificationListener<B extends NotificationBlueprint> = (...data: NotificationData<B>) => void;

// #region errors
export class BrowserRuntimeApiCallError extends BrowserApiError<"BrowserRuntimeApiCallError", FrontendComm<any, any>, {packet: Packet}>{ } 

export class FrontendComm<SM extends SupportedMessages, SN extends SupportedNotifications>
{
	private listeners: MultiMap<Variants<SN>, NotificationListenerRecord>
	
	public constructor()
	{
		browser.runtime.onMessage.addListener(this.dispatchNotification.bind(this));
		this.listeners = new MultiMap();
	}
	
	public async sendMessage<V extends Variants<SM>>(variant: V, args: MessageBlueprintArgs<SM[V]>) : Promise<MessageBlueprintResponse<SM[V]>>
	{
		const packet = CommProtocol.Pack(variant, args);
		const returnError = (reason: unknown) => new BrowserRuntimeApiCallError(this, "Internal browser call `runtime.sendMessage()` throw error.", {packet}, reason);
		const response = await browser.runtime.sendMessage(packet).catch(returnError) as unknown; // TODO do not use iline casting
		const result = CommProtocol.ValidatePacket(response);
		if(isError(CorruptedPacketError, result)) return 1 as any; // TODO
		return result as any; // TODO
	}
	
	public addNotificationListener<V extends Variants<SN>>(variant: V, listener: NotificationListener<SN[V]>) : void
	{
		this.listeners.set(variant, new NotificationListenerRecord(listener));
	}
	
	private dispatchNotification(rawPacket: unknown, sender: MessageSender, sendResponse: SendResponse)
	{
		const packet = CommProtocol.ValidatePacket(rawPacket);
		if(isError(CorruptedPacketError, packet)) return; // TODO what to do now? Where to log it?
		const listeners = this.listeners.get(packet.variant);
					listeners.forEach(listener => {listener.listener(packet.data)});
	}
}

/**
 * 
 */
class NotificationListenerRecord implements IComparable<NotificationListenerRecord>
{
	private $listener: NotificationListener<NotificationBlueprint>;
	
	public constructor(listener: NotificationListener<NotificationBlueprint>)
	{
		this.$listener = listener;
	}
	
	public get listener()
	{
		return this.$listener;
	}
	
	public isEqual(this: NotificationListenerRecord, obj: NotificationListenerRecord): boolean 
	{
		return this.$listener === obj.$listener;
	}
}