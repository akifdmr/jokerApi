import { Router } from "express";
import { moovEnabled } from "../core/providers/moov/moovClient.js";
import { createMoovAccount, createMoovToken, createMoovTransfer } from "../core/providers/moov/moovService.js";

export const moovRouter = Router();

/**
 * @openapi
 * /api/moov/status:
 *   get:
 *     summary: Moov config availability
 *     tags: [Moov]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Status
 * /api/moov/token:
 *   post:
 *     summary: Create Moov access token (client_credentials)
 *     tags: [Moov]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scope: { type: string, example: "accounts.write transfers.write" }
 *     responses:
 *       200:
 *         description: Access token
 * /api/moov/accounts:
 *   post:
 *     summary: Create Moov account
 *     tags: [Moov]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accessToken, account]
 *             properties:
 *               accessToken: { type: string }
 *               account: { type: object }
 *     responses:
 *       200:
 *         description: Account created
 * /api/moov/transfers:
 *   post:
 *     summary: Create Moov transfer
 *     tags: [Moov]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accessToken, accountId, transfer]
 *             properties:
 *               accessToken: { type: string }
 *               accountId: { type: string }
 *               transfer: { type: object }
 *               idempotencyKey: { type: string }
 *     responses:
 *       200:
 *         description: Transfer created
 */
moovRouter.get("/moov/status", (_req, res) => {
  res.json({ ok: true, enabled: moovEnabled() });
});

moovRouter.post("/moov/token", async (req, res) => {
  try {
    const { scope } = req.body ?? {};
    const data = await createMoovToken(scope ? String(scope) : undefined);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

moovRouter.post("/moov/accounts", async (req, res) => {
  try {
    const { accessToken, account } = req.body ?? {};
    if (!accessToken || !account) {
      return res.status(400).json({ ok: false, error: "accessToken and account are required" });
    }
    const data = await createMoovAccount({ accessToken: String(accessToken), account });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

moovRouter.post("/moov/transfers", async (req, res) => {
  try {
    const { accessToken, accountId, transfer, idempotencyKey } = req.body ?? {};
    if (!accessToken || !accountId || !transfer) {
      return res.status(400).json({ ok: false, error: "accessToken, accountId, transfer are required" });
    }
    const data = await createMoovTransfer({
      accessToken: String(accessToken),
      accountId: String(accountId),
      transfer,
      idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
    });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

