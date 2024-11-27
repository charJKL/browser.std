/* eslint-disable @typescript-eslint/unbound-method -- global.browser.storage.local.get method is unbund */ 
import { LocalStorage as ApiLocalStorage } from "$src/api/backend/LocalStorage";
import { getBrowserMock } from "$src/util/tests/BrowserMock";

beforeAll(function mockBrowserNativeAPIObject()
{
	global.browser = getBrowserMock();
	// TODO those test are not perfect, better mock for `browser.storage` is needed.
});

beforeEach(() => {
	jest.clearAllMocks();
});

test("Using `Map<K,V>` with `api/LocalStorage` should be allowed", async() =>
{
	global.browser.storage.local.get = jest.fn().mockImplementation((key: any) => Promise.resolve(key));
	
	const blueprint = 
	{
		list: new Map()
	}
	const localStorage = new ApiLocalStorage(blueprint);
	
	const result = await localStorage.get("list");
	
	expect(global.browser.storage.local.get).toHaveBeenCalledWith({list: blueprint.list});
	expect(result).toEqual(new Map());
});

test("Store `Map<,>` should be allowed, and `Map<,>` should be serialized", async() => 
{
	global.browser.storage.local.set = jest.fn().mockImplementation((key: any) => Promise.resolve(key));
	
	const blueprint = 
	{
		list: new Map()
	}
	const localStorage= new ApiLocalStorage(blueprint);
	const value = new Map([[1, "one"], [2, "two"]]);
	const result = await localStorage.set("list", value);
	
	expect(global.browser.storage.local.set).toHaveBeenCalledWith({"list": {__map__: true, entries: [{key: 1, value: "one"},{key: 2, value: "two"},]}});
	expect(result).toBe(value);
})