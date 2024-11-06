import { Api, BrowserNativeApiCallError } from "@src/api/Api";
import { CommProtocol, CorruptedPacketError } from "@src/api/CommProtocol";
import type { MessageSender, SendResponse, Packet, Data, Variants, ProtocolBlueprint, ProtocolBlueprintArgs, ProtocolBlueprintResponse, SupportedProtocol } from "@src/api/CommProtocol";
import { IComparable, ArrayEx, MultiMap, isError, safeCast, isNotArray } from "@src/util";
import { BrowserApiError } from "@src/api/BrowserApiError";

type AllowListenerBeAsync<T> = Promise<T> | T;
type MessageListenerArgs<B extends ProtocolBlueprint> = [...ProtocolBlueprintArgs<B>, MessageSender];
type MessageListener<B extends ProtocolBlueprint> = (...args: MessageListenerArgs<B>) => AllowListenerBeAsync<void>;

// errors
export class CorruptedPacketDataError extends BrowserApiError<"CorruptedPacketDataError", FrontendComm<any>, {packet: Packet}>{ };
export class NoListenerPresent extends BrowserApiError<"NoListenerPresent", FrontendComm<any>, {packet: Packet}>{ };
export class CommError extends BrowserApiError<"CommError", FrontendComm<any>, {packet: Packet, response: unknown}> {};

/**
 * 
 */
export class FrontendComm<SP extends SupportedProtocol>
{
	private readonly $listeners: MultiMap<Variants<SP>, NotificationListenerRecord>;
	
	constructor()
	{
		Api.runtime.onMessage.addListener(this.dispatchMessage.bind(this));
		this.$listeners = new MultiMap();
	}
	
	public addMessageListener<V extends Variants<SP>>(variant: V, listener: MessageListener<SP[V]>) : void
	{
		this.$listeners.set(variant, new NotificationListenerRecord(safeCast<MessageListener<SP[V]>, MessageListener<ProtocolBlueprint>>(listener)));
	}
	
	public async sendMessage<V extends Variants<SP>>(variant: V, ...data: ProtocolBlueprintArgs<SP[V]>) : Promise<ProtocolBlueprintResponse<SP[V]> | CommError>
	{
		console.log("FrontendComm.sendMessage()", "variant=", variant, "data=", data);
		const packet = CommProtocol.Pack(variant, data);
		const response = await Api.runtime.sendMessage(packet);
		if(isError(BrowserNativeApiCallError, response)) return new CommError(this, "Unknow error occur during communication with background script.", {packet, response}, response);
		const result = CommProtocol.ValidatePacket(response);
		if(isError(CorruptedPacketError, result)) return new CommError(this, "Response packet is corrupted.", {packet, response}, result);
		return result.data;
	}
	
	private dispatchMessage(payload: unknown, sender: MessageSender) : boolean
	{
		console.log("FrontendComm.dispatchMessage()", "payload=", payload, "sender=", sender); // TODO for debug only
		void this.dispatchMessageToListener(payload, sender).then((result) => {
			if(isError(CorruptedPacketError, result)) return; // TODO this should be logged somewhere.
			if(isError(CorruptedPacketDataError, result)) return;
			if(isError(NoListenerPresent, result)) return;
			// we don't support send response back.
		});
		return false;
	}
	
	private async dispatchMessageToListener(payload: unknown, sender: MessageSender) : Promise<"Send" | CorruptedPacketError | CorruptedPacketDataError | NoListenerPresent>
	{
		const packet = CommProtocol.ValidatePacket(payload);
		if(isError(CorruptedPacketError, packet)) return packet;
		if(isNotArray(packet.data)) return new CorruptedPacketDataError(this, "Data sended from background script is corrupted.", {packet});
		const listeners = this.$listeners.get(packet.variant);
		if(ArrayEx.IsEmpty(listeners)) return new NoListenerPresent(this, "There isn't any listener for this message", {packet});
		listeners.forEach(async record => {await record.listener.call(undefined, ...safeCast<Data, Array<Data>>(packet.data), sender)});
		return "Send";
	}
}

/**
 * NotificationListenerRecord
 */
class NotificationListenerRecord implements IComparable<NotificationListenerRecord>
{
	private $listener: MessageListener<ProtocolBlueprint>;
	
	public constructor(listener: MessageListener<ProtocolBlueprint>)
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