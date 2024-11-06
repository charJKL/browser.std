import { Api, BrowserNativeApiCallError } from "@src/api/Api";
import { CommProtocol, CorruptedPacketError } from "@src/api/CommProtocol";
import type { MessageSender, SendResponse, Data, Variants, Packet, ProtocolBlueprint, ProtocolBlueprintArgs, ProtocolBlueprintResponse, SupportedProtocol,  } from "@src/api/CommProtocol";
import { BrowserApiError } from "@src/api/BrowserApiError";
import { ApiReturn } from "@src/api/ApiReturn.type";
import { ArrayEx, safeCast, isError, isNotUndefined, isUndefined, isNotArray } from "@src/util";

type BrowserTab = browser.tabs.Tab;
type ValidBrowserTab = BrowserTab & { id: number };
type AllowListenerBeAsync<T> = Promise<T> | T;
type MessageListenerArgs<B extends ProtocolBlueprint> = [...ProtocolBlueprintArgs<B>, sender: MessageSender];
type MessageListenerResponse<B extends ProtocolBlueprint> = AllowListenerBeAsync<ProtocolBlueprintResponse<B>>;
type MessageListener<B extends ProtocolBlueprint> = (...args: MessageListenerArgs<B>) => MessageListenerResponse<B>;
type OptionalProtocolBlueprintArgs<B extends ProtocolBlueprint> = ProtocolBlueprintArgs<B> extends [] ? undefined : ProtocolBlueprintArgs<B>;

// errors
export class NoTabsWasFound extends BrowserApiError<"NoTabsWasFound", BackendComm<any>, {url: string}>{ };
class SendWasntSuccessfulError extends BrowserApiError<"SendWasntSuccessfulError", BackendComm<any>, {results: unknown[]}>{ };
class CorruptedPacketDataError extends BrowserApiError<"CorruptedPacketDataError", BackendComm<any>, {packet: Packet}>{ };
class NoListenerPresent extends BrowserApiError<"NoListenerPresent", BackendComm<any>, {packet: Packet}>{ };

/**
 * BackendComm
 */
export class BackendComm<SP extends SupportedProtocol = {}> // eslint-disable-line @typescript-eslint/no-empty-object-type -- we want here empty object.
{
	private readonly $listeners: Map<Variants<SP>, MessageListener<ProtocolBlueprint>>;
	
	constructor()
	{
		Api.runtime.onMessage.addListener(this.dispatchMessage.bind(this));
		this.$listeners = new Map();
	}
	
	public addMessageListener<V extends Variants<SP>>(variant: V, listener: MessageListener<SP[V]>) : void
	{
		this.$listeners.set(variant, safeCast<MessageListener<SP[V]>, MessageListener<ProtocolBlueprint>>(listener));
	}
	
	public async sendMessage<V extends Variants<SP>>(variant: V, url: string, data: OptionalProtocolBlueprintArgs<SP[V]>) : ApiReturn<boolean, BrowserNativeApiCallError, NoTabsWasFound, SendWasntSuccessfulError>
	{
		console.log("BackendComm.sendMessage()", "variant=", variant, "url=", url, "data=", data); // TODO debug only
		const tabs = await Api.tabs.query({url});
		if(isError(BrowserNativeApiCallError, tabs)) return tabs;
		if(ArrayEx.IsEmpty(tabs)) return new NoTabsWasFound(this, "Wanted url is not opened in any tab.", {url});
		const validTabs = tabs.filter((tab: BrowserTab) : tab is ValidBrowserTab => isNotUndefined(tab.id));
		const results = await ArrayEx.AsyncMap(validTabs, (tab) => this.sendMessageToTab.call(this, tab, variant, data));
		const wasErrorOccuredDuringDispatchingNotifications = (result: PromiseSettledResult<"Sended" | BrowserNativeApiCallError>) => result.status === "fulfilled" ? result.value instanceof BrowserNativeApiCallError : true;
		if(results.find(wasErrorOccuredDuringDispatchingNotifications)) return new SendWasntSuccessfulError(this, "Notifiaction wasnt send successful to all tabs", {results});
		return true;
	}
	
	// TODO should response from content script be discarded?
	public async sendMessageToTab(tab: ValidBrowserTab, variant: Variants<SP>, data?: Data) : Promise<"Sended" | BrowserNativeApiCallError>
	{
		const assuredData = isUndefined(data) ? [] : data;
		const packet = CommProtocol.Pack(variant, assuredData);
		const result = await Api.tabs.sendMessage(tab.id, packet); // result is discarded 
		if(isError(BrowserNativeApiCallError, result)) return result;
		return "Sended";
	}
	
	private dispatchMessage(payload: unknown, sender: MessageSender, sendResponse: SendResponse) : boolean
	{
		// TODO being silent about error is good choice? Maybe some abstract error should be returned?
		console.log("BackendComm.dispatchMessage()", "payload=", payload, "sender=", sender); // TODO for debug only
		void this.dispatchMessageToListener(payload, sender).then((result) => {
			if(isError(CorruptedPacketError, result)) return;
			if(isError(CorruptedPacketDataError, result)) return;
			if(isError(NoListenerPresent, result)) return;
			const {packet, result: response} = result;
			sendResponse(CommProtocol.Pack(packet.variant, response));
		});
		return true;
	}
	
	private async dispatchMessageToListener(payload: unknown, sender: MessageSender) : Promise<{packet: Packet, result: Data} | CorruptedPacketError | CorruptedPacketDataError | NoListenerPresent>
	{
		const packet = CommProtocol.ValidatePacket(payload);
		if(isError(CorruptedPacketError, packet)) return packet;
		if(isNotArray(packet.data)) return new CorruptedPacketDataError(this, "Data sended to background script is corrupted.", {packet});
		const listener = this.$listeners.get(packet.variant);
		if(isUndefined(listener)) return new NoListenerPresent(this, "There isn't any listener for this message", {packet});
		const result = await listener(...packet.data, sender);
		return {packet, result};
	}
}
