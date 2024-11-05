
export type InstallationDetails = browser.runtime._OnInstalledDetails;
export type UpdateDetails = browser.runtime._OnUpdateAvailableDetails;

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
			addListener: function(cb: () => void) { browser.runtime.onSuspend.addListener(cb) },
			removeListener: function(cb: () => void) { browser.runtime.onSuspend.removeListener(cb) }
		},
		onSuspendCanceled:
		{ 
			addListener: function(cb: () => void) { browser.runtime.onSuspendCanceled.addListener(cb) },
			removeListener: function(cb: () => void) { browser.runtime.onSuspendCanceled.removeListener(cb) } 
		},
		onUpdateAvailable: 
		{ 
			addListener: function(cb: (details: UpdateDetails) => void) { browser.runtime.onUpdateAvailable.addListener(cb) },
			removeListener: function(cb: (details: UpdateDetails) => void) { browser.runtime.onUpdateAvailable.removeListener(cb) } 
		}
	}
}