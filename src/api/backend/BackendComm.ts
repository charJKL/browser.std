import { CommProtocol, CorruptedPacketError, type Data, type Packet } from "../CommProtocol";
import type { MessageBlueprintArgs, MessageBlueprint, SupportedMessages, MessageBlueprintResponse } from "../CommProtocol";
import type { NotificationData, SupportedNotifications } from "../CommProtocol";
import type { MessageSender, SendResponse, Variants } from "../CommProtocol";
import { BrowserApiError } from "../BrowserApiError";
import { ArrayEx, isError, isUndefined, isNotArray } from "../../ex";
import { ApiReturn } from "../ApiReturn.type";
import { safeCast } from "../../ex";

type BrowserTab = browser.tabs.Tab;
type AllowListenerBeAsync<T> = Promise<T> | T;
type MessageListenerArgs<B extends MessageBlueprint> = [...MessageBlueprintArgs<B>, sender: MessageSender];
type MessageListenerResponse<B extends MessageBlueprint> = AllowListenerBeAsync<MessageBlueprintResponse<B>>;
type MessageListener<B extends MessageBlueprint> = (...args: MessageListenerArgs<B>) => MessageListenerResponse<B>;

// errors:
class TabsApiCallError extends BrowserApiError<"TabsApiCallError",  BackendComm<any, any>, {tabUrl: string} | {tab: BrowserTab, packet: Packet}>{ };
class NoTabsWasFound extends BrowserApiError<"NoTabsWasFound", BackendComm<any, any>, {url: string}>{ };
class SendWasntSuccessfulError extends BrowserApiError<"SendWasntSuccessfulError", BackendComm<any, any>, {results: unknown[]}>{ };
class InvalidPacketError extends BrowserApiError<"InvalidPacketDescError", BackendComm<any, any>, {payload: unknown, sender: MessageSender}>{ }; // TODO what to do with any? 
class MissingListenerError extends BrowserApiError<"MissingListnerError", BackendComm<any, any>, {packet: Packet, sender: MessageSender}>{ }; // TODO what to do with any?

/**
 * BackendComm
 */
export class BackendComm<SM extends SupportedMessages, SN extends SupportedNotifications>
{
	private listeners: Map<Variants<SM>, MessageListener<MessageBlueprint>>
	
	public constructor()
	{
		browser.runtime.onMessage.addListener(this.dispatchMessage.bind(this));
		this.listeners = new Map();
	}
	
	public addMessageListener<V extends Variants<SM>>(variant: V, listeners: MessageListener<SM[V]>) : void
	{
		this.listeners.set(variant, safeCast<MessageListener<SM[V]>, MessageListener<MessageBlueprint>>(listeners));
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
	
	private async dispatchNotification(tab: BrowserTab, variant: Variants<SN>, data: Data) : Promise<boolean | TabsApiCallError>
	{
		if(isUndefined(tab.id)) return false;
		const packet = CommProtocol.Pack(variant, data);
		const returnError = (reason: unknown) => new TabsApiCallError(this,  "Internal browser call `tabs.sendMessage()` throw error.", {tab, packet}, reason);
		const result = await (browser.tabs.sendMessage(tab.id, packet).catch(returnError)) as unknown; // TODO instead of local use of casting, override method type declaration return value
		// TODO notification can return data, should we read it?
		if(isError(TabsApiCallError, result)) return false;
		return true;
	}
	
	private dispatchMessage(payload: unknown, sender: MessageSender, sendResponse: SendResponse)
	{
		try
		{
			const packet = CommProtocol.ValidatePacket(payload);
			if(isError(CorruptedPacketError, packet)) throw new InvalidPacketError(this, "Message packet is invalid.", {payload, sender});
			const listener = this.listeners.get(packet.variant);
			if(isUndefined(listener)) throw new MissingListenerError(this, "Listener for packet is not set.", {packet, sender});
			if(isNotArray(packet.data)) throw new Error(); // TODO
			const args = [...packet.data, sender] as const;
			void (async function() {
				const result = await listener(...args);
				const response = CommProtocol.Pack(packet.variant, result);
				sendResponse(response);
			})();
			return true;
			// Does this need try? SendREsponse
		}
		catch(e)
		{
			// DO NOTHING
			console.log(e); // TODO what to do now? Response with failure message?
			return true;
		}
	}
}