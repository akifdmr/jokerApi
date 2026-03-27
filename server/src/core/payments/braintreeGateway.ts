import { createRequire } from "node:module";

type BraintreeEnvironment = "Sandbox" | "Production";

export type BraintreeConfig = {
  environment: BraintreeEnvironment;
  merchantId: string;
  publicKey: string;
  privateKey: string;
  merchantAccountIdUsd?: string;
  merchantAccountIdEur?: string;
};

let cachedGateway: any | null = null;
let cachedConfigKey: string | null = null;

function readConfig(): BraintreeConfig | null {
  const environmentRaw = (process.env.BRAINTREE_ENVIRONMENT ?? "").trim();
  const environment: BraintreeEnvironment =
    environmentRaw.toLowerCase() === "production" ? "Production" : "Sandbox";

  const merchantId = (process.env.BRAINTREE_MERCHANT_ID ?? "").trim();
  const publicKey = (process.env.BRAINTREE_PUBLIC_KEY ?? "").trim();
  const privateKey = (process.env.BRAINTREE_PRIVATE_KEY ?? "").trim();
  if (!merchantId || !publicKey || !privateKey) return null;

  const merchantAccountIdUsd = (process.env.BRAINTREE_MERCHANT_ACCOUNT_ID_USD ?? "").trim() || undefined;
  const merchantAccountIdEur = (process.env.BRAINTREE_MERCHANT_ACCOUNT_ID_EUR ?? "").trim() || undefined;

  return {
    environment,
    merchantId,
    publicKey,
    privateKey,
    merchantAccountIdUsd,
    merchantAccountIdEur,
  };
}

export function braintreeEnabled() {
  if (!readConfig()) return false;
  const require = createRequire(import.meta.url);
  try {
    require.resolve("braintree");
    return true;
  } catch {
    return false;
  }
}

export function getBraintreeMerchantAccountId(currencyIsoCode: string) {
  const cfg = readConfig();
  if (!cfg) return undefined;
  const currency = String(currencyIsoCode || "").toUpperCase();
  if (currency === "USD") return cfg.merchantAccountIdUsd;
  if (currency === "EUR") return cfg.merchantAccountIdEur;
  return undefined;
}

export async function getBraintreeGateway(): Promise<any | null> {
  const cfg = readConfig();
  if (!cfg) return null;

  const configKey = JSON.stringify(cfg);
  if (cachedGateway && cachedConfigKey === configKey) return cachedGateway;

  let braintree: any;
  try {
    braintree = await import("braintree");
  } catch {
    return null;
  }

  const env =
    cfg.environment === "Production"
      ? braintree.Environment.Production
      : braintree.Environment.Sandbox;

  cachedGateway = new braintree.BraintreeGateway({
    environment: env,
    merchantId: cfg.merchantId,
    publicKey: cfg.publicKey,
    privateKey: cfg.privateKey,
  });
  cachedConfigKey = configKey;
  return cachedGateway;
}
