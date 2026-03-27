import express from "express";

// @ts-ignore: missing type declarations for CommonJS module
export const balanceRouter = express.Router();
/**
 * @openapi
 * /joker/api/balance-check:
 *   post:
 *     summary: Parametric limit check on a card (Stripe / Wix)
 *     tags:
 *       - Balance Checker
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - pan
 *               - expMonth
 *               - expYear
 *               - cvv
 *               - balance
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [stripe, wix]
 *               pan:
 *                 type: string
 *               expMonth:
 *                 type: number
 *               expYear:
 *                 type: number
 *               cvv:
 *                 type: string
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: "USD"
 *               orderId:
 *                 type: string
 *                 description: "Wix only"
 *               savedPaymentMethodId:
 *                 type: string
 *                 description: "Wix only"
 *               stripeApiKey:
 *                 type: string
 *                 description: "Stripe only"
 *     responses:
 *       200:
 *         description: Limit check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 provider:
 *                   type: string
 *                 result:
 *                   type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Internal error
 */

// ==========================
//    AUTH MIDDLEWARE
// ==========================
balanceRouter.use(async (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "Missing Authorization header" });

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization format" });
  }

  const VALID = process.env.API_TOKEN || "MY_SECRET_TOKEN";
  if (token !== VALID) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  next();
});
