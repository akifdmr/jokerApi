import { Router } from "express";
import {
  balanceCheck,
  binCheck,
  cancelProvision,
  provision,
  provisionCompletion,
  transactionList,
} from "../core/paymentProcessors/nmi/nmiService.js";

export const nmiRouter = Router();

/**
 * @openapi
 * /api/nmi/bin-check:
 *   post:
 *     summary: BIN lookup (scheme/type/bank/country)
 *     tags: [NMI]
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
 *     responses:
 *       200:
 *         description: BIN details
 */
nmiRouter.post("/nmi/bin-check", async (req, res) => {
  try {
    const { pan, processor } = req.body;
    if (!pan) return res.status(400).json({ ok: false, error: "pan is required" });
    return res.json(await binCheck(String(pan), processor ? String(processor) : undefined));
  } catch (error: unknown) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
});

nmiRouter.post("/nmi/balance-check", async (req, res) => {
  try {
    const { pan, expMonth, expYear, cvv, processor } = req.body;
    if (!pan || !expMonth || !expYear || !cvv) {
      return res.status(400).json({ ok: false, error: "pan, expMonth, expYear, cvv are required" });
    }

    return res.json(
      await balanceCheck({
        processor: processor ? String(processor) : undefined,
        pan: String(pan),
        expMonth: String(expMonth),
        expYear: String(expYear),
        cvv: String(cvv),
      })
    );
  } catch (error: unknown) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
});

nmiRouter.post("/nmi/provision", async (req, res) => {
  try {
    const { pan, expMonth, expYear, cvv, amount, currency, orderId, processor } = req.body;
    if (!pan || !expMonth || !expYear || !cvv || !amount) {
      return res.status(400).json({ ok: false, error: "pan, expMonth, expYear, cvv, amount are required" });
    }

    return res.json(
      await provision({
        processor: processor ? String(processor) : undefined,
        pan: String(pan),
        expMonth: String(expMonth),
        expYear: String(expYear),
        cvv: String(cvv),
        amount: Number(amount),
        currency: currency ? String(currency) : undefined,
        orderId: orderId ? String(orderId) : undefined,
      })
    );
  } catch (error: unknown) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
});

nmiRouter.post("/nmi/provision-completion", async (req, res) => {
  try {
    const { transactionId, amount, processor } = req.body;
    if (!transactionId) {
      return res.status(400).json({ ok: false, error: "transactionId is required" });
    }

    return res.json(
      await provisionCompletion({
        processor: processor ? String(processor) : undefined,
        transactionId: String(transactionId),
        amount: amount ? Number(amount) : undefined,
      })
    );
  } catch (error: unknown) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
});

nmiRouter.post("/nmi/cancel", async (req, res) => {
  try {
    const { transactionId, processor } = req.body;
    if (!transactionId) {
      return res.status(400).json({ ok: false, error: "transactionId is required" });
    }

    return res.json(
      await cancelProvision({
        processor: processor ? String(processor) : undefined,
        transactionId: String(transactionId),
      })
    );
  } catch (error: unknown) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
});

nmiRouter.get("/nmi/transactions", async (_req, res) => {
  try {
    return res.json(await transactionList());
  } catch (error: unknown) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
});
