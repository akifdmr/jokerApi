import { getBraintreeGateway, getBraintreeMerchantAccountId } from "./braintreeGateway.js";

export type BraintreeSaleInput = {
  amount: string;
  currencyIsoCode?: string;
  paymentMethodNonce?: string;
  paymentMethodToken?: string;
  deviceData?: string;
  orderId?: string;
  customer?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  billing?: {
    firstName?: string;
    lastName?: string;
    streetAddress?: string;
    extendedAddress?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    countryCodeAlpha2?: string;
  };
  options?: {
    submitForSettlement?: boolean;
    storeInVaultOnSuccess?: boolean;
    threeDSecureRequired?: boolean;
  };
};

export async function generateClientToken(input?: { customerId?: string }) {
  const gateway = await getBraintreeGateway();
  if (!gateway) return { ok: false as const, error: "braintree_not_configured" };

  const result = await gateway.clientToken.generate({
    customerId: input?.customerId,
  });
  return { ok: true as const, clientToken: String(result.clientToken) };
}

export async function sale(input: BraintreeSaleInput) {
  const gateway = await getBraintreeGateway();
  if (!gateway) return { ok: false as const, error: "braintree_not_configured" };

  const currencyIsoCode = input.currencyIsoCode ? String(input.currencyIsoCode).toUpperCase() : undefined;
  const merchantAccountId = currencyIsoCode ? getBraintreeMerchantAccountId(currencyIsoCode) : undefined;

  const payload: any = {
    amount: input.amount,
    deviceData: input.deviceData,
    orderId: input.orderId,
    options: {
      submitForSettlement: Boolean(input.options?.submitForSettlement),
      storeInVaultOnSuccess: Boolean(input.options?.storeInVaultOnSuccess),
    },
    customer: input.customer,
    billing: input.billing,
  };

  if (input.options?.threeDSecureRequired) {
    payload.options.threeDSecure = { required: true };
  }

  if (merchantAccountId) payload.merchantAccountId = merchantAccountId;

  if (input.paymentMethodNonce) payload.paymentMethodNonce = input.paymentMethodNonce;
  if (input.paymentMethodToken) payload.paymentMethodToken = input.paymentMethodToken;

  const result = await gateway.transaction.sale(payload);
  return { ok: true as const, result };
}

export async function vaultPaymentMethod(input: {
  paymentMethodNonce: string;
  customerId?: string;
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}) {
  const gateway = await getBraintreeGateway();
  if (!gateway) return { ok: false as const, error: "braintree_not_configured" };

  let customerId = input.customerId;
  if (!customerId) {
    const customerResult = await gateway.customer.create({
      email: input.customer?.email,
      firstName: input.customer?.firstName,
      lastName: input.customer?.lastName,
      phone: input.customer?.phone,
    });
    if (!customerResult?.success) {
      return { ok: false as const, error: "customer_create_failed", details: customerResult };
    }
    customerId = customerResult.customer?.id;
  }

  const pmResult = await gateway.paymentMethod.create({
    customerId,
    paymentMethodNonce: input.paymentMethodNonce,
    options: {
      makeDefault: true,
      verifyCard: false,
    },
  });

  return { ok: true as const, customerId, result: pmResult };
}
