import { Router } from "express";
import {
  braintreeCheckout,
  braintreeClientToken,
  braintreeStatus,
  braintreeVault,
  globalPaymentsAuth,
  globalPaymentsCapture,
  globalPaymentsRefund,
  globalPaymentsSale,
  globalPaymentsStatus,
  globalPaymentsTokenize,
  globalPaymentsVoid,
  globalPaymentsWebhook,
  nmiBalanceCheck,
  nmiBinCheck,
  nmiCancel,
  nmiProvision,
  nmiProvisionCompletion,
  nmiTransactions,
  vposPreauth,
  vposSale,
  vposTransactions,
  vposVoid,
} from "../core/payments/merchantService.js";

export const merchantRouter = Router();

function sendResult(res: any, result: { ok: boolean; error?: string; data?: unknown; details?: unknown }) {
  if (result.ok) return res.json({ ok: true, data: result.data });
  const code =
    result.error === "braintree_not_configured" ||
    result.error === "vpos_not_configured" ||
    result.error === "globalpayments_not_configured"
      ? 503
      : result.error === "globalpayments_not_implemented"
        ? 501
        : 400;
  return res.status(code).json({ ok: false, error: result.error, details: result.details });
}

/**
 * @openapi
 * tags:
 *   name: Merchants
 *   description: Unified merchant payment endpoints
 */

/**
 * @openapi
 * /api/merchants/braintree/status:
 *   get:
 *     summary: Braintree config availability
 *     tags: [Merchants]
 *     responses:
 *       200:
 *         description: Status
 */
merchantRouter.get("/merchants/braintree/status", async (_req, res) => {
  return sendResult(res, await braintreeStatus());
});

/**
 * @openapi
 * /api/merchants/braintree/client-token:
 *   post:
 *     summary: Generate Braintree client token
 *     tags: [Merchants]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId: { type: string }
 *     responses:
 *       200:
 *         description: Client token
 */
merchantRouter.post("/merchants/braintree/client-token", async (req, res) => {
  const customerId = req.body?.customerId ? String(req.body.customerId) : undefined;
  return sendResult(res, await braintreeClientToken({ customerId }));
});

/**
 * @openapi
 * /api/merchants/braintree/vault:
 *   post:
 *     summary: Vault a payment method nonce
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethodNonce]
 *             properties:
 *               paymentMethodNonce: { type: string }
 *               customerId: { type: string }
 *               customer:
 *                 type: object
 *                 properties:
 *                   email: { type: string }
 *                   firstName: { type: string }
 *                   lastName: { type: string }
 *                   phone: { type: string }
 *     responses:
 *       200:
 *         description: Vault result
 */
merchantRouter.post("/merchants/braintree/vault", async (req, res) => {
  const { paymentMethodNonce, customerId, customer } = req.body ?? {};
  if (!paymentMethodNonce) return res.status(400).json({ ok: false, error: "paymentMethodNonce is required" });
  return sendResult(
    res,
    await braintreeVault({
      paymentMethodNonce: String(paymentMethodNonce),
      customerId: customerId ? String(customerId) : undefined,
      customer: customer ? customer : undefined,
    })
  );
});

/**
 * @openapi
 * /api/merchants/braintree/checkout:
 *   post:
 *     summary: Create a Braintree sale transaction
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: string, example: "49.90" }
 *               currencyIsoCode: { type: string, example: "USD" }
 *               paymentMethodNonce: { type: string }
 *               paymentMethodToken: { type: string }
 *               deviceData: { type: string }
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Transaction result
 */
merchantRouter.post("/merchants/braintree/checkout", async (req, res) => {
  const {
    amount,
    currencyIsoCode,
    paymentMethodNonce,
    paymentMethodToken,
    deviceData,
    orderId,
    customer,
    billing,
    options,
  } = req.body ?? {};
  if (!amount) return res.status(400).json({ ok: false, error: "amount is required" });
  if (!paymentMethodNonce && !paymentMethodToken) {
    return res.status(400).json({ ok: false, error: "paymentMethodNonce or paymentMethodToken is required" });
  }
  return sendResult(
    res,
    await braintreeCheckout({
      amount: String(amount),
      currencyIsoCode: currencyIsoCode ? String(currencyIsoCode) : undefined,
      paymentMethodNonce: paymentMethodNonce ? String(paymentMethodNonce) : undefined,
      paymentMethodToken: paymentMethodToken ? String(paymentMethodToken) : undefined,
      deviceData: deviceData ? String(deviceData) : undefined,
      orderId: orderId ? String(orderId) : undefined,
      customer: customer ? customer : undefined,
      billing: billing ? billing : undefined,
      options: options ? options : undefined,
    })
  );
});

/**
 * @openapi
 * /api/merchants/nmi/bin-check:
 *   post:
 *     summary: BIN lookup (scheme/type/bank/country)
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pan]
 *             properties:
 *               pan: { type: string, example: "4111111111111111" }
 *               processor: { type: string, enum: [us-bank, vakifbank, nmi] }
 */
merchantRouter.post("/merchants/nmi/bin-check", async (req, res) => {
  const { pan, processor } = req.body ?? {};
  if (!pan) return res.status(400).json({ ok: false, error: "pan is required" });
  return sendResult(res, await nmiBinCheck({ pan: String(pan), processor: processor ? String(processor) : undefined }));
});

/**
 * @openapi
 * /api/merchants/nmi/balance-check:
 *   post:
 *     summary: Balance check
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pan, expMonth, expYear, cvv]
 *             properties:
 *               pan: { type: string }
 *               expMonth: { type: string }
 *               expYear: { type: string }
 *               cvv: { type: string }
 *               processor: { type: string, enum: [us-bank, vakifbank, nmi] }
 */
merchantRouter.post("/merchants/nmi/balance-check", async (req, res) => {
  const { pan, expMonth, expYear, cvv, processor } = req.body ?? {};
  if (!pan || !expMonth || !expYear || !cvv) {
    return res.status(400).json({ ok: false, error: "pan, expMonth, expYear, cvv are required" });
  }
  return sendResult(
    res,
    await nmiBalanceCheck({
      pan: String(pan),
      expMonth: String(expMonth),
      expYear: String(expYear),
      cvv: String(cvv),
      processor: processor ? String(processor) : undefined,
    })
  );
});

/**
 * @openapi
 * /api/merchants/nmi/provision:
 *   post:
 *     summary: Provision (Auth)
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pan, expMonth, expYear, cvv, amount]
 *             properties:
 *               pan: { type: string }
 *               expMonth: { type: string }
 *               expYear: { type: string }
 *               cvv: { type: string }
 *               amount: { type: number }
 *               currency: { type: string }
 *               orderId: { type: string }
 *               processor: { type: string, enum: [us-bank, vakifbank, nmi] }
 */
merchantRouter.post("/merchants/nmi/provision", async (req, res) => {
  const { pan, expMonth, expYear, cvv, amount, currency, orderId, processor } = req.body ?? {};
  if (!pan || !expMonth || !expYear || !cvv || amount === undefined) {
    return res.status(400).json({ ok: false, error: "pan, expMonth, expYear, cvv, amount are required" });
  }
  return sendResult(
    res,
    await nmiProvision({
      pan: String(pan),
      expMonth: String(expMonth),
      expYear: String(expYear),
      cvv: String(cvv),
      amount: Number(amount),
      currency: currency ? String(currency) : undefined,
      orderId: orderId ? String(orderId) : undefined,
      processor: processor ? String(processor) : undefined,
    })
  );
});

/**
 * @openapi
 * /api/merchants/nmi/provision-completion:
 *   post:
 *     summary: Provision completion (Capture)
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId]
 *             properties:
 *               transactionId: { type: string }
 *               amount: { type: number }
 *               processor: { type: string, enum: [us-bank, vakifbank, nmi] }
 */
merchantRouter.post("/merchants/nmi/provision-completion", async (req, res) => {
  const { transactionId, amount, processor } = req.body ?? {};
  if (!transactionId) {
    return res.status(400).json({ ok: false, error: "transactionId is required" });
  }
  return sendResult(
    res,
    await nmiProvisionCompletion({
      transactionId: String(transactionId),
      amount: amount ? Number(amount) : undefined,
      processor: processor ? String(processor) : undefined,
    })
  );
});

/**
 * @openapi
 * /api/merchants/nmi/cancel:
 *   post:
 *     summary: Cancel provision (Void)
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId]
 *             properties:
 *               transactionId: { type: string }
 *               processor: { type: string, enum: [us-bank, vakifbank, nmi] }
 */
merchantRouter.post("/merchants/nmi/cancel", async (req, res) => {
  const { transactionId, processor } = req.body ?? {};
  if (!transactionId) {
    return res.status(400).json({ ok: false, error: "transactionId is required" });
  }
  return sendResult(
    res,
    await nmiCancel({
      transactionId: String(transactionId),
      processor: processor ? String(processor) : undefined,
    })
  );
});

/**
 * @openapi
 * /api/merchants/nmi/transactions:
 *   get:
 *     summary: Transaction list
 *     tags: [Merchants]
 */
merchantRouter.get("/merchants/nmi/transactions", async (_req, res) => {
  return sendResult(res, await nmiTransactions());
});

/**
 * @openapi
 * /api/merchants/vpos/preauth:
 *   post:
 *     summary: VPOS preauth
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount, card]
 *             properties:
 *               orderId: { type: string }
 *               amount: { type: number }
 *               card:
 *                 type: object
 *                 required: [pan, expiry, cvv]
 *                 properties:
 *                   pan: { type: string }
 *                   expiry: { type: string }
 *                   cvv: { type: string }
 */
merchantRouter.post("/merchants/vpos/preauth", async (req, res) => {
  const { orderId, amount, card } = req.body ?? {};
  if (!orderId || amount === undefined || !card) {
    return res.status(400).json({ ok: false, error: "orderId, amount, card are required" });
  }
  return sendResult(res, await vposPreauth({ orderId: String(orderId), amount: Number(amount), card }));
});

/**
 * @openapi
 * /api/merchants/vpos/sale:
 *   post:
 *     summary: VPOS sale
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount, card]
 *             properties:
 *               orderId: { type: string }
 *               amount: { type: number }
 *               card:
 *                 type: object
 *                 required: [pan, expiry, cvv]
 *                 properties:
 *                   pan: { type: string }
 *                   expiry: { type: string }
 *                   cvv: { type: string }
 */
merchantRouter.post("/merchants/vpos/sale", async (req, res) => {
  const { orderId, amount, card } = req.body ?? {};
  if (!orderId || amount === undefined || !card) {
    return res.status(400).json({ ok: false, error: "orderId, amount, card are required" });
  }
  return sendResult(res, await vposSale({ orderId: String(orderId), amount: Number(amount), card }));
});

/**
 * @openapi
 * /api/merchants/vpos/void:
 *   post:
 *     summary: VPOS void
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount]
 *             properties:
 *               orderId: { type: string }
 *               amount: { type: number }
 */
merchantRouter.post("/merchants/vpos/void", async (req, res) => {
  const { orderId, amount } = req.body ?? {};
  if (!orderId || amount === undefined) {
    return res.status(400).json({ ok: false, error: "orderId, amount are required" });
  }
  return sendResult(res, await vposVoid({ orderId: String(orderId), amount: Number(amount) }));
});

/**
 * @openapi
 * /api/merchants/vpos/transactions:
 *   get:
 *     summary: VPOS transaction list
 *     tags: [Merchants]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string, example: "20260101" }
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string, example: "20260131" }
 */
merchantRouter.get("/merchants/vpos/transactions", async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  if (!startDate || !endDate) {
    return res.status(400).json({ ok: false, error: "startDate and endDate are required" });
  }
  return sendResult(res, await vposTransactions({ startDate: String(startDate), endDate: String(endDate) }));
});

/**
 * @openapi
 * /api/merchants/globalpayments/status:
 *   get:
 *     summary: Global Payments config availability
 *     tags: [Merchants]
 */
merchantRouter.get("/merchants/globalpayments/status", async (_req, res) => {
  return sendResult(res, await globalPaymentsStatus());
});

/**
 * @openapi
 * /api/merchants/globalpayments/auth:
 *   post:
 *     summary: Global Payments auth
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 */
merchantRouter.post("/merchants/globalpayments/auth", async (req, res) => {
  return sendResult(res, await globalPaymentsAuth(req.body ?? {}));
});

/**
 * @openapi
 * /api/merchants/globalpayments/capture:
 *   post:
 *     summary: Global Payments capture
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 */
merchantRouter.post("/merchants/globalpayments/capture", async (req, res) => {
  return sendResult(res, await globalPaymentsCapture(req.body ?? {}));
});

/**
 * @openapi
 * /api/merchants/globalpayments/sale:
 *   post:
 *     summary: Global Payments sale
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 */
merchantRouter.post("/merchants/globalpayments/sale", async (req, res) => {
  return sendResult(res, await globalPaymentsSale(req.body ?? {}));
});

/**
 * @openapi
 * /api/merchants/globalpayments/void:
 *   post:
 *     summary: Global Payments void
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 */
merchantRouter.post("/merchants/globalpayments/void", async (req, res) => {
  return sendResult(res, await globalPaymentsVoid(req.body ?? {}));
});

/**
 * @openapi
 * /api/merchants/globalpayments/refund:
 *   post:
 *     summary: Global Payments refund
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 */
merchantRouter.post("/merchants/globalpayments/refund", async (req, res) => {
  return sendResult(res, await globalPaymentsRefund(req.body ?? {}));
});

/**
 * @openapi
 * /api/merchants/globalpayments/tokenize:
 *   post:
 *     summary: Global Payments tokenize
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 */
merchantRouter.post("/merchants/globalpayments/tokenize", async (req, res) => {
  return sendResult(res, await globalPaymentsTokenize(req.body ?? {}));
});

/**
 * @openapi
 * /api/merchants/globalpayments/webhook:
 *   post:
 *     summary: Global Payments webhook
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 */
merchantRouter.post("/merchants/globalpayments/webhook", async (req, res) => {
  return sendResult(res, await globalPaymentsWebhook(req.body ?? {}));
});
