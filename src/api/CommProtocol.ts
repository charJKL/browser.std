import { StdError } from "../ex";

export type MessageSender = browser.runtime.MessageSender;
export type SendResponse = (response?: unknown) => void;

type MessageVariant = string;
export type MessageBlueprintParametless = () => unknown;
export type MessageBlueprintParametered = (args: Data) => Data;
export type MessageBlueprint = MessageBlueprintParametless | MessageBlueprintParametered;
export type MessageBlueprintArgs<B extends MessageBlueprint> = B extends MessageBlueprintParametered ? Parameters<B>[0] : undefined;
export type MessageBlueprintResult<B extends MessageBlueprint> = ReturnType<B>;
export type SupportedMessages = { [variant: MessageVariant]: MessageBlueprint };

type NotifiactionVariant = string;
export type NotificationBlueprint = () => Data;
export type NotificationData<B extends NotificationBlueprint> = ReturnType<B>;
export type NotificationListener<B extends NotificationBlueprint> = (data: NotificationData<B>) => void;
export type SupportedNotifications = { [variant: NotifiactionVariant]: NotificationBlueprint };

export type Variants<L> = keyof L & string;
export type Data = { [key: string] : Data } | Array<Data> | string | boolean | number;
export type Packet = { variant: string, data: Data };

// errors 
export class CorruptedPacketError extends StdError<"CorruptedPacketError", object>{ };

/**
 * 
 */
export abstract class CommProtocol // eslint-disable-line @typescript-eslint/no-extraneous-class -- it's matter of style, CommProtocol groups messages utils methods.
{
	public static ValidatePacket(payload: unknown) : Packet | CorruptedPacketError
	{
		// TODO use ajv.js validator to check if payload is valid
		const packet = payload as {variant: string, data: string};
		const unserializeData = Serializer.Deserialize(packet.data);
		return { variant: packet.variant, data: unserializeData };
	}
	
	public static Pack(variant: string, data: Data) : Packet
	{
		const serializedData = Serializer.Serialize(data);
		return { variant: variant, data: serializedData };
	}
}

/**
 * 
 */
abstract class Serializer // eslint-disable-line @typescript-eslint/no-extraneous-class -- it's matter of style, Serializer groups 
{
	// TODO write support for StdError.
	// TODO write support for Map.
	static Serialize(value: Data) : string
	{
		return JSON.stringify(value);
	}
	
	static Deserialize(value: string) : Data
	{
		return JSON.parse(value) as Data; // TODO how to verify if returned json is valid?
	}
}