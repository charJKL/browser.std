import { Api, MessageSender, BrowserNativeApiCallError } from "@src/api/Api";
import { Data, Packet, CommProtocol, CorruptedPacketError, ProtocolBlueprint, ProtocolDesc, ToBackendOnly, ToFrontendOnly } from "@src/api/CommProtocol";
import { BrowserApiError } from "@src/api/BrowserApiError";
import { ArrayEx } from "@src/util/ex/ArrayEx";;
import { MultiMap, IComparable } from "@src/util/MultiMap";
import { Names, AllowBeAsync, ApiReturn } from "@src/util/Types";
import { unsafeCast, isError, isNotArray, isEmpty } from "@src/util/Func";

type MessageListener<B extends ProtocolBlueprint> = (...args: [...B["args"], sender: MessageSender]) => AllowBeAsync<B["result"]>;

export class FrontendComm<D extends ProtocolDesc>
{
	private readonly $listeners: MultiMap<Names<D>, NotificationListenerRecord>;
	
	public constructor()
	{
		this.$listeners = new MultiMap();
		Api.runtime.onMessage.addListener(this.invokeAssignedListeners.bind(this));
	}
	
	public addMessageListener<V extends ToFrontendOnly<D>>(variant: V, listener: MessageListener<D[V]> ) : void
	{
		this.$listeners.set(variant, new NotificationListenerRecord(unsafeCast<MessageListener<D[V]>, MessageListener<ProtocolBlueprint>>(listener)));
	}
	
	public async sendMessage<V extends ToBackendOnly<D>>(variant: V, ...data: D[V]["args"]) : ApiReturn<D[V]["result"], BrowserNativeApiCallError, CorruptedPacketError>
	{
		// TODO should function return `BrowserNativeApiCallError` and `CorruptedPacketError`
		console.log("FrontendComm.sendMessage()", "variant=", variant, "data=", data);
		const packet = CommProtocol.Pack(variant, data);
		const response = await Api.runtime.sendMessage(packet);
		if(isError(BrowserNativeApiCallError, response)) return response;
		const result = CommProtocol.ValidatePacket(response);
		if(isError(CorruptedPacketError, result)) return result;
		return result.data;
	}
	
	private invokeAssignedListeners(payload: unknown, sender: MessageSender) : boolean
	{
		console.log("FrontendComm.invokeAssignedListeners()", "payload=", payload, "sender=", sender); // TODO for debug only
		void this.asyncInvokeAssignedListeners(payload, sender).then((results) => {
			if(isError(CorruptedPacketError, results)) return; // TODO this should be logged somewhere.
			if(isError(CorruptedPacketDataError, results)) return;
			if(isError(NoListenerPresent, results)) return;
			// we don't support send response back.
		});
		return false;
	}
	
	private async asyncInvokeAssignedListeners(payload: unknown, sender: MessageSender) : Promise<Array<Data | ListenerThrowError> | CorruptedPacketError | CorruptedPacketDataError | NoListenerPresent>
	{
		const packet = CommProtocol.ValidatePacket(payload);
		if(isError(CorruptedPacketError, packet)) return packet;
		if(isNotArray(packet.data)) return new CorruptedPacketDataError({frontendComm: this, packet});
		
		const records = this.$listeners.get(packet.variant);
		if(isEmpty(records)) return new NoListenerPresent({ frontendComm: this, packet });
		
		const args = packet.data;
		const listeners = records.map((records) => records.listener);
		const settledResults = await ArrayEx.AsyncMap(listeners, (listener) => listener(...args, sender));
		
		const toError = (error: Error) => new ListenerThrowError({frontendComm: this, packet}, error);
		const results = ArrayEx.TransformError(settledResults, toError);
		
		return results;
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

/**
 * CorruptedPacketDataError
 */
export type CorruptedPacketDataErrorInfo = { frontendComm: FrontendComm<ProtocolDesc>, packet: Packet };
export class CorruptedPacketDataError extends BrowserApiError<"CorruptedPacketDataError", CorruptedPacketDataErrorInfo>
{
	static MESSAGE = "Data sended from background script is corrupted";
	
	constructor(info: CorruptedPacketDataErrorInfo)
	{
		super("CorruptedPacketDataError", CorruptedPacketDataError.MESSAGE, info);
	}
}

/**
 * NoListenerPresent
 */
export type NoListenerPresentInfo = { frontendComm: FrontendComm<ProtocolDesc>, packet: Packet}
export class NoListenerPresent extends BrowserApiError<"NoListenerPresent", NoListenerPresentInfo>
{
	static MESSAGE = "There isn't any listener for this message.";
	
	constructor(info: NoListenerPresentInfo)
	{
		super("NoListenerPresent", NoListenerPresent.MESSAGE, info);
	}
}

export type ListenerThrowErrorInfo = { frontendComm: FrontendComm<ProtocolDesc>, packet: Packet }
export class ListenerThrowError extends BrowserApiError<"ListenerThrowError", ListenerThrowErrorInfo>
{
	static MESSAGE = "Listener for this message throw error.";
	
	constructor(info: ListenerThrowErrorInfo, cause: unknown)
	{
		super("ListenerThrowError", ListenerThrowError.MESSAGE, info, cause);
	}
}