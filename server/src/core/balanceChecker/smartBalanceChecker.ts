import { getCardById } from "../db/local/masterDataStore.js";
import {
  appendRunDetail,
  createRunHeader,
  finalizeRunHeader,
  getRun,
  listRuns,
} from "../db/local/balanceCheckerStore.js";
import {
  getBalanceCheckResultByRunId,
  listBalanceCheckResults,
  upsertBalanceCheckResult,
} from "../db/local/balanceCheckerResultStore.js";
import { provision } from "../paymentProcessors/nmi/nmiService.js";
import {
  getBalanceCheckerProviderLabel,
  normalizeBalanceCheckerProvider,
} from "./providerRegistry.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const activeRuns = new Set<string>();

type RunPhase = "bubble-sort" | "discovery" | "binary-search" | "summary";

function maskCardNumber(cardNumber: string) {
  const clean = String(cardNumber ?? "").replace(/\D/g, "");
  if (clean.length < 4) return clean;
  return `**** **** **** ${clean.slice(-4)}`;
}

function bubbleSortNumbers(input: number[]) {
  const items = input.slice();
  for (let i = 0; i < items.length; i += 1) {
    for (let j = 0; j < items.length - i - 1; j += 1) {
      if (items[j] > items[j + 1]) {
        const temp = items[j];
        items[j] = items[j + 1];
        items[j + 1] = temp;
      }
    }
  }
  return items;
}

function buildBubbleSortedSeedAmounts(initialAmount: number) {
  const raw = [
    Number(initialAmount.toFixed(2)),
    Number((initialAmount / 2).toFixed(2)),
    Number((initialAmount / 4).toFixed(2)),
  ].map((amount) => Math.max(amount, 1));

  return [...new Set(bubbleSortNumbers(raw))];
}

export async function startSmartBalanceRun(input: {
  cardId: string;
  provider?: string;
  processor?: string;
  initialAmount?: number;
  maxRequests?: number;
  minRequests?: number;
  tolerance?: number;
}) {
  const card = await getCardById(input.cardId);
  if (!card) throw new Error("card not found");

  const initialAmount = Number(input.initialAmount ?? 2500);
  const maxRequests = Math.max(Number(input.maxRequests ?? 12), 5);
  const minRequests = Math.max(Number(input.minRequests ?? 5), 5);
  const tolerance = Math.max(Number(input.tolerance ?? 25), 1);
  const provider = normalizeBalanceCheckerProvider(input.provider ?? input.processor);
  const providerLabel = getBalanceCheckerProviderLabel(provider);

  const header = await createRunHeader({
    cardId: card.id,
    provider,
    providerLabel,
    initialAmount,
  });

  activeRuns.add(header.id);

  void runEngine({
    runId: header.id,
    card,
    provider,
    providerLabel,
    initialAmount,
    maxRequests,
    minRequests,
    tolerance,
  });

  return header;
}

async function runEngine(input: {
  runId: string;
  card: {
    id: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  provider: string;
  providerLabel: string;
  initialAmount: number;
  maxRequests: number;
  minRequests: number;
  tolerance: number;
}) {
  let totalApproved = 0;
  let approvedCount = 0;
  let requestNo = 0;
  let lastApproved = 0;
  let firstDeclined = 0;
  let probeAmount = input.initialAmount;
  const cardMasked = maskCardNumber(input.card.cardNumber);

  const persistResult = async (status: "completed" | "failed", estimatedBalance: number) => {
    await upsertBalanceCheckResult({
      runId: input.runId,
      cardId: input.card.id,
      cardMasked,
      expiryMonth: input.card.expiryMonth,
      expiryYear: input.card.expiryYear,
      provider: input.provider,
      providerLabel: input.providerLabel,
      estimatedBalance,
      currency: "USD",
      requestCount: requestNo,
      approvedCount,
      status,
    });
  };

  try {
    const attempt = async (amount: number, phase: RunPhase) => {
      requestNo += 1;
      const normalizedAmount = Number(Math.max(amount, 1).toFixed(2));
      const orderId = `BAL-${input.runId}-${requestNo}`;

      try {
        const result = await provision({
          processor: input.provider,
          pan: input.card.cardNumber,
          expMonth: input.card.expiryMonth,
          expYear: input.card.expiryYear,
          cvv: input.card.cvv,
          amount: normalizedAmount,
          currency: "USD",
          orderId,
        });

        const approved = result.transaction?.status === "pending";
        if (approved) {
          totalApproved += normalizedAmount;
          approvedCount += 1;
          lastApproved = Math.max(lastApproved, normalizedAmount);
        } else {
          firstDeclined = firstDeclined === 0 ? normalizedAmount : Math.min(firstDeclined, normalizedAmount);
        }

        await appendRunDetail({
          runId: input.runId,
          stepNo: requestNo,
          level: approved ? "success" : "warn",
          phase,
          provider: input.provider,
          providerLabel: input.providerLabel,
          cardMasked,
          attemptedAmount: normalizedAmount,
          outcome: approved ? "approved" : "declined",
          addedAmount: approved ? normalizedAmount : 0,
          cumulativeApproved: totalApproved,
          transactionId: result.transaction?.transactionId,
          message: approved
            ? `[${requestNo}] ${cardMasked} | ${input.providerLabel} | ${normalizedAmount} USD | APPROVED | accepted-total=${totalApproved}`
            : `[${requestNo}] ${cardMasked} | ${input.providerLabel} | ${normalizedAmount} USD | DECLINED`,
        });
      } catch (err) {
        firstDeclined = firstDeclined === 0 ? normalizedAmount : Math.min(firstDeclined, normalizedAmount);
        await appendRunDetail({
          runId: input.runId,
          stepNo: requestNo,
          level: "error",
          phase,
          provider: input.provider,
          providerLabel: input.providerLabel,
          cardMasked,
          attemptedAmount: normalizedAmount,
          outcome: "error",
          addedAmount: 0,
          cumulativeApproved: totalApproved,
          message: `[${requestNo}] ${cardMasked} | ${input.providerLabel} | ${normalizedAmount} USD | ERROR | ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    };

    for (const seedAmount of buildBubbleSortedSeedAmounts(input.initialAmount)) {
      if (requestNo >= input.maxRequests) break;
      await attempt(seedAmount, "bubble-sort");
      if (requestNo < input.maxRequests) {
        await delay(5000);
      }
      if (requestNo >= input.minRequests && firstDeclined > 0 && lastApproved > 0) {
        break;
      }
    }

    while (requestNo < input.maxRequests) {
      if (firstDeclined > 0 && lastApproved > 0) break;

      if (firstDeclined === 0) {
        probeAmount = lastApproved > 0 ? Number((lastApproved * 2).toFixed(2)) : input.initialAmount;
      } else if (lastApproved === 0) {
        probeAmount = Number((firstDeclined / 2).toFixed(2));
      }

      await attempt(probeAmount, "discovery");
      if (requestNo < input.maxRequests) {
        await delay(5000);
      }

      if (requestNo >= input.minRequests && firstDeclined > 0 && lastApproved > 0) break;
    }

    while (
      requestNo < input.maxRequests &&
      (requestNo < input.minRequests ||
        (firstDeclined > 0 &&
          lastApproved > 0 &&
          firstDeclined - lastApproved > input.tolerance))
    ) {
      if (firstDeclined === 0 && lastApproved > 0) {
        probeAmount = Number((lastApproved * 1.5).toFixed(2));
      } else if (lastApproved === 0 && firstDeclined > 0) {
        probeAmount = Number((firstDeclined / 2).toFixed(2));
      } else {
        probeAmount = Number((((lastApproved + firstDeclined) / 2) || 1).toFixed(2));
      }

      await attempt(probeAmount, "binary-search");
      if (requestNo < input.maxRequests) {
        await delay(5000);
      }
    }

    const estimatedLimit = Number(lastApproved.toFixed(2));
    await appendRunDetail({
      runId: input.runId,
      stepNo: requestNo + 1,
      level: "info",
      phase: "summary",
      provider: input.provider,
      providerLabel: input.providerLabel,
      cardMasked,
      attemptedAmount: 0,
      outcome: "approved",
      addedAmount: 0,
      cumulativeApproved: totalApproved,
      message: `[SUMMARY] ${cardMasked} | ${input.providerLabel} | estimated-balance=${estimatedLimit} USD | requests=${requestNo}`,
    });

    await finalizeRunHeader(input.runId, "completed", estimatedLimit);
    await persistResult("completed", estimatedLimit);
  } catch {
    await finalizeRunHeader(input.runId, "failed", lastApproved);
    await persistResult("failed", Number(lastApproved.toFixed(2)));
  } finally {
    activeRuns.delete(input.runId);
  }
}

export function isRunActive(runId: string) {
  return activeRuns.has(runId);
}

export async function getRunSnapshot(runId: string) {
  const data = await getRun(runId);
  const result = await getBalanceCheckResultByRunId(runId);
  return { ...data, result };
}

export { listBalanceCheckResults, listRuns };
