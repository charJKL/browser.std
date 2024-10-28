import { StdError } from "src/ex";

export type MessageSender = browser.runtime.MessageSender;
export type SendResponse = (response?: unknown) => void;

type MessageVariant = string;
export type MessageBlueprint = { args: Array<Data>, response: Data };
export type MessageBlueprintArgs<B extends MessageBlueprint> = B["args"];
export type MessageBlueprintResponse<B extends MessageBlueprint> = B["response"];
export type SupportedMessages = { [variant: MessageVariant]: MessageBlueprint };

type NotifiactionVariant = string;
export type NotificationBlueprint = { args: Array<Data> };
export type NotificationData<B extends NotificationBlueprint> = B["args"];
export type SupportedNotifications = { [variant: NotifiactionVariant]: NotificationBlueprint };

export type AddonScriptApiMethod<Args extends MessageBlueprint["args"], Response extends MessageBlueprint["response"]> = { args: Args, response: Response };
export type AddonScriptApiNotification<Args extends MessageBlueprint["args"]> = { args: Args };
export type Variants<L> = keyof L & string;
export type Data = { [key: string]: Data } | Array<Data> | string | boolean | number;
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