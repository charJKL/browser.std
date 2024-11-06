// TOOD how to configure VSCode TS for this file?
import { BackendComm as ApiBackendComm } from "@src/api/backend/BackendComm";
import { AddonScriptApiMethod } from "@src/api/CommProtocol";

import { NoTabsWasFound } from "@src/api/backend/BackendComm";




test("I should be send message only to FrontendScripts.", () => {
	
	type Supported = 
	{
		"getData": AddonScriptApiMethod<[id: number], number>;
	}

	// TODO how to mock global.browser object?
	//global.browser = {} as typeof browser; 
	global.browser = { runtime: {} as typeof browser.runtime } as typeof browser; 
	global.browser.runtime.sendMessage = jest.fn().mockImplementation(() => 2);
	global.browser.runtime.onMessage.addListener = jest.fn();
	//jest.spyOn(browser.runtime, "sendMessage");
	Object.defineProperty(global.browser, 'runtime', { value: () => 0.5 })


	const BackendComm = new ApiBackendComm<Supported>();
	
	const result = BackendComm.sendMessage("getData", "settings/page", [23]);
	
	 expect(result).toBeInstanceOf(NoTabsWasFound);
});
