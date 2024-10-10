import { BrowserApiError } from "../BrowserApiError";
import { ApiReturn } from "../ApiReturn.type";
import { isError, isUndefined } from "../../ex";
import { ArrayEx } from "../../ex";

// #region private type
type NetRequestRuleCondition = browser.declarativeNetRequest._RuleCondition;
type NetRequestRuleAction = browser.declarativeNetRequest._RuleAction;
type NetRequestUpdatePacket = browser.declarativeNetRequest._UpdateDynamicRulesOptions;
type RegexOptions = browser.declarativeNetRequest._IsRegexSupportedRegexOptions;
type IsRegexSupportedResult = browser.declarativeNetRequest._IsRegexSupportedReturnResult;
// #endregion


// #region public types
export type NetRequestRule = browser.declarativeNetRequest.Rule;
export type NetRequestRulePart = { regexp: string };
// #endregion


// #region errors
abstract class NetRequestBlockError<ID, I> extends BrowserApiError<ID, NetRequestBlock, I>{ };
export class NetRequestBlockApiCallError extends NetRequestBlockError<"NetRequestBlockCallError", {}>{ };
export class GetRuleUniqueIdError extends NetRequestBlockError<"GetRuleUniqueIdError", {}> { };
export class RegexpIsNotSupported extends NetRequestBlockError<"RegexpIsNotSupported", {regexp: string, reason: string}>{ };
// #endregion

// #region NetRequestBlock
export class NetRequestBlock
{
	private redirect: string;
	
	/**
	 * @param redirect page url must be listed in `web_accessible_resources`.
	 */
	public constructor(redirect: string)
	{
		this.redirect = redirect;
	}
	
	public async getRules(): ApiReturn<NetRequestRule[], NetRequestBlockApiCallError>
	{
		const returnError = (reason: string) => new NetRequestBlockApiCallError(this, browser.declarativeNetRequest.getDynamicRules, {}, reason);
		return browser.declarativeNetRequest.getDynamicRules().catch(returnError);
	}
	
	public async addRule(rule: NetRequestRulePart) : ApiReturn<NetRequestRule, RegexpIsNotSupported, GetRuleUniqueIdError, NetRequestBlockApiCallError>
	{
		const isRegexpValid = await this.isRegexpSupported(rule.regexp);
		if(isError(NetRequestBlockApiCallError, isRegexpValid)) return isRegexpValid;
		if(isError(RegexpIsNotSupported, isRegexpValid)) return isRegexpValid;
		
		const uniqueId = await this.getRuleUniqueId();
		if(isError(GetRuleUniqueIdError, uniqueId)) return uniqueId;
		
		// TODO check if limit of rules are exceeded.
		
		// build netRequestRule:
		const regexFilter = rule.regexp;
		const regexSubstitution = this.redirect;
		const netRequestRuleBase = {id: uniqueId, priority: 1 };
		const netRequestRuleCondition : NetRequestRuleCondition = { regexFilter, resourceTypes: ["main_frame", "sub_frame"], isUrlFilterCaseSensitive: false };
		const netRequestRuleAction : NetRequestRuleAction = { type: "redirect", redirect: { regexSubstitution } };
		const netRequestRule : NetRequestRule = { ...netRequestRuleBase, action: netRequestRuleAction, condition: netRequestRuleCondition };
		
		const packet : NetRequestUpdatePacket = { addRules: [netRequestRule] }
		const returnError = (reason: string) => new NetRequestBlockApiCallError(this, browser.declarativeNetRequest.updateSessionRules, {packet}, reason);
		const result = await browser.declarativeNetRequest.updateDynamicRules(packet).catch(returnError);
		if(isError(NetRequestBlockApiCallError, result)) return result;
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
	
	private async isRegexpSupported(regexp: string) : ApiReturn<boolean | NetRequestBlockApiCallError | RegexpIsNotSupported>
	{
		const regexpOptions : RegexOptions = { regex: regexp, isCaseSensitive: false, requireCapturing: true };
		const returnError = (reason: string) => new NetRequestBlockApiCallError(this, browser.declarativeNetRequest.isRegexSupported, {regexp}, reason);
		const isRegexpSupportedResult = await browser.declarativeNetRequest.isRegexSupported(regexpOptions).catch(returnError);
		if(isError(NetRequestBlockApiCallError, isRegexpSupportedResult)) return isRegexpSupportedResult;
		
		const regexpIsNotSupported = (result: IsRegexSupportedResult) : result is Required<IsRegexSupportedResult> => result.isSupported === false;
		if(regexpIsNotSupported(isRegexpSupportedResult)) return new RegexpIsNotSupported(this, "Provided regexp is not supported by browser.", {regexp, reason: isRegexpSupportedResult.reason});
		return isRegexpSupportedResult.isSupported;
	}
	
	private async getRuleUniqueId() : ApiReturn<number, GetRuleUniqueIdError>
	{
		const rules = await this.getRules();
		if(isError(NetRequestBlockApiCallError, rules)) return new GetRuleUniqueIdError(this, "Can't retrieve rules list for finding unique id.", {}, rules);
		
		const rulesIds = ArrayEx.SortAscending(rules.map(r => r.id)); // array must be sorted for further code working correctly!
		for(let i = 0; i < rules.length; i++)
		{
			if(rulesIds[i] !== i + 1) return i + 1;
		}
		return rulesIds.length + 1;
	}
}