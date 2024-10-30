import { StdError } from "src/ex";

export type MessageSender = browser.runtime.MessageSender;
export type SendResponse = (response?: unknown) => void;
export type Variants<L> = keyof L & string;
export type Data = { [key: string]: Data } | Array<Data> | string | boolean | number;
export type Packet = { variant: string, data: Data };

export type ProtocolVariant = string;
export type ProtocolBlueprint = { args: Array<Data>, response: Data };
export type ProtocolBlueprintArgs<B extends ProtocolBlueprint> = B["args"];
export type ProtocolBlueprintResponse<B extends ProtocolBlueprint> = B["response"];
export type SupportedProtocol = { [variant: ProtocolVariant]: ProtocolBlueprint }

export type AddonScriptApiMethod<Args extends ProtocolBlueprint["args"], Response extends ProtocolBlueprint["response"]> = { args: Args, response: Response };
export type AddonScriptApiNotification<Args extends ProtocolBlueprint["args"]> = { args: Args };

// errors 
export class CorruptedPacketError extends StdError<"CorruptedPacketError", {payload: unknown}>{ };

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