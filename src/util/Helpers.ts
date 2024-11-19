
/**
 * Build Promise form async return type.
 */
export type Async<T1, T2 = never, T3 = never, T4 = never> = Promise<T1 | T2 | T3 | T4>;

/**
 * Extract property names from object.
 */
export type Names<T extends {[key: string] : unknown}> = keyof T & string;

/**
 * Type useful in return types, indicating that function is allowed to by `async`.
 */
export type AllowBeAsync<T> = Promise<T> | T;

/**
 * Make one property of type optional.
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>