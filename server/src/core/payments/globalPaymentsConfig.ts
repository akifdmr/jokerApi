export type GlobalPaymentsEnvironment = "Sandbox" | "Production";

export const globalPaymentsConfig = {
  environment: (process.env.GLOBALPAYMENTS_ENVIRONMENT ?? "Sandbox") as GlobalPaymentsEnvironment,
  appId: (process.env.GLOBALPAYMENTS_APP_ID ?? "").trim(),
  appKey: (process.env.GLOBALPAYMENTS_APP_KEY ?? "").trim(),
  merchantId: (process.env.GLOBALPAYMENTS_MERCHANT_ID ?? "").trim(),
  accountId: (process.env.GLOBALPAYMENTS_ACCOUNT_ID ?? "").trim(),
  apiUrl: (process.env.GLOBALPAYMENTS_API_URL ?? "").trim(),
  webhookSecret: (process.env.GLOBALPAYMENTS_WEBHOOK_SECRET ?? "").trim(),
};

export function globalPaymentsEnabled() {
  return Boolean(globalPaymentsConfig.appId && globalPaymentsConfig.appKey && globalPaymentsConfig.merchantId && globalPaymentsConfig.apiUrl);
}
