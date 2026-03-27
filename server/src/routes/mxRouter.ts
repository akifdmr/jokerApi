import { Router } from "express";
import { mxEnabled } from "../core/providers/mx/mxClient.js";
import {
  mxCreateUser,
  mxCreateWidgetUrl,
  mxListAccounts,
  mxListAccountNumbersByAccount,
  mxListAccountNumbersByMember,
} from "../core/providers/mx/mxService.js";

export const mxRouter = Router();

/**
 * @openapi
 * /api/mx/status:
 *   get:
 *     summary: MX config availability
 *     tags: [MX]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Status
 * /api/mx/users:
 *   post:
 *     summary: Create MX user
 *     tags: [MX]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier]
 *             properties:
 *               identifier: { type: string }
 *               isTestUser: { type: boolean }
 *               metadata: { type: object }
 *     responses:
 *       200:
 *         description: User created
 * /api/mx/users/{userId}/widget-url:
 *   post:
 *     summary: Create MX Connect widget URL
 *     tags: [MX]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [widget_url]
 *             properties:
 *               widget_url:
 *                 type: object
 *                 required: [widget_type]
 *                 properties:
 *                   widget_type: { type: string, example: "connect_widget" }
 *                   mode: { type: string }
 *     responses:
 *       200:
 *         description: Widget URL
 * /api/mx/users/{userId}/accounts:
 *   get:
 *     summary: List user accounts
 *     tags: [MX]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Accounts
 * /api/mx/users/{userId}/accounts/{accountId}/account-numbers:
 *   get:
 *     summary: Account numbers for a specific account
 *     tags: [MX]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Account numbers
 * /api/mx/users/{userId}/members/{memberId}/account-numbers:
 *   get:
 *     summary: Account numbers for a member
 *     tags: [MX]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Account numbers
 */
mxRouter.get("/mx/status", (_req, res) => {
  res.json({ ok: true, enabled: mxEnabled() });
});

mxRouter.post("/mx/users", async (req, res) => {
  try {
    const { identifier, isTestUser, metadata } = req.body ?? {};
    if (!identifier) return res.status(400).json({ ok: false, error: "identifier is required" });
    const data = await mxCreateUser({
      identifier: String(identifier),
      isTestUser: Boolean(isTestUser),
      metadata: metadata && typeof metadata === "object" ? metadata : undefined,
    });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

mxRouter.post("/mx/users/:userId/widget-url", async (req, res) => {
  try {
    const { userId } = req.params;
    const { widget_url } = req.body ?? {};
    if (!widget_url) return res.status(400).json({ ok: false, error: "widget_url is required" });
    const data = await mxCreateWidgetUrl({
      userIdentifier: String(userId),
      widgetUrl: widget_url,
    });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

mxRouter.get("/mx/users/:userId/accounts", async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await mxListAccounts(String(userId));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

mxRouter.get("/mx/users/:userId/accounts/:accountId/account-numbers", async (req, res) => {
  try {
    const { userId, accountId } = req.params;
    const data = await mxListAccountNumbersByAccount(String(userId), String(accountId));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

mxRouter.get("/mx/users/:userId/members/:memberId/account-numbers", async (req, res) => {
  try {
    const { userId, memberId } = req.params;
    const data = await mxListAccountNumbersByMember(String(userId), String(memberId));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

