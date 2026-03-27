import { Router } from "express";
import {
  getRunSnapshot,
  isRunActive,
  listBalanceCheckResults,
  listRuns,
  startSmartBalanceRun,
} from "../core/balanceChecker/smartBalanceChecker.js";
import { BALANCE_CHECKER_PROVIDERS } from "../core/balanceChecker/providerRegistry.js";

export const balanceCheckerRouter = Router();

balanceCheckerRouter.post("/balance-checker/runs", async (req, res) => {
  try {
    const { cardId, provider, processor, initialAmount, maxRequests, minRequests, tolerance } = req.body;
    if (!cardId || !(provider || processor)) {
      return res.status(400).json({ ok: false, error: "cardId and provider are required" });
    }

    const run = await startSmartBalanceRun({
      cardId: String(cardId),
      provider: String(provider ?? processor),
      initialAmount: initialAmount ? Number(initialAmount) : undefined,
      maxRequests: maxRequests ? Number(maxRequests) : undefined,
      minRequests: minRequests ? Number(minRequests) : undefined,
      tolerance: tolerance ? Number(tolerance) : undefined,
    });

    return res.json({ ok: true, run });
  } catch (error: unknown) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "failed" });
  }
});

balanceCheckerRouter.get("/balance-checker/runs", async (_req, res) => {
  const items = await listRuns();
  return res.json({ ok: true, items });
});

balanceCheckerRouter.get("/balance-checker/results", async (_req, res) => {
  const items = await listBalanceCheckResults();
  return res.json({ ok: true, items });
});

balanceCheckerRouter.get("/balance-checker/providers", async (_req, res) => {
  return res.json({ ok: true, items: BALANCE_CHECKER_PROVIDERS });
});

balanceCheckerRouter.get("/balance-checker/runs/:id", async (req, res) => {
  const { id } = req.params;
  const data = await getRunSnapshot(String(id));
  if (!data.header) return res.status(404).json({ ok: false, error: "run not found" });
  return res.json({ ok: true, active: isRunActive(String(id)), ...data });
});
