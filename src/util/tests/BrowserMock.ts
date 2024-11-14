import { isUndefined } from "@src/util/Func";

export function getBrowserMock() : typeof browser
{
	/* eslint-disable -- we must use a lot of `any` type here */
	const handler : ProxyHandler<any> =
	{
		get(target, key)
		{
			// TODO check property descriptor restrictions
			if(isUndefined(target[key])) 
			{
				target[key] = new Proxy(new Function(), handler);
			}
			return target[key];
		},
		set(target, key, value)
		{
			// TODO check property descriptor restrictions
			target[key] = value;
			return true;
		}
	}
	/* eslint-enable */
	return new Proxy({}, handler) as typeof browser; 
}