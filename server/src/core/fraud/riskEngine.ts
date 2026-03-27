import type { FraudContext, FraudDecision, FraudRule, FraudRuleset } from "./fraudTypes.js";

function normUpper(value?: string) {
  return value ? String(value).trim().toUpperCase() : undefined;
}

function asBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return undefined;
}

function matchesRule(rule: FraudRule, ctx: FraudContext) {
  if (rule.enabled === false) return false;
  const c = rule.criteria ?? {};

  if (c.paymentMethodIn && c.paymentMethodIn.length > 0) {
    const method = String(ctx.paymentMethod || "").toLowerCase().trim();
    if (!c.paymentMethodIn.map((m) => String(m).toLowerCase().trim()).includes(method)) return false;
  }

  if (c.currencyIn && c.currencyIn.length > 0) {
    const currency = normUpper(ctx.currencyIsoCode) ?? "";
    if (!c.currencyIn.map(normUpper).filter(Boolean).includes(currency)) return false;
  }

  if (typeof c.amountGte === "number") {
    if (typeof ctx.amount !== "number" || ctx.amount < c.amountGte) return false;
  }
  if (typeof c.amountLte === "number") {
    if (typeof ctx.amount !== "number" || ctx.amount > c.amountLte) return false;
  }

  if (c.billingCountryIn && c.billingCountryIn.length > 0) {
    const country = normUpper(ctx.billingCountry) ?? "";
    if (!c.billingCountryIn.map(normUpper).filter(Boolean).includes(country)) return false;
  }

  if (c.cardCountryOfIssuanceIn && c.cardCountryOfIssuanceIn.length > 0) {
    const coo = normUpper(ctx.cardCountryOfIssuance) ?? "";
    if (!c.cardCountryOfIssuanceIn.map(normUpper).filter(Boolean).includes(coo)) return false;
  }

  const prepaid = asBool(ctx.cardPrepaid);
  const debit = asBool(ctx.cardDebit);
  const commercial = asBool(ctx.cardCommercial);

  if (typeof c.cardPrepaid === "boolean" && prepaid !== c.cardPrepaid) return false;
  if (typeof c.cardDebit === "boolean" && debit !== c.cardDebit) return false;
  if (typeof c.cardCommercial === "boolean" && commercial !== c.cardCommercial) return false;

  return true;
}

export function decideFraud(ruleset: FraudRuleset, ctx: FraudContext): FraudDecision {
  const profileId = (ctx.profileId || "default").trim() || "default";
  const profile = ruleset.profiles?.[profileId] ?? ruleset.profiles?.default;
  const rules = profile?.rules ?? [];

  for (const rule of rules) {
    if (!matchesRule(rule, ctx)) continue;
    return {
      action: rule.action,
      ruleId: rule.id,
      reason: rule.reason,
      matchedCriteria: rule.criteria,
    };
  }

  return { action: "allow" };
}

