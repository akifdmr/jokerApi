import type { PaymentProcessor } from "../paymentProcessors/nmi/nmiTypes.js";

export interface BalanceCheckerProviderOption {
  value: PaymentProcessor;
  label: string;
}

export const BALANCE_CHECKER_PROVIDERS: BalanceCheckerProviderOption[] = [
  { value: "us-bank", label: "US Bank" },
  { value: "vakifbank", label: "Vakifbank VPOS" },
  { value: "nmi", label: "NMI Payment" },
];

export function normalizeBalanceCheckerProvider(input?: string): PaymentProcessor {
  const value = String(input ?? "")
    .trim()
    .toLowerCase() as PaymentProcessor;

  if (BALANCE_CHECKER_PROVIDERS.some((item) => item.value === value)) {
    return value;
  }

  return "us-bank";
}

export function getBalanceCheckerProviderLabel(input?: string) {
  const provider = normalizeBalanceCheckerProvider(input);
  return BALANCE_CHECKER_PROVIDERS.find((item) => item.value === provider)?.label ?? provider;
}
