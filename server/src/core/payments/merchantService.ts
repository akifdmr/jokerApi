import { braintreeEnabled } from "./braintreeGateway.js";
import { generateClientToken, sale, vaultPaymentMethod } from "./braintreeService.js";
import {
  balanceCheck,
  binCheck,
  cancelProvision,
  provision,
  provisionCompletion,
  transactionList,
} from "../paymentProcessors/nmi/nmiService.js";
import { VakifbankVposClient } from "../Pos/VakifbankVposClient.js";
import { globalPaymentsEnabled } from "./globalPaymentsConfig.js";

type MerchantResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; details?: unknown };

function ok(data: unknown): MerchantResult {
  return { ok: true, data };
}

function err(error: string, details?: unknown): MerchantResult {
  return { ok: false, error, details };
}

function vposConfigured() {
  return Boolean(process.env.VPOS_ENDPOINT && process.env.VPOS_MERCHANT_ID && process.env.VPOS_TERMINAL_ID && process.env.VPOS_STORE_KEY);
}

let cachedVposClient: VakifbankVposClient | null = null;
function getVposClient() {
  if (!vposConfigured()) return null;
  if (cachedVposClient) return cachedVposClient;
  cachedVposClient = new VakifbankVposClient({
    endpoint: process.env.VPOS_ENDPOINT!,
    merchantId: process.env.VPOS_MERCHANT_ID!,
    terminalId: process.env.VPOS_TERMINAL_ID!,
    storeKey: process.env.VPOS_STORE_KEY!,
    currencyCode: "949",
  });
  return cachedVposClient;
}

// -------------------- Braintree --------------------
export async function braintreeStatus(): Promise<MerchantResult> {
  return ok({ enabled: braintreeEnabled() });
}

export async function braintreeClientToken(input: { customerId?: string }): Promise<MerchantResult> {
  const token = await generateClientToken({ customerId: input.customerId });
  if (!token.ok) return err(token.error);
  return ok({ clientToken: token.clientToken });
}

export async function braintreeVault(input: {
  paymentMethodNonce: string;
  customerId?: string;
  customer?: { email?: string; firstName?: string; lastName?: string; phone?: string };
}): Promise<MerchantResult> {
  const result = await vaultPaymentMethod({
    paymentMethodNonce: input.paymentMethodNonce,
    customerId: input.customerId,
    customer: input.customer,
  });
  if (!result.ok) return err(result.error, (result as any).details);
  return ok({ customerId: result.customerId, result: result.result });
}

export async function braintreeCheckout(input: {
  amount: string;
  currencyIsoCode?: string;
  paymentMethodNonce?: string;
  paymentMethodToken?: string;
  deviceData?: string;
  orderId?: string;
  customer?: unknown;
  billing?: unknown;
  options?: unknown;
}): Promise<MerchantResult> {
  const result = await sale({
    amount: input.amount,
    currencyIsoCode: input.currencyIsoCode,
    paymentMethodNonce: input.paymentMethodNonce,
    paymentMethodToken: input.paymentMethodToken,
    deviceData: input.deviceData,
    orderId: input.orderId,
    customer: input.customer,
    billing: input.billing,
    options: input.options,
  });
  if (!result.ok) return err(result.error);
  return ok({ braintree: result.result });
}

// -------------------- NMI --------------------
export async function nmiBinCheck(input: { pan: string; processor?: string }): Promise<MerchantResult> {
  return ok(await binCheck(input.pan, input.processor));
}

export async function nmiBalanceCheck(input: {
  pan: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  processor?: string;
}): Promise<MerchantResult> {
  return ok(
    await balanceCheck({
      pan: input.pan,
      expMonth: input.expMonth,
      expYear: input.expYear,
      cvv: input.cvv,
      processor: input.processor,
    })
  );
}

export async function nmiProvision(input: {
  pan: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  amount: number;
  currency?: string;
  orderId?: string;
  processor?: string;
}): Promise<MerchantResult> {
  return ok(
    await provision({
      pan: input.pan,
      expMonth: input.expMonth,
      expYear: input.expYear,
      cvv: input.cvv,
      amount: input.amount,
      currency: input.currency,
      orderId: input.orderId,
      processor: input.processor,
    })
  );
}

export async function nmiProvisionCompletion(input: {
  transactionId: string;
  amount?: number;
  processor?: string;
}): Promise<MerchantResult> {
  return ok(
    await provisionCompletion({
      transactionId: input.transactionId,
      amount: input.amount,
      processor: input.processor,
    })
  );
}

export async function nmiCancel(input: { transactionId: string; processor?: string }): Promise<MerchantResult> {
  return ok(
    await cancelProvision({
      transactionId: input.transactionId,
      processor: input.processor,
    })
  );
}

export async function nmiTransactions(): Promise<MerchantResult> {
  return ok(await transactionList());
}

// -------------------- VPOS --------------------
export async function vposPreauth(input: { orderId: string; amount: number; card: unknown }): Promise<MerchantResult> {
  const client = getVposClient();
  if (!client) return err("vpos_not_configured");
  return ok(await client.preAuth(input.orderId, input.amount, input.card as any));
}

export async function vposSale(input: { orderId: string; amount: number; card: unknown }): Promise<MerchantResult> {
  const client = getVposClient();
  if (!client) return err("vpos_not_configured");
  return ok(await client.sale(input.orderId, input.amount, input.card as any));
}

export async function vposVoid(input: { orderId: string; amount: number }): Promise<MerchantResult> {
  const client = getVposClient();
  if (!client) return err("vpos_not_configured");
  return ok(await client.void(input.orderId, input.amount));
}

export async function vposTransactions(input: { startDate: string; endDate: string }): Promise<MerchantResult> {
  const client = getVposClient();
  if (!client) return err("vpos_not_configured");
  return ok(await client.transactionList(input.startDate, input.endDate));
}

// -------------------- Global Payments --------------------
export async function globalPaymentsStatus(): Promise<MerchantResult> {
  return ok({ enabled: globalPaymentsEnabled() });
}

function globalPaymentsGuard(): MerchantResult | null {
  if (!globalPaymentsEnabled()) return err("globalpayments_not_configured");
  return null;
}

export async function globalPaymentsAuth(_input: unknown): Promise<MerchantResult> {
  const blocked = globalPaymentsGuard();
  if (blocked) return blocked;
  return err("globalpayments_not_implemented");
}

export async function globalPaymentsCapture(_input: unknown): Promise<MerchantResult> {
  const blocked = globalPaymentsGuard();
  if (blocked) return blocked;
  return err("globalpayments_not_implemented");
}

export async function globalPaymentsSale(_input: unknown): Promise<MerchantResult> {
  const blocked = globalPaymentsGuard();
  if (blocked) return blocked;
  return err("globalpayments_not_implemented");
}

export async function globalPaymentsVoid(_input: unknown): Promise<MerchantResult> {
  const blocked = globalPaymentsGuard();
  if (blocked) return blocked;
  return err("globalpayments_not_implemented");
}

export async function globalPaymentsRefund(_input: unknown): Promise<MerchantResult> {
  const blocked = globalPaymentsGuard();
  if (blocked) return blocked;
  return err("globalpayments_not_implemented");
}

export async function globalPaymentsTokenize(_input: unknown): Promise<MerchantResult> {
  const blocked = globalPaymentsGuard();
  if (blocked) return blocked;
  return err("globalpayments_not_implemented");
}

export async function globalPaymentsWebhook(_input: unknown): Promise<MerchantResult> {
  const blocked = globalPaymentsGuard();
  if (blocked) return blocked;
  return err("globalpayments_not_implemented");
}
