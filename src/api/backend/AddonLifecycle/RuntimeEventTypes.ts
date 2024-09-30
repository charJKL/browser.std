export type InstalledDetails = browser.runtime._OnInstalledDetails;
export type UpdateAvailableDetails = browser.runtime._OnUpdateAvailableDetails;

export interface RuntimeEventTypes
{
	"onStartup": () => void,
	"onInstalled": (details: InstalledDetails) => void,
	"onSuspend": () => void,
	"onSuspendCanceled": () => void,
	"onUpdateAvailable": (details: UpdateAvailableDetails) => void
}
