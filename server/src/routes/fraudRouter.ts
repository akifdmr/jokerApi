import { Router } from "express";
import { getFraudRuleset, setFraudRuleset } from "../core/fraud/fraudRulesStore.js";
import { listFraudEvents } from "../core/fraud/fraudEventStore.js";

export const fraudRouter = Router();

/**
 * @openapi
 * /api/fraud/rules:
 *   get:
 *     summary: Get fraud ruleset (profiles + rules)
 *     tags: [Fraud]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Ruleset
 *   put:
 *     summary: Replace fraud ruleset
 *     tags: [Fraud]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rules]
 *             properties:
 *               rules:
 *                 type: object
 *     responses:
 *       200:
 *         description: Saved ruleset
 * /api/fraud/events:
 *   get:
 *     summary: List recent fraud decisions
 *     tags: [Fraud]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 200, minimum: 1, maximum: 500 }
 *     responses:
 *       200:
 *         description: Events
 */
fraudRouter.get("/fraud/rules", async (_req, res) => {
  const rules = await getFraudRuleset();
  res.json({ ok: true, rules });
});

fraudRouter.put("/fraud/rules", async (req, res) => {
  const rules = req.body?.rules;
  if (!rules || typeof rules !== "object") {
    return res.status(400).json({ ok: false, error: "rules is required" });
  }
  const saved = await setFraudRuleset(rules);
  res.json({ ok: true, rules: saved });
});

fraudRouter.get("/fraud/events", async (req, res) => {
  const limit = Number(req.query.limit ?? 200);
  const items = await listFraudEvents(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 200);
  res.json({ ok: true, items });
});
