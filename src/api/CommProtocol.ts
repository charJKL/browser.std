import { StdError } from "../ex";

export type MessageSender = browser.runtime.MessageSender;
export type SendResponse = (response?: unknown) => void;

type MessageVariant = string;
export type MessageBlueprintParametless = () => unknown;
export type MessageBlueprintParametered = (args: any) => unknown; // TODO what to do with `any`?
export type MessageBlueprint = MessageBlueprintParametless | MessageBlueprintParametered;
export type SupportedMessages = { [variant: MessageVariant]: MessageBlueprint };

type NotifiactionVariant = string;
export type NotificationBlueprint = () => unknown;
export type NotificationData<B extends NotificationBlueprint> = ReturnType<B>;
export type NotificationListener<B extends NotificationBlueprint> = (data: NotificationData<B>) => void;
export type SupportedNotifications = { [variant: NotifiactionVariant]: NotificationBlueprint };

export type Variants<L> = keyof L & string;
export type Packet = { variant: string, payload : object };
export type PacketResponse = { status: string, data: object };

// #region errors
export class CorruptedPacketError extends StdError<"InvalidPacketError", object>{ };
// #endregion

export abstract class CommProtocol // eslint-disable-line @typescript-eslint/no-extraneous-class -- it's matter of style, CommProtocol groups messages utils methods.
{
	public static ValidatePacket(packet: unknown) : Packet | CorruptedPacketError
	{
		// TOOD check if packet is valid
		return { variant: "", payload: {} };
	}
	
	public static Pack(variant: string, data: unknown) : PacketResponse
	{
		// TODO heck type of data and pack it appropriately
		return { status: "Sucess", data: {} };
	}
	
	public static Unpack(data: unknown) : T
	{
		
	}
}