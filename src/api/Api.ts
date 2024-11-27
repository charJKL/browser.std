import { StdError } from "$src/util/StdError";
import { ApiReturn } from "$src/util/Types";

export type InstallationDetails = browser.runtime._OnInstalledDetails;
export type UpdateDetails = browser.runtime._OnUpdateAvailableDetails;

export type NetRequestRule = browser.declarativeNetRequest.Rule;
export type NetRequestUpdatePacket = browser.declarativeNetRequest._UpdateDynamicRulesOptions;
export type RegexOptions = browser.declarativeNetRequest._IsRegexSupportedRegexOptions;
export type IsRegexSupportedResult = browser.declarativeNetRequest._IsRegexSupportedReturnResult;

export type MessageSender = browser.runtime.MessageSender;
export type SendResponse = (response?: unknown) => void;
export type SendMessageToBackgroundOptions = browser.runtime._SendMessageOptions;

export type QueryInfo = browser.tabs._QueryQueryInfo;
export type BrowserTab = browser.tabs.Tab;
export type SendMessageToTabOptions = browser.tabs._SendMessageOptions;


/**
 * Wrapper class around all native Api call.
 * Mainly because of 3 reasons:
 * 1. Main reason is to catch all possible exception, we don't want them in code.
 * 2. It will be helpful later when we want to build cross-browser extension.
 * 3. Fixing any incompatibilities between browsers.
 */
export const Api =
{
	runtime:
	{
		onStartUp: 
		{ 
			addListener: function(cb: () => void) { browser.runtime.onStartup.addListener(cb) },
			removeListener: function(cb: () => void) { browser.runtime.onStartup.removeListener(cb) } 
		},
		onInstalled: 
		{ 
			addListener: function(cb: (details: InstallationDetails) => void) { browser.runtime.onInstalled.addListener(cb) },
			removeListener: function(cb: (details: InstallationDetails) => void) { browser.runtime.onInstalled.removeListener(cb) } 
		},
		onSuspend: 
		{
			addListener(cb: () => void) { browser.runtime.onSuspend.addListener(cb) },
			removeListener(cb: () => void) { browser.runtime.onSuspend.removeListener(cb) }
		},
		onSuspendCanceled:
		{ 
			addListener(cb: () => void) { browser.runtime.onSuspendCanceled.addListener(cb) },
			removeListener(cb: () => void) { browser.runtime.onSuspendCanceled.removeListener(cb) } 
		},
		onUpdateAvailable: 
		{ 
			addListener(cb: (details: UpdateDetails) => void) { browser.runtime.onUpdateAvailable.addListener(cb) },
			removeListener(cb: (details: UpdateDetails) => void) { browser.runtime.onUpdateAvailable.removeListener(cb) } 
		},
		onMessage:
		{
			addListener(cb: (message: unknown, sender: MessageSender, sendResponse: SendResponse) => boolean | Promise<unknown>) { browser.runtime.onMessage.addListener(cb) },
			removeListener(cb: (message: unknown, sender: MessageSender, sendResponse: SendResponse) => boolean | Promise<unknown>) { browser.runtime.onMessage.removeListener(cb) } 
		},
		sendMessage(message: unknown, options?: SendMessageToBackgroundOptions ) : ApiReturn<unknown, BrowserNativeApiCallError>
		{
			return browser.runtime.sendMessage(message, options).catch(returnError);
		}
	},
	declarativeNetRequest:
	{
		getDynamicRules() : ApiReturn<NetRequestRule[], BrowserNativeApiCallError>
		{
			return browser.declarativeNetRequest.getDynamicRules().catch(returnError);
		},
		updateDynamicRules(packet: NetRequestUpdatePacket): ApiReturn<void, BrowserNativeApiCallError>
		{
			return browser.declarativeNetRequest.updateDynamicRules(packet).catch(returnError);
		},
		isRegexSupported(regexpOption: RegexOptions): ApiReturn<IsRegexSupportedResult, BrowserNativeApiCallError>
		{
			return browser.declarativeNetRequest.isRegexSupported(regexpOption).catch(returnError);
		}
	},
	storage:
	{
		local:
		{
			get(keys: null | string | string[] | { [key: string]: unknown; }): ApiReturn<{[key: string]: unknown}, BrowserNativeApiCallError>
			{
				return browser.storage.local.get(keys).catch(returnError);
			},
			set(items: { [key: string]: unknown;}): ApiReturn<void, BrowserNativeApiCallError>
			{
				return browser.storage.local.set(items).catch(returnError);
			},
			remove(keys: string | string[]) : ApiReturn<void, BrowserNativeApiCallError>
			{
				return browser.storage.local.remove(keys).catch(returnError);
			}
		}
	},
	tabs:
	{
		query(queryInfo: QueryInfo): ApiReturn<BrowserTab[], BrowserNativeApiCallError>
		{
			return browser.tabs.query(queryInfo).catch(returnError);
		},
		sendMessage(tabId: number, message: unknown, options?: SendMessageToTabOptions): ApiReturn<unknown, BrowserNativeApiCallError>
		{
			return browser.tabs.sendMessage(tabId, message, options).catch(returnError);
		}
	}
}

function returnError(reason: unknown) : BrowserNativeApiCallError
{
	return new BrowserNativeApiCallError(reason);
}

/**
 * BrowserNativeApiCallError
 */
export class BrowserNativeApiCallError extends StdError<"BrowserNativeApiCallError", object>
{
	static MESSAGE = "Browser native method call throw error.";
	
	constructor(cause: unknown)
	{
		super("BrowserNativeApiCallError", BrowserNativeApiCallError.MESSAGE, {}, cause)
	}
}