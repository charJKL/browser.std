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
type NetRequestBlockErrorInfo = { netRequestBlock: NetRequestBlock };
export class GetDynamicRulesError extends BrowserApiError<"GetDynamicRulesError", NetRequestBlockErrorInfo & {reason: string}>{ };
export class UpdateDynamicRulesError extends BrowserApiError<"UpdateDynamicRulesError", NetRequestBlockErrorInfo & {reason: string}>{ };
export class RuleWasNotFound extends BrowserApiError<"RuleWasNotFound", NetRequestBlockErrorInfo & {reason: string}>{ };
export class IsRegexSupportedError extends BrowserApiError<"IsRegexSupportedError", NetRequestBlockErrorInfo & {reason: string}>{ };
export class RegexpIsNotSupported extends BrowserApiError<"RegexpIsNotSupported", NetRequestBlockErrorInfo & {reason: string}>{ };
export class GetRuleIniqueIdError extends BrowserApiError<"GetRuleIniqueIdError", {netRequestBlock: NetRequestBlock}>{ };
// #endregion


// #region NetRequestBlock
export class NetRequestBlock
{
	private redirect: string;
	
	public constructor(redirect: string)
	{
		this.redirect = redirect;
	}
	
	public async getRules(): ApiReturn<NetRequestRule[], GetDynamicRulesError>
	{
		const returnError = (reason: string) => new GetDynamicRulesError({netRequestBlock: this, reason});
		return browser.declarativeNetRequest.getDynamicRules().catch(returnError);
	}
	
	public async addRule(rule: NetRequestRulePart) : ApiReturn<NetRequestRule, RegexpIsNotSupported, UpdateDynamicRulesError>
	{
		const isRegexpValid = await this.isRegexpSupported(rule.regexp);
		if(isError(IsRegexSupportedError, isRegexpValid)) return new UpdateDynamicRulesError({netRequestBlock: this, reason: "Nested api call failed"}, isRegexpValid);
		if(isError(RegexpIsNotSupported, isRegexpValid)) return isRegexpValid;
		
		const uniqueId = await this.getRuleUniqueId();
		if(isError(GetRuleIniqueIdError, uniqueId)) return new UpdateDynamicRulesError({netRequestBlock: this, reason: "Nested api call failed"}, uniqueId);

		// TODO check if limit of rules are exceeded.
		
		// build netRequestRule:
		const regexFilter = rule.regexp;
		const extensionPath = this.redirect;
		const netRequestRuleBase = {id: uniqueId, priority: 1 };
		const netRequestRuleCondition : NetRequestRuleCondition = { regexFilter , isUrlFilterCaseSensitive: false };
		const netRequestRuleAction : NetRequestRuleAction = { type: "redirect", redirect: { extensionPath } };
		const netRequestRule : NetRequestRule = { ...netRequestRuleBase, action: netRequestRuleAction, condition: netRequestRuleCondition };
		
		const packet : NetRequestUpdatePacket = { addRules: [netRequestRule] }
		const returnError = (reason: string) => new UpdateDynamicRulesError({netRequestBlock: this, reason});
		const result = await browser.declarativeNetRequest.updateDynamicRules(packet).catch(returnError);
		if(isError(UpdateDynamicRulesError, result)) return result;
		return netRequestRule;
	}
	
	public async updateRule(): ApiReturn<void>
	{
		
	}
	
	public async deleteRule(): ApiReturn<void>
	{
		
	}
	
	private async isRegexpSupported(regexp: string) : ApiReturn<boolean | IsRegexSupportedError | RegexpIsNotSupported>
	{
		const regexpOptions : RegexOptions = { regex: regexp, isCaseSensitive: false, requireCapturing: true };
		const returnError = (reason: string) => new IsRegexSupportedError({netRequestBlock: this, reason});
		const isRegexpSupportedResult = await browser.declarativeNetRequest.isRegexSupported(regexpOptions).catch(returnError);
		if(isError(IsRegexSupportedError, isRegexpSupportedResult)) return isRegexpSupportedResult;
		
		const regexpIsNotSupported = (result: IsRegexSupportedResult) : result is Required<IsRegexSupportedResult> => result.isSupported === false;
		if(regexpIsNotSupported(isRegexpSupportedResult)) return new RegexpIsNotSupported({netRequestBlock: this, reason: isRegexpSupportedResult.reason});
		return isRegexpSupportedResult.isSupported;
	}
	
	private async getRuleUniqueId() : ApiReturn<number, GetRuleIniqueIdError>
	{
		const rules = await this.getRules();
		if(isError(GetDynamicRulesError, rules)) return new GetRuleIniqueIdError({netRequestBlock: this}, rules);
		
		const rulesIds = ArrayEx.SortAscending(rules.map(r => r.id)); // array must be sorted for further code working correctly!
		for(let i = 0; i < rules.length; i++)
		{
			if(rulesIds[i] !== i + 1) return i + 1;
		}
		return rulesIds.length + 1;
	}
}