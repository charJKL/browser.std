import { StdError } from "src/util/StdError";

export type InstallationDetails = browser.runtime._OnInstalledDetails;
export type UpdateDetails = browser.runtime._OnUpdateAvailableDetails;
export type NetRequestRule = browser.declarativeNetRequest.Rule;
export type NetRequestUpdatePacket = browser.declarativeNetRequest._UpdateDynamicRulesOptions;
export type RegexOptions = browser.declarativeNetRequest._IsRegexSupportedRegexOptions;
export type IsRegexSupportedResult = browser.declarativeNetRequest._IsRegexSupportedReturnResult;

// errors:
export class BrowserNativeApiCallError extends StdError<"BrowserNativeApiCallError", object> { };

function returnError(reason: unknown) : BrowserNativeApiCallError
{
	return new BrowserNativeApiCallError("Browser native method call throw error.", {}, reason);
}

export type ApiReturn<T0, T1 = never, T2 = never, T3 = never> = Promise<T0 | T1 | T2 | T3>;

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
	}
}

