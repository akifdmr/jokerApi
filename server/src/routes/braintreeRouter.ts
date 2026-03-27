import { Router } from "express";
import { braintreeEnabled } from "../core/payments/braintreeGateway.js";
import { generateClientToken, sale, vaultPaymentMethod } from "../core/payments/braintreeService.js";

export const braintreeRouter = Router();

/**
 * @openapi
 * /api/braintree/status:
 *   get:
 *     summary: Braintree config availability
 *     tags: [Braintree]
 *     responses:
 *       200:
 *         description: Status
 * /api/braintree/client-token:
 *   get:
 *     summary: Generate Braintree client token
 *     tags: [Braintree]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client token
 * /api/braintree/vault:
 *   post:
 *     summary: Vault a payment method nonce
 *     tags: [Braintree]
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
 * /api/braintree/checkout:
 *   post:
 *     summary: Create a Braintree sale transaction
 *     tags: [Braintree]
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
 *         description: Transaction result (raw Braintree payload)
 */
braintreeRouter.get("/braintree/status", (_req, res) => {
  res.json({ ok: true, enabled: braintreeEnabled() });
});

braintreeRouter.get("/braintree/client-token", async (req, res) => {
  const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
  const token = await generateClientToken({ customerId });
  if (!token.ok) return res.status(503).json({ ok: false, error: token.error });
  res.json({ ok: true, clientToken: token.clientToken });
});

braintreeRouter.post("/braintree/vault", async (req, res) => {
  const { paymentMethodNonce, customerId, customer } = req.body ?? {};
  if (!paymentMethodNonce) return res.status(400).json({ ok: false, error: "paymentMethodNonce is required" });

  const result = await vaultPaymentMethod({
    paymentMethodNonce: String(paymentMethodNonce),
    customerId: customerId ? String(customerId) : undefined,
    customer: customer ? customer : undefined,
  });
  if (!result.ok) return res.status(400).json({ ok: false, error: result.error, details: (result as any).details });
  res.json({ ok: true, customerId: result.customerId, result: result.result });
});

braintreeRouter.post("/braintree/checkout", async (req, res) => {
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

  const result = await sale({
    amount: String(amount),
    currencyIsoCode: currencyIsoCode ? String(currencyIsoCode) : undefined,
    paymentMethodNonce: paymentMethodNonce ? String(paymentMethodNonce) : undefined,
    paymentMethodToken: paymentMethodToken ? String(paymentMethodToken) : undefined,
    deviceData: deviceData ? String(deviceData) : undefined,
    orderId: orderId ? String(orderId) : undefined,
    customer: customer ? customer : undefined,
    billing: billing ? billing : undefined,
    options: options ? options : undefined,
  });

  if (!result.ok) return res.status(503).json({ ok: false, error: result.error });
  res.json({ ok: true, braintree: result.result });
});
