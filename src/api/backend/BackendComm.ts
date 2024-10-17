import { CommProtocol, CorruptedPacketError, type Packet } from "../CommProtocol";
import type { MessageBlueprintParametered, MessageBlueprint, SupportedMessages, PacketResponse } from "../CommProtocol";
import type { NotificationData, SupportedNotifications } from "../CommProtocol";
import type { MessageSender, SendResponse, Variants } from "../CommProtocol";
import { BrowserApiError } from "../BrowserApiError";
import { ArrayEx, isError, isUndefined } from "../../ex";
import { ApiReturn } from "../ApiReturn.type";

type BrowserTab = browser.tabs.Tab;
type AllowListenerBeAsync<T> = Promise<T> | T;
type MessageArgs<B extends MessageBlueprint> = B extends MessageBlueprintParametered ? Parameters<B>[0] : undefined;
type MessageCommArgs<B extends MessageBlueprint> = B extends MessageBlueprintParametered ? {sender: MessageSender} & MessageArgs<B> : {sender: MessageSender};
type MessageCommReturn<B extends MessageBlueprint> = AllowListenerBeAsync<ReturnType<B>>;
type MessageCommListener<B extends MessageBlueprint> = (args: MessageCommArgs<B>) => MessageCommReturn<B>;

// #region errors
class TabsApiCallError extends BrowserApiError<"TabsApiCallError",  BackendComm<any, any>, {tabUrl: string} | {tab: BrowserTab, packet: PacketResponse}>{ };
class NoTabsWasFound extends BrowserApiError<"NoTabsWasFound", BackendComm<any, any>, {url: string}>{ };
class SendWasntSuccessfulError extends BrowserApiError<"SendWasntSuccessfulError", BackendComm<any, any>, {results: unknown[]}>{ };
class InvalidPacketError extends BrowserApiError<"InvalidPacketDescError", BackendComm<any, any>, {rawPacket: unknown, sender: MessageSender}>{ }; // TODO what to do with any? 
class MissingListenerError extends BrowserApiError<"MissingListnerError", BackendComm<any, any>, {packet: Packet, sender: MessageSender}>{ }; // TODO what to do with any?
// #endregion

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
	
	public async sendNotification<V extends Variants<SN>>(tabUrl: string, variant: V, data: NotificationData<SN[V]>) : ApiReturn<boolean, TabsApiCallError, NoTabsWasFound, SendWasntSuccessfulError>
	{
		console.log("Send notification", "tabUrl=", tabUrl, "variant=", variant, "args=", data); // TODO delete this, for debug purpose only
		const returnError = (reason: unknown) => new TabsApiCallError(this,  "Internal browser call `tabs.query()` throw error.", {tabUrl}, reason);
		const tabs = await browser.tabs.query({url: tabUrl}).catch(returnError); // TODO should `BackendComm` directly use `browser.tabs`? or had to inject `BrowserTabs`?
		if(isError(TabsApiCallError, tabs)) return tabs;
		if(ArrayEx.IsEmpty(tabs)) return new NoTabsWasFound(this, "Wanted url is not opened in any tab.", {url: tabUrl});
		const results = await ArrayEx.AsyncMap(tabs, tab => this.dispatchNotification.call(this, tab, variant, data));
		const wasErrorOccuredDuringDispatchingNotifications = (result: PromiseSettledResult<boolean | TabsApiCallError>) => result.status === "fulfilled" ? result.value instanceof BrowserApiError : true;
		if(results.find(wasErrorOccuredDuringDispatchingNotifications)) return new SendWasntSuccessfulError(this, "Notifiaction wasnt send successful to all tabs", {results});
		return true;
	}
	
	private async dispatchNotification(tab: BrowserTab, variant: Variants<SN>, data: unknown) : Promise<boolean | TabsApiCallError>
	{
		if(isUndefined(tab.id)) return false;
		const packet = CommProtocol.Pack(variant, data);
		const returnError = (reason: unknown) => new TabsApiCallError(this,  "Internal browser call `tabs.sendMessage()` throw error.", {tab, packet}, reason);
		const result = await (browser.tabs.sendMessage(tab.id, packet).catch(returnError)) as unknown; // TODO instead of local use of casting, override method type declaration return value
		// TODO notification can return data, should we read it?
		if(isError(TabsApiCallError, result)) return false;
		return true;
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