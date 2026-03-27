export type FraudAction = "allow" | "review" | "reject" | "require_3ds";

export type FraudRuleCriteria = {
  paymentMethodIn?: string[];
  currencyIn?: string[];
  amountGte?: number;
  amountLte?: number;
  billingCountryIn?: string[];
  cardCountryOfIssuanceIn?: string[];
  cardPrepaid?: boolean;
  cardDebit?: boolean;
  cardCommercial?: boolean;
};

export type FraudRule = {
  id: string;
  enabled?: boolean;
  action: FraudAction;
  criteria: FraudRuleCriteria;
  reason?: string;
};

export type FraudProfile = {
  id: string;
  rules: FraudRule[];
};

export type FraudRuleset = {
  version: number;
  profiles: Record<string, FraudProfile>;
  updatedAt: string;
};

export type FraudContext = {
  profileId?: string;
  paymentMethod?: string;
  amount?: number;
  currencyIsoCode?: string;
  billingCountry?: string;
  cardCountryOfIssuance?: string;
  cardPrepaid?: boolean;
  cardDebit?: boolean;
  cardCommercial?: boolean;
  ip?: string;
  userAgent?: string;
};

export type FraudDecision = {
  action: FraudAction;
  ruleId?: string;
  reason?: string;
  matchedCriteria?: FraudRuleCriteria;
};

