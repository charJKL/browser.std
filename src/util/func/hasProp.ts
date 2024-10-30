import { isNotNull, isNotUndefined } from "src/util";

export function hasProp<S extends string>(value: any, prop: S) : value is {[Key in S]: unknown}
{
	return isNotUndefined(value) && isNotNull(value) && isNotUndefined(value[prop]);
}
