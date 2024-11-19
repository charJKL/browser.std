import { Api, BrowserNativeApiCallError, NetRequestUpdatePacket, RegexOptions, IsRegexSupportedResult, type ApiReturn } from "@src/api/Api";
import { BrowserApiError } from "@src/api/BrowserApiError";
import { isError, isFalse, isObject, isUndefined } from "@src/util/Func";
import { ArrayEx } from "@src/util/ex/ArrayEx";
import { Async } from "@src/util/Helpers";

// #region private type
type NetRequestRuleCondition = browser.declarativeNetRequest._RuleCondition;
type NetRequestRuleAction = browser.declarativeNetRequest._RuleAction;
// #endregion

// #region public types
export type NetRequestRule = browser.declarativeNetRequest.Rule;
export type NetRequestRuleDesc = { regexp: string };
export type NetRequestRuleChange = { id: number, regexp: string };
// #endregion


// #region errors
abstract class NetRequestBlockError<ID extends string, I extends object> extends BrowserApiError<ID, NetRequestBlock, I>{ };
export class GetRuleUniqueIdError extends NetRequestBlockError<"GetRuleUniqueIdError", object> { };
export class RegexpIsNotSupported extends NetRequestBlockError<"RegexpIsNotSupported", {regexp: string, reason: string}>{ };
export class RuleNotFound extends NetRequestBlockError<"RuleNotFound", {rules: NetRequestRule[], id: number}> { };
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
	
	public async addRule(rule: NetRequestRuleDesc) : ApiReturn<NetRequestRule, RegexpIsNotSupported, GetRuleUniqueIdError, BrowserNativeApiCallError>
	{
		const isRegexpValid = await this.isRegexpSupported(rule.regexp);
		if(isError(BrowserNativeApiCallError, isRegexpValid)) return isRegexpValid;
		if(isError(RegexpIsNotSupported, isRegexpValid)) return isRegexpValid;
		
		// TODO check if limit of rules are exceeded.
		
		const uniqueId = await this.getRuleUniqueId();
		if(isError(GetRuleUniqueIdError, uniqueId)) return uniqueId;
		
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
		if(regexpIsNotSupported(isRegexpSupportedResult)) return new RegexpIsNotSupported(this, "Provided regexp is not supported by browser.", {regexp, reason: isRegexpSupportedResult.reason});
		return isRegexpSupportedResult.isSupported;
	}
	
	private async getRuleUniqueId() : Async<number, GetRuleUniqueIdError>
	{
		const rules = await this.getRules();
		if(isError(BrowserNativeApiCallError, rules)) return new GetRuleUniqueIdError(this, "Can't retrieve rules list for finding unique id.", {}, rules);
		
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
		if(isUndefined(rule)) return new RuleNotFound(this, "Rule was not found", { rules, id });
		return rule;
	}
}