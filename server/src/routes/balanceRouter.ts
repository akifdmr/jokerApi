import express from "express";
import { CoreLimitChecker } from "../core/CoreLimitChecker.js";
import { CoreCard } from "../core/types.js";
import { wixPaymentService } from "../providers/wixPaymentService.js";
import { Logger } from "../core/Logger.js";
import { upsertCard, insertCardLimit } from "../core/db.js";
export const balanceRouter = express.Router();

// 🔐 TOKEN MIDDLEWARE
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization format" });
  }

  // ✔️ Sabit bir token kontrolü (istersen .env'ye alabilirsin)
  const VALID_TOKEN = process.env.API_TOKEN || "MY_SECRET_TOKEN";

  if (token !== VALID_TOKEN) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  next();
}



balanceRouter.post("/balance-check", authMiddleware, async (req:any, res:any) => {
  try {
    Logger.info("📥 Incoming /balance-check request");
    Logger.info("➡️ Request Body:", req.body);
    const {
      pan,
      expMonth,
      expYear,
      cvv,
      balance,
      orderId,
      savedPaymentMethodId,
      currency
    } = req.body;

    // VALIDATION
    if (!pan || !expMonth || !expYear || !cvv || !balance) {
      Logger.warn("❗ Missing card info");
      return res.status(400).json({ error: "Missing card info" });
    }
    if (!orderId || !savedPaymentMethodId) {
      Logger.warn("❗ Missing Wix order/payment info");
      return res.status(400).json({ error: "Missing Wix data" });
    }

    const card: CoreCard = {
      pan,
      expMonth: Number(expMonth),
      expYear: Number(expYear),
      cvv,
      balance: Number(balance)
    };

        // 2️⃣ Kartı DB'ye insert/update et
    const cardId = await upsertCard(
      pan,
      Number(expMonth),
      Number(expYear),
      cvv,
      Number(balance),
      20 // yüzde 20 pay default
    );


    Logger.info("💳 Card object constructed", {
      pan: `**** **** **** ${pan.slice(-4)}`,
      exp: `${expMonth}/${expYear}`,
      balance
    });

    // PROVIDER
    const wixProvider = new wixPaymentService(
      orderId,
      savedPaymentMethodId,
      currency || "USD"
    );
    Logger.info("🔌 Wix Provider initialized", {
      orderId,
      savedPaymentMethodId,
      currency: currency || "USD"
    });

        // LIMIT CHECKER
    const checker = new CoreLimitChecker(wixProvider);
    Logger.info("🚀 Starting limit-check process...");
    
    const result = await checker.checkCardLimit(card);

    Logger.success("✅ Limit-check completed");
    Logger.success(`📌 Max Authorized Amount: ${result.maxAuthorizedAmount}`);
    Logger.info(`🔖 Final AuthorizationId: ${result.finalAuthorizationId}`);

    Logger.info("📊 Attempt Summary:");
    result.attempts.forEach((a) => {
      Logger.info(
        `#${a.attempt} → $${a.amountTried} → ${a.status} ${
          a.authorizationId ? " | Auth: " + a.authorizationId : ""
        }`
      );
    });

    await insertCardLimit(
      cardId,
      result.maxAuthorizedAmount,
      result.attempts,
      currency || "USD"
    );


    Logger.success("📤 Response sent to client.");

    return res.json({ success: true, result });


  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Balance check failed" });
  }
});