import { BackendComm as ApiBackendComm, NoTabsWasFound } from "$src/api/backend/BackendComm";
import { MessageToBackend, MessageToFrontend } from "$src/api/CommProtocol";
import { getBrowserMock } from "$src/util/tests/BrowserMock";

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
	const result = await BackendComm.sendMessage(pageUrl, "getUser", 23);
	
	expect(global.browser.tabs.query).toHaveBeenCalledWith({url: pageUrl});
	expect(result).toBeInstanceOf(NoTabsWasFound);
});