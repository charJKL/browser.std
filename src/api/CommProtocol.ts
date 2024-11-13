import { StdError } from "@src/util/StdError";

/**
 * Types used to define supported communication messages, it's params and results.
 */
export type Data = { [key: string]: Data } | Array<Data> | string | number | boolean;
export type Packet = { variant: string, data: Data };

type ProtocolVariant = string;
export type ProtocolBlueprint = { direction: "toBackend" | "toFrontend", args: Data[], result: Data };
export type ProtocolDesc = { [variant: ProtocolVariant] : ProtocolBlueprint };

// helper types which are used to build `ProtolDesc`:
/**
 * Because template args are contravariant we want `any` here to disable type check 
 * otherwise building `ProtocolDesc` will have no sense.
 */
type MessageProtocolDesc = (...args: any[]) => Data; // eslint-disable-line @typescript-eslint/no-explicit-any -- reason is in comment above
type Direction<N, D extends MessageProtocolDesc> = Parameters<D> extends Data ? N : never;
export type MessageToBackend<D extends MessageProtocolDesc> = { direction: Direction<"toBackend", D>, args: Parameters<D>, result: ReturnType<D> };
export type MessageToFrontend<D extends MessageProtocolDesc> = { direction: Direction<"toFrontend", D>, args: Parameters<D>, result: ReturnType<D> };

// helper types which filters messages by direction:
type Values<T extends { [key: string]: unknown }> = T[keyof T] & string;
export type ToBackendOnly<D extends ProtocolDesc> = Values<{ [key in keyof D]: D[key]["direction"] extends "toBackend" ? key : never }>;
export type ToFrontendOnly<D extends ProtocolDesc> = Values<{ [key in keyof D]: D[key]["direction"] extends "toFrontend" ? key : never }>;

// errors 
export class CorruptedPacketError extends StdError<"CorruptedPacketError", {payload: unknown}>{ };

/**
 * CommProtocol
 */
export abstract class CommProtocol
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
abstract class Serializer
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