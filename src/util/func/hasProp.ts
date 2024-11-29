import { isNotNull } from "$src/util/func/isNull";
import { isNotUndefined, isUndefined } from "$src/util/func/isUndefined";

/**
 * Only those types are supported.
 */
type SupportedPropType = StringConstructor | NumberConstructor | BooleanConstructor | string | number | boolean | undefined;

/**
 * Helper type.
 */
type ResolvePropType<T extends SupportedPropType> = T extends { new (value?: unknown): infer R } ? R : T;

/**
 * Check if `obj` has `prop`, and optionally type of `obj[prop]`. 
 * Very useful function when comes to `unknown` type.
 * 
 * @param obj unknown
 * @param prop string
 * @param blueprint String, Number, Boolean, string, number, boolean
 * @returns 
 */
export function hasProp<S extends string, V extends SupportedPropType = undefined>(obj: unknown, prop: S, blueprint?: V) : obj is { [Key in S]: ResolvePropType<V> }
{
	const isNotNullObject = (obj: unknown) : obj is { [Key in S]?: V } => isNotUndefined(obj) && isNotNull(obj);
	if(isNotNullObject(obj) && isNotUndefined(obj[prop]))
	{
		if(isUndefined(blueprint)) return true; // prop exist, and that's enough, we don't want to check it's type
		return doesBlueprintMatchValue(blueprint, obj[prop]); // prop exist, and we want check it's type
	}
	return false;
}

/**
 * Check if `blueprint` match `prop` value.
 * 
 * @param blueprint 
 * @param prop 
 * @returns 
 */
function doesBlueprintMatchValue(blueprint: SupportedPropType, prop: unknown) : boolean
{
	if(blueprint === undefined)
	{
		return blueprint === prop;
	}
	if(blueprint === String)
	{
		return typeof prop === "string";
	}
	if(blueprint === Number)
	{
		return typeof prop === "number";
	}
	if(blueprint === Boolean)
	{
		return typeof prop === "boolean";
	}
	if(typeof blueprint === "string")
	{
		return blueprint === prop;
	}
	if(typeof blueprint === "number")
	{
		return blueprint === prop;
	}
	if(typeof blueprint === "boolean")
	{
		return blueprint === prop;
	}
	return false;
}