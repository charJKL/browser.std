import { Api, ApiReturn, MessageSender, BrowserNativeApiCallError } from "@src/api/Api";
import { Data, Packet, CommProtocol, CorruptedPacketError, ProtocolBlueprint, ProtocolDesc, ToBackendOnly, ToFrontendOnly } from "@src/api/CommProtocol";
import { BrowserApiError } from "@src/api/BrowserApiError";
import { ArrayEx } from "@src/util/ex/ArrayEx";;
import { MultiMap, IComparable } from "@src/util/MultiMap";
import { Names, AllowBeAsync } from "@src/util/Helpers";
import { safeCast, isError, isNotArray, isEmpty } from "@src/util/Func";

type MessageListener<B extends ProtocolBlueprint> = (...args: [...B["args"], sender: MessageSender]) => AllowBeAsync<B["result"]>;

// errors:
abstract class FrontendCommError<ID extends string, I extends object> extends BrowserApiError<ID, FrontendComm<any>, I> { };
class CorruptedPacketDataError extends FrontendCommError<"CorruptedPacketDataError", {packet: Packet}>{ };
class NoListenerPresent extends FrontendCommError<"NoListenerPresent", {packet: Packet}>{ };
class ListenerThrowError extends FrontendCommError<"ListenerThrowError", {packet: Packet}> { };

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
		this.$listeners.set(variant, new NotificationListenerRecord(safeCast<MessageListener<D[V]>, MessageListener<ProtocolBlueprint>>(listener)));
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
		if(isNotArray(packet.data)) return new CorruptedPacketDataError(this, "Data sended from background script is corrupted", {packet});
		
		const records = this.$listeners.get(packet.variant);
		if(isEmpty(records)) return new NoListenerPresent(this, "There isn't any listener for this message.", {packet});
		
		const args = packet.data;
		const listeners = records.map((records) => records.listener);
		const settledResults = await ArrayEx.AsyncMap(listeners, (listener) => listener(...args, sender));
		
		const resolveValueFromSettledPromise = (result: PromiseSettledResult<Data>) => result.status === "fulfilled" ? result.value : new ListenerThrowError(this, "Listener for this message throw error.", {packet}, result.reason);
		const results = settledResults.map(resolveValueFromSettledPromise);
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