import { Api, BrowserNativeApiCallError, NetRequestUpdatePacket, RegexOptions, IsRegexSupportedResult, type ApiReturn } from "@src/api/Api";
import { BrowserApiError } from "@src/api/BrowserApiError";
import { ArrayEx, isError, isFalse } from "@src/util";


// #region private type
type NetRequestRuleCondition = browser.declarativeNetRequest._RuleCondition;
type NetRequestRuleAction = browser.declarativeNetRequest._RuleAction;
// #endregion

// #region public types
export type NetRequestRule = browser.declarativeNetRequest.Rule;
export type NetRequestRulePart = { regexp: string };
// #endregion


// #region errors
abstract class NetRequestBlockError<ID extends string, I extends object> extends BrowserApiError<ID, NetRequestBlock, I>{ };
export class GetRuleUniqueIdError extends NetRequestBlockError<"GetRuleUniqueIdError", object> { };
export class RegexpIsNotSupported extends NetRequestBlockError<"RegexpIsNotSupported", {regexp: string, reason: string}>{ };
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
	
	public async addRule(rule: NetRequestRulePart) : ApiReturn<NetRequestRule, RegexpIsNotSupported, GetRuleUniqueIdError, BrowserNativeApiCallError>
	{
		const isRegexpValid = await this.isRegexpSupported(rule.regexp);
		if(isError(BrowserNativeApiCallError, isRegexpValid)) return isRegexpValid;
		if(isError(RegexpIsNotSupported, isRegexpValid)) return isRegexpValid;
		
		const uniqueId = await this.getRuleUniqueId();
		if(isError(GetRuleUniqueIdError, uniqueId)) return uniqueId;
		
		// TODO check if limit of rules are exceeded.
		
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
	
	public async updateRule(): ApiReturn<void>
	{
		// TODO
	}
	
	public async deleteRule(): ApiReturn<void>
	{
		// TODO
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
	
	private async getRuleUniqueId() : ApiReturn<number, GetRuleUniqueIdError>
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
}