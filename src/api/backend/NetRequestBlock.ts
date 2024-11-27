import { Api, BrowserNativeApiCallError, NetRequestUpdatePacket, RegexOptions, IsRegexSupportedResult } from "@src/api/Api";
import { BrowserApiError } from "@src/api/BrowserApiError";
import { isError, isFalse, isObject, isUndefined } from "@src/util/Func";
import { ArrayEx } from "@src/util/ex/ArrayEx";
import { ApiReturn, Async } from "@src/util/Types";


// #region private type
type NetRequestRuleCondition = browser.declarativeNetRequest._RuleCondition;
type NetRequestRuleAction = browser.declarativeNetRequest._RuleAction;
// #endregion

// #region public types
export type NetRequestRule = browser.declarativeNetRequest.Rule;
export type NetRequestRuleDesc = { regexp: string };
export type NetRequestRuleChange = { id: number, regexp: string };
// #endregion

/**
 * NetRequestBlock
 */
export class NetRequestBlock
{
	private readonly $redirect: string;
	
	/**
	 * @param redirect page url must be listed in `web_accessible_resources`.
	 */
	public constructor(redirect: string)
	{
		this.$redirect = redirect;
	}
	
	public async getRules(): ApiReturn<NetRequestRule[], BrowserNativeApiCallError>
	{
		return await Api.declarativeNetRequest.getDynamicRules();
	}
	
	public async addRule(rule: NetRequestRuleDesc) : ApiReturn<NetRequestRule, RegexpIsNotSupported, CantCreateUniquieIdError, BrowserNativeApiCallError>
	{
		const isRegexpValid = await this.isRegexpSupported(rule.regexp);
		if(isError(BrowserNativeApiCallError, isRegexpValid)) return isRegexpValid;
		if(isError(RegexpIsNotSupported, isRegexpValid)) return isRegexpValid;
		
		// TODO check if limit of rules are exceeded.
		
		const uniqueId = await this.getRuleUniqueId();
		if(isError(CantCreateUniquieIdError, uniqueId)) return uniqueId;
		
		// build netRequestRule:
		const regexFilter = rule.regexp;
		const regexSubstitution = this.$redirect;
		const netRequestRuleBase = {id: uniqueId, priority: 1 };
		const netRequestRuleCondition : NetRequestRuleCondition = { regexFilter, resourceTypes: ["main_frame", "sub_frame"], isUrlFilterCaseSensitive: false };
		const netRequestRuleAction : NetRequestRuleAction = { type: "redirect", redirect: { regexSubstitution } };
		const netRequestRule : NetRequestRule = { ...netRequestRuleBase, action: netRequestRuleAction, condition: netRequestRuleCondition };
		
		const packet : NetRequestUpdatePacket = { addRules: [netRequestRule] }
		const result = await Api.declarativeNetRequest.updateDynamicRules(packet);
		if(isError(BrowserNativeApiCallError, result)) return result;
		return netRequestRule;
	}
	
	public async updateRule(change: NetRequestRuleChange): ApiReturn<NetRequestRule, BrowserNativeApiCallError, RuleNotFound, RegexpIsNotSupported>
	{
		const rule = await this.getRule(change.id);
		if(isError(BrowserNativeApiCallError, rule)) return rule;
		if(isError(RuleNotFound, rule)) return rule;
		
		const isRegexpValid = await this.isRegexpSupported(change.regexp);
		if(isError(BrowserNativeApiCallError, isRegexpValid)) return isRegexpValid;
		if(isError(RegexpIsNotSupported, isRegexpValid)) return isRegexpValid;
		
		// make change:
		rule.condition.regexFilter = change.regexp;
	
		const packet : NetRequestUpdatePacket = { addRules: [rule] }
		const result = await Api.declarativeNetRequest.updateDynamicRules(packet);
		if(isError(BrowserNativeApiCallError, result)) return result;
		return rule;
	}
	
	public async removeRule(ruleDesc: { id: number} | number): ApiReturn<boolean, BrowserNativeApiCallError, RuleNotFound>
	{
		const id = isObject(ruleDesc) ? ruleDesc.id : ruleDesc;
		const rule = await this.getRule(id);
		if(isError(BrowserNativeApiCallError, rule)) return rule;
		if(isError(RuleNotFound, rule)) return rule;
		
		const packet : NetRequestUpdatePacket = { removeRuleIds: [rule.id] }
		const result = await Api.declarativeNetRequest.updateDynamicRules(packet);
		if(isError(BrowserNativeApiCallError, result)) return result;
		return true;
	}
	
	private async isRegexpSupported(regexp: string) : ApiReturn<boolean | BrowserNativeApiCallError | RegexpIsNotSupported>
	{
		const regexpOptions : RegexOptions = { regex: regexp, isCaseSensitive: false, requireCapturing: true };
		const isRegexpSupportedResult = await Api.declarativeNetRequest.isRegexSupported(regexpOptions);
		if(isError(BrowserNativeApiCallError, isRegexpSupportedResult)) return isRegexpSupportedResult;
		
		const regexpIsNotSupported = (result: IsRegexSupportedResult) : result is Required<IsRegexSupportedResult> => isFalse(result.isSupported);
		if(regexpIsNotSupported(isRegexpSupportedResult)) return new RegexpIsNotSupported({netRequestBlock: this, regexp, reason: isRegexpSupportedResult.reason});
		return isRegexpSupportedResult.isSupported;
	}
	
	private async getRuleUniqueId() : Async<number, CantCreateUniquieIdError>
	{
		const rules = await this.getRules();
		if(isError(BrowserNativeApiCallError, rules)) return new CantCreateUniquieIdError({netRequestBlock: this}, rules);
		
		const rulesIds = ArrayEx.SortAscending(rules.map(r => r.id)); // array must be sorted for further code working correctly!
		for(let i = 0; i < rules.length; i++)
		{
			if(rulesIds[i] !== i + 1) return i + 1;
		}
		return rulesIds.length + 1;
	}
	
	private async getRule(id: number) : Async<NetRequestRule, BrowserNativeApiCallError, RuleNotFound>
	{
		const rules = await this.getRules();
		if(isError(BrowserNativeApiCallError, rules)) return rules;
		
		const rule = rules.find(rule => rule.id === id);
		if(isUndefined(rule)) return new RuleNotFound({netRequestBlock: this, rules, id});
		return rule;
	}
}

/**
 * RegexpIsNotSupported
 */
export type RegexpIsNotSupportedInfo = { netRequestBlock: NetRequestBlock, regexp: string, reason: string };
export class RegexpIsNotSupported extends BrowserApiError<"RegexpIsNotSupported", RegexpIsNotSupportedInfo>
{
	static MESSAGE = "Provided regexp is not supported (is too complex) as blocking rule.";
	
	constructor(info: RegexpIsNotSupportedInfo)
	{
		super("RegexpIsNotSupported", RegexpIsNotSupported.MESSAGE, info);
	}
}

/**
 * RuleNotFoundInfo
 */
export type RuleNotFoundInfo = { netRequestBlock: NetRequestBlock, rules: NetRequestRule[], id: number};
export class RuleNotFound extends BrowserApiError<"RuleNotFound", RuleNotFoundInfo>
{
	static MESSAGE = "Rule with that id was not found.";
	
	constructor(info: RuleNotFoundInfo)
	{
		super("RuleNotFound", RuleNotFound.MESSAGE, info);
	}
}

/**
 * 
 */
export type CantCreateUniquieIdErrorInfo = { netRequestBlock: NetRequestBlock }
export class CantCreateUniquieIdError extends BrowserApiError<"CantCreateUniquieIdError", CantCreateUniquieIdErrorInfo>
{
	static MESSAGE = "Cant create unique id for rule because can't retrive rules list.";
	
	constructor(info: CantCreateUniquieIdErrorInfo, cause: unknown)
	{
		super("CantCreateUniquieIdError", CantCreateUniquieIdError.MESSAGE, info, cause);
	}
}