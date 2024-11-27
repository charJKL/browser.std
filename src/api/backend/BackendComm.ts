import { Api, MessageSender, SendResponse, BrowserNativeApiCallError, BrowserTab } from "@src/api/Api";
import { CommProtocol, CorruptedPacketError, Data, Packet, ProtocolBlueprint, ProtocolDesc, ToBackendOnly, ToFrontendOnly } from "@src/api/CommProtocol";
import { BrowserApiError } from "@src/api/BrowserApiError";
import { unsafeCast, isError, isEmpty, isNotArray, isUndefined, isNotUndefined, isString } from "@src/util/Func";
import { ArrayEx } from "@src/util/ex/ArrayEx";
import { ApiReturn, AllowBeAsync, Names, Async } from "@src/util/Types";

type MessageListener<B extends ProtocolBlueprint> = (...args: [...B["args"], sender: MessageSender]) => AllowBeAsync<B["result"]>;
type ValidBrowserTab = BrowserTab & { id: number };

/**
 * BackendComm
 */
export class BackendComm<D extends ProtocolDesc>
{
	private readonly $listeners: Map<Names<D>, MessageListener<ProtocolBlueprint>>;
	
	public constructor()
	{
		this.$listeners = new Map();
		Api.runtime.onMessage.addListener(this.invokeAssignedListeners.bind(this));
	}
	
	public addMessageListener<V extends ToBackendOnly<D>>(variant: V, listener: MessageListener<D[V]> ): void
	{
		this.$listeners.set(variant, unsafeCast<MessageListener<D[V]>, MessageListener<ProtocolBlueprint>>(listener));
	}
	
	public async sendMessage<V extends ToFrontendOnly<D>>(url: string, variant: V, ...data: D[V]["args"]) : ApiReturn<boolean, NoTabsWasFound, SendWasntSuccessfulError, BrowserNativeApiCallError>
	{
		console.log("BackendComm.sendMessage()", "variant=", variant, "url=", url, "data=", data); // TODO debug only
		const tabs = await Api.tabs.query({url});
		if(isError(BrowserNativeApiCallError, tabs)) return tabs;
		if(isEmpty(tabs)) return new NoTabsWasFound({backendComm: this, url});
		
		const validTabs = tabs.filter((tab: BrowserTab) : tab is ValidBrowserTab => isNotUndefined(tab.id));
		const results = await ArrayEx.AsyncMap(validTabs, (tab) => this.sendMessageToTab.call(this, tab, variant, data));
		
		const wasErrorOccuredDuringDispatchingNotifications = (result: (BrowserNativeApiCallError | Error | "Sended")) => isString(result);
		if(results.find(wasErrorOccuredDuringDispatchingNotifications)) return new SendWasntSuccessfulError({backendComm: this, results});
		
		return true;
	}
	
	private invokeAssignedListeners(payload: unknown, sender: MessageSender, sendResponse: SendResponse) : boolean
	{
		// TODO being silent about error is good choice? Maybe some abstract error should be returned?
		console.log("BackendComm.dispatchMessage()", "payload=", payload, "sender=", sender); // TODO for debug only
		void this.asyncInvokeAssignedListener(payload, sender).then((result) => {
			if(isError(CorruptedPacketError, result)) return;
			if(isError(CorruptedPacketDataError, result)) return;
			if(isError(NoListenerPresent, result)) return;
			const {packet, result: response} = result;
			sendResponse(CommProtocol.Pack(packet.variant, response));
		});
		return true;
	}
	
	public async sendMessageToTab(tab: ValidBrowserTab, variant: ToFrontendOnly<D>, data?: Data[]) : Async<"Sended", BrowserNativeApiCallError>
	{
		// TODO should response from content script be discarded?
		const assuredData = isUndefined(data) ? [] : data;
		const packet = CommProtocol.Pack(variant, assuredData);
		const result = await Api.tabs.sendMessage(tab.id, packet); // result is discarded 
		if(isError(BrowserNativeApiCallError, result)) return result;
		return "Sended";
	}
	
	private async asyncInvokeAssignedListener(payload: unknown, sender: MessageSender) : Async<{packet: Packet, result: Data}, CorruptedPacketError, CorruptedPacketDataError, NoListenerPresent>
	{
		const packet = CommProtocol.ValidatePacket(payload);
		if(isError(CorruptedPacketError, packet)) return packet;
		if(isNotArray(packet.data)) return new CorruptedPacketDataError({ backendComm: this, packet });
		const listener = this.$listeners.get(packet.variant);
		if(isUndefined(listener)) return new NoListenerPresent({ backendComm: this, packet });
		const result = await listener(...packet.data, sender);
		return {packet, result};
	}	
}


// errors:



/**
 * NoTabsWasFound
 */
export type NoTabsWasFoundInfo = { backendComm: BackendComm<ProtocolDesc>, url: string };
export class NoTabsWasFound extends BrowserApiError<"NoTabsWasFound", NoTabsWasFoundInfo>
{
	static MESSAGE = "Wanted url is not opened in any tab.";
	
	constructor(info: NoTabsWasFoundInfo)
	{
		super("NoTabsWasFound", NoTabsWasFound.MESSAGE, info);
	}
}

/**
 * SendWasntSuccessfulError
 */
export type SendWasntSuccessfulErrorInfo = { backendComm: BackendComm<ProtocolDesc>, results: unknown[] }
export class SendWasntSuccessfulError extends BrowserApiError<"SendWasntSuccessfulError", SendWasntSuccessfulErrorInfo>
{
	static MESSAGE = "Notifiaction wasnt send successful to all tabs.";
	
	constructor(info: SendWasntSuccessfulErrorInfo)
	{
		super("SendWasntSuccessfulError", SendWasntSuccessfulError.MESSAGE, info);
	}
}

/**
 * CorruptedPacketDataError
 */
export type CorruptedPacketDataErrorInfo = { backendComm: BackendComm<ProtocolDesc>, packet: Packet };
export class CorruptedPacketDataError extends BrowserApiError<"CorruptedPacketDataError", CorruptedPacketDataErrorInfo>
{
	static MESSAGE = "Data sended to background script is corrupted.";
	
	constructor(info: CorruptedPacketDataErrorInfo)
	{
		super("CorruptedPacketDataError", CorruptedPacketDataError.MESSAGE, info);
	}
}

export type NoListenerPresentInfo = { backendComm: BackendComm<ProtocolDesc>, packet: Packet };
export class NoListenerPresent extends BrowserApiError<"NoListenerPresent", NoListenerPresentInfo>
{
	static MESSAGE = "There isn't any listener for this message";

	constructor(info: NoListenerPresentInfo)
	{
		super("NoListenerPresent", NoListenerPresent.MESSAGE, info);
	}
}
