import { CommProtocol, CorruptedPacketError, type Packet } from "../CommProtocol";
import type { MessageBlueprintParametered, MessageBlueprint, SupportedMessages, PacketResponse } from "../CommProtocol";
import type { NotificationData, SupportedNotifications } from "../CommProtocol";
import type { MessageSender, SendResponse, Variants } from "../CommProtocol";
import { BrowserApiError } from "../BrowserApiError";
import { ApiReturn } from "../ApiReturn.type";
type AllowListenerBeAsync<T> = Promise<T> | T;
type MessageArgs<B extends MessageBlueprint> = B extends MessageBlueprintParametered ? Parameters<B>[0] : undefined;
type MessageCommArgs<B extends MessageBlueprint> = B extends MessageBlueprintParametered ? {sender: MessageSender} & MessageArgs<B> : {sender: MessageSender};
type MessageCommReturn<B extends MessageBlueprint> = AllowListenerBeAsync<ReturnType<B>>;
type MessageCommListener<B extends MessageBlueprint> = (args: MessageCommArgs<B>) => MessageCommReturn<B>;

type NotificationData<B extends NotifiactionBlueprint> = ReturnType<B>;

type Variants<L> = keyof L & string;

class InvalidPacketError extends BrowserApiError<"InvalidPacketDescError", BackendComm<any, any>, {rawPacket: unknown, sender: MessageSender}>{ }; // TODO what to do with any? 
class MissingListenerError extends BrowserApiError<"MissingListnerError", BackendComm<any, any>, {packet: Packet, sender: MessageSender}>{ }; // TODO what to do with any?


export class BackendComm<SM extends SupportedMessages, SN extends SupportedNotifications>
{
	private listeners: Map<Variants<SM>, MessageCommListener<MessageBlueprint>>
	
	public constructor()
	{
		browser.runtime.onMessage.addListener(this.dispatchMessage.bind(this));
		this.listeners = new Map();
	}
	
	public addMessageListener<V extends Variants<SM>>(variant: V, listeners: MessageCommListener<SM[V]>) : void
	{
		this.listeners.set(variant, listeners);
	}
	
	public sendNotification<V extends Variants<SN>>(tabUrl: string, variant: V, data: NotificationData<SN[V]>)
	{
		console.log("Send notification", "tabUrl=", tabUrl, "variant=", variant, "args=", data); // TODO implement sending notifications
	}
	
	private dispatchMessage(rawPacket: unknown, sender: MessageSender, sendResponse: SendResponse)
	{
		try
		{
			const packet = CommProtocol.ValidatePacket(rawPacket);
			if(isError(CorruptedPacketError, packet)) throw new InvalidPacketError(this, "Message packet is invalid.", {rawPacket, sender});
			const listener = this.listeners.get(packet.variant);
			if(isUndefined(listener)) throw new MissingListenerError(this, "Listener for packet is not set.", {packet, sender});
			void (async function() {
				const args = { sender, ...packet.payload };
				const result = await listener(args);
				const response = CommProtocol.Pack(packet.variant, result);
				sendResponse(response);
			})();
			return true;
		}
		catch(e)
		{
			console.log(e); // TODO what to do now? Response with failure message?
			return true;
		}
	}
}