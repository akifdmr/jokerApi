import { Router } from "express";
import {
  ONRAMP_ASSETS,
  ONRAMP_PAYMENT_METHODS,
  createOnrampOrder,
  getOnrampSources,
  listOnrampOrders,
  quoteOnramp,
} from "../core/db/local/onrampStore.js";
import { onramperStatus } from "../core/config/onramper.config.js";
import { braintreeEnabled } from "../core/payments/braintreeGateway.js";
import { sale } from "../core/payments/braintreeService.js";
import { getFraudRuleset } from "../core/fraud/fraudRulesStore.js";
import { decideFraud } from "../core/fraud/riskEngine.js";
import { appendFraudEvent } from "../core/fraud/fraudEventStore.js";

export const onrampRouter = Router();

/**
 * @openapi
 * /api/onramp/constants:
 *   get:
 *     summary: Onramp constants (methods/assets/currencies) + sources
 *     tags: [Onramp]
 *     responses:
 *       200:
 *         description: Constants
 * /api/onramp/quote:
 *   post:
 *     summary: Quote onramp fee + estimated asset amount
 *     tags: [Onramp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod, asset, fiatAmount]
 *             properties:
 *               paymentMethod: { type: string, enum: [card, ach, sepa] }
 *               asset: { type: string }
 *               fiatAmount: { type: number }
 *     responses:
 *       200:
 *         description: Quote
 * /api/onramp/orders:
 *   post:
 *     summary: Create onramp order (optional Braintree payment)
 *     tags: [Onramp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod, asset, fiatCurrency, fiatAmount, walletAddress]
 *             properties:
 *               paymentMethod: { type: string, enum: [card, ach, sepa] }
 *               asset: { type: string }
 *               fiatCurrency: { type: string, example: "USD" }
 *               fiatAmount: { type: number, example: 49.9 }
 *               walletAddress: { type: string }
 *               fraudProfileId: { type: string, example: "default" }
 *               billingCountry: { type: string, example: "US" }
 *               paymentMethodNonce: { type: string, description: "Required when Braintree is enabled" }
 *               deviceData: { type: string }
 *               threeDSVerified: { type: boolean }
 *     responses:
 *       200:
 *         description: Order created
 *       409:
 *         description: 3DS required
 *   get:
 *     summary: List onramp orders
 *     tags: [Onramp]
 *     responses:
 *       200:
 *         description: Orders
 */
onrampRouter.get("/onramp/constants", async (_req, res) => {
  const sources = await getOnrampSources();
  res.json({
    ok: true,
    paymentMethods: ONRAMP_PAYMENT_METHODS,
    assets: ONRAMP_ASSETS,
    fiatCurrencies: ["USD", "EUR"],
    onramper: onramperStatus(),
    braintree: { enabled: braintreeEnabled() },
    ...sources,
  });
});

onrampRouter.post("/onramp/quote", (req, res) => {
  const { paymentMethod, asset, fiatAmount } = req.body;
  if (!paymentMethod || !asset || fiatAmount === undefined) {
    return res.status(400).json({ ok: false, error: "paymentMethod, asset, fiatAmount are required" });
  }

  if (!ONRAMP_PAYMENT_METHODS.includes(String(paymentMethod) as (typeof ONRAMP_PAYMENT_METHODS)[number])) {
    return res.status(400).json({ ok: false, error: "invalid paymentMethod" });
  }

  if (!ONRAMP_ASSETS.includes(String(asset) as (typeof ONRAMP_ASSETS)[number])) {
    return res.status(400).json({ ok: false, error: "invalid asset" });
  }

  const quote = quoteOnramp({
    paymentMethod: String(paymentMethod) as (typeof ONRAMP_PAYMENT_METHODS)[number],
    asset: String(asset) as (typeof ONRAMP_ASSETS)[number],
    fiatAmount: Number(fiatAmount),
  });

  return res.json({ ok: true, quote });
});

onrampRouter.post("/onramp/orders", async (req, res) => {
  const {
    paymentMethod,
    asset,
    fiatCurrency,
    fiatAmount,
    walletAddress,
    sourceCardId,
    paymentDetails,
    paymentMethodNonce,
    deviceData,
    fraudProfileId,
    billingCountry,
    threeDSVerified,
  } = req.body;
  if (!paymentMethod || !asset || !fiatCurrency || fiatAmount === undefined || !walletAddress) {
    return res.status(400).json({ ok: false, error: "paymentMethod, asset, fiatCurrency, fiatAmount, walletAddress are required" });
  }

  if (!ONRAMP_PAYMENT_METHODS.includes(String(paymentMethod) as (typeof ONRAMP_PAYMENT_METHODS)[number])) {
    return res.status(400).json({ ok: false, error: "invalid paymentMethod" });
  }

  if (!ONRAMP_ASSETS.includes(String(asset) as (typeof ONRAMP_ASSETS)[number])) {
    return res.status(400).json({ ok: false, error: "invalid asset" });
  }

  const method = String(paymentMethod) as (typeof ONRAMP_PAYMENT_METHODS)[number];
  const details = (paymentDetails ?? {}) as Record<string, string>;

  const useBraintree = braintreeEnabled();
  if (useBraintree && !paymentMethodNonce) {
    return res.status(400).json({ ok: false, error: "paymentMethodNonce is required when braintree is enabled" });
  }

  const amount = Number(fiatAmount);
  const currencyIsoCode = String(fiatCurrency).toUpperCase();

  const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "");
  const userAgent = String(req.headers["user-agent"] ?? "");

  if (useBraintree) {
    const ruleset = await getFraudRuleset();
    const preDecision = decideFraud(ruleset, {
      profileId: fraudProfileId ? String(fraudProfileId) : undefined,
      paymentMethod: method,
      amount,
      currencyIsoCode,
      billingCountry: billingCountry ? String(billingCountry) : undefined,
      ip,
      userAgent,
    });

    await appendFraudEvent({
      stage: "pre",
      context: {
        profileId: fraudProfileId ? String(fraudProfileId) : undefined,
        paymentMethod: method,
        amount,
        currencyIsoCode,
        billingCountry: billingCountry ? String(billingCountry) : undefined,
        ip,
        userAgent,
      },
      decision: preDecision,
      paymentProvider: "braintree",
    });

    if (preDecision.action === "reject") {
      return res.status(402).json({ ok: false, error: "blocked_by_fraud_rules", decision: preDecision });
    }
    const require3ds = preDecision.action === "require_3ds" && method === "card";
    if (require3ds && !Boolean(threeDSVerified)) {
      return res.status(409).json({ ok: false, error: "require_3ds", decision: preDecision });
    }

    const submitForSettlement = preDecision.action === "allow" || require3ds;

    const bt = await sale({
      amount: amount.toFixed(2),
      currencyIsoCode,
      paymentMethodNonce: String(paymentMethodNonce),
      deviceData: deviceData ? String(deviceData) : undefined,
      orderId: `onramp-${Date.now()}`,
      options: {
        submitForSettlement,
        storeInVaultOnSuccess: false,
        threeDSecureRequired: require3ds,
      },
    });

    if (!bt.ok) {
      return res.status(503).json({ ok: false, error: bt.error });
    }

    const result = bt.result as any;
    const tx = result?.transaction ?? null;

    const paymentProvider = "braintree";
    const paymentReference = tx?.id ? String(tx.id) : undefined;

    const card = tx?.creditCardDetails;
    const usBank = tx?.usBankAccountDetails;
    const sepa = tx?.sepaDirectDebitAccountDetails;

    const postCtx = {
      profileId: fraudProfileId ? String(fraudProfileId) : undefined,
      paymentMethod: method,
      amount,
      currencyIsoCode,
      billingCountry: billingCountry ? String(billingCountry) : undefined,
      cardCountryOfIssuance: card?.countryOfIssuance ? String(card.countryOfIssuance) : undefined,
      cardPrepaid: card?.prepaid ? String(card.prepaid).toLowerCase() === "yes" : undefined,
      cardDebit: card?.debit ? String(card.debit).toLowerCase() === "yes" : undefined,
      cardCommercial: card?.commercial ? String(card.commercial).toLowerCase() === "yes" : undefined,
      ip,
      userAgent,
    };
    const postDecision = decideFraud(ruleset, postCtx);
    await appendFraudEvent({
      stage: "post",
      context: postCtx,
      decision: postDecision,
      paymentProvider: "braintree",
      paymentReference,
    });

    const safePaymentDetails: Record<string, string> = {
      provider: "braintree",
      transactionId: paymentReference ?? "",
      status: String(tx?.status ?? (result?.success ? "success" : "failed")),
    };
    if (card) {
      safePaymentDetails.instrument = "card";
      if (card.cardType) safePaymentDetails.cardType = String(card.cardType);
      if (card.last4) safePaymentDetails.last4 = String(card.last4);
      if (card.prepaid) safePaymentDetails.prepaid = String(card.prepaid);
      if (card.debit) safePaymentDetails.debit = String(card.debit);
      if (card.commercial) safePaymentDetails.commercial = String(card.commercial);
      if (card.countryOfIssuance) safePaymentDetails.countryOfIssuance = String(card.countryOfIssuance);
    } else if (usBank) {
      safePaymentDetails.instrument = "ach";
      if (usBank.last4) safePaymentDetails.last4 = String(usBank.last4);
      if (usBank.routingNumber) safePaymentDetails.routingNumber = String(usBank.routingNumber);
      if (usBank.accountType) safePaymentDetails.accountType = String(usBank.accountType);
    } else if (sepa) {
      safePaymentDetails.instrument = "sepa";
      if (sepa.last4) safePaymentDetails.last4 = String(sepa.last4);
      if (sepa.mandateReferenceNumber) safePaymentDetails.mandateRef = String(sepa.mandateReferenceNumber);
    }

    const order = await createOnrampOrder({
      paymentMethod: method,
      asset: String(asset) as (typeof ONRAMP_ASSETS)[number],
      fiatCurrency: String(fiatCurrency),
      fiatAmount: amount,
      walletAddress: String(walletAddress),
      sourceCardId: sourceCardId ? String(sourceCardId) : undefined,
      paymentDetails: safePaymentDetails,
      paymentProvider,
      paymentReference,
      status: result?.success ? (submitForSettlement ? "completed" : "processing") : "failed",
    });

    return res.json({
      ok: true,
      item: order,
      payment: {
        provider: "braintree",
        transactionId: paymentReference,
        success: Boolean(result?.success),
        status: tx?.status,
        fraudDecision: postDecision,
      },
    });
  }

  const order = await createOnrampOrder({
    paymentMethod: method,
    asset: String(asset) as (typeof ONRAMP_ASSETS)[number],
    fiatCurrency: String(fiatCurrency),
    fiatAmount: amount,
    walletAddress: String(walletAddress),
    sourceCardId: sourceCardId ? String(sourceCardId) : undefined,
    paymentDetails: details,
  });

  return res.json({ ok: true, item: order });
});

onrampRouter.get("/onramp/orders", async (_req, res) => {
  const items = await listOnrampOrders();
  res.json({ ok: true, items });
});
