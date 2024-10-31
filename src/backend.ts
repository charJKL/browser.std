// TODO replace relative path with absolute to "src/", some builder must be used to achive this.
export { AddonLifecycle } from "./api/backend/AddonLifecycle";
export { BackendComm } from "./api/backend/BackendComm";
export { NetRequestBlock } from "./api/backend/NetRequestBlock";
export { Storage } from "./api/backend/Storage";

export type { InstallationDetails, UpdateDetails } from "./api/backend/AddonLifecycle";
export type { AddonScriptApiMethod, AddonScriptApiNotification } from "./api/CommProtocol";
