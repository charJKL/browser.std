/**
 * This function is used in place where we must cast type.
 * In most cases because wrongly typed external code (in most 
 * cases when return value is `any` instead of `unknown`.
 * 
 * @param value to be casted 
 * @returns value casted to wanted Type
 */
export function unsafeCast<FROM, TO>(value: FROM) : TO // eslint-disable-line @typescript-eslint/no-unnecessary-type-parameters -- we want to be explicit about casting
{
	return value as unknown as TO;
}