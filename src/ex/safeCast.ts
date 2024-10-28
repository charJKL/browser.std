/**
 * This function is used in place where we know that casting is 100% safe, 
 * but type system can't reason types correctly, because of TS shortcoming.
 * 
 * @param value to be casted 
 * @returns value casted to wanted Type
 */
export function safeCast<FROM, TO>(value: FROM) : TO // eslint-disable-line @typescript-eslint/no-unnecessary-type-parameters -- we want to be explicit about casting
{
	return value as unknown as TO;
}