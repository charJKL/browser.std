import { BackendComm as ApiBackendComm, NoTabsWasFound } from "@src/api/backend/BackendComm";
import { MessageToBackend, MessageToFrontend } from "@src/api/CommProtocol";
import { isUndefined } from "@src/util/Func";

function getBrowserMock() : typeof browser
{
	/* eslint-disable -- we must use a lot of `any` type here */
	const handler : ProxyHandler<any> =
	{
		get(target, key)
		{
			// TODO check property descriptor restrictions
			if(isUndefined(target[key])) 
			{
				target[key] = new Proxy(new Function(), handler);
			}
			return target[key];
		},
		set(target, key, value)
		{
			// TODO check property descriptor restrictions
			target[key] = value;
			return true;
		}
	}
	/* eslint-enable */
	return new Proxy({}, handler) as typeof browser; 
}

beforeAll(function mockBrowserNativeAPIObject()
{
	global.browser = getBrowserMock();
});

beforeEach(() => {
	jest.clearAllMocks();
});

test("Using `api/BackendComm` only message to frontend shold be allowed.", async () => 
{
	global.browser.tabs.query = jest.fn().mockImplementation(() => Promise.resolve([]));
	
	type Supported = 
	{
		"getUser": MessageToFrontend<(id: number) => {name: string}>;
		"getData2": MessageToBackend<() => number>
	}
	const pageUrl = "www.settingsPage.com";
	const BackendComm = new ApiBackendComm<Supported>();
	const result = await BackendComm.sendMessage("getUser", pageUrl, 23);
	
	expect(global.browser.tabs.query).toHaveBeenCalledWith({url: pageUrl});
	expect(result).toBeInstanceOf(NoTabsWasFound);
});