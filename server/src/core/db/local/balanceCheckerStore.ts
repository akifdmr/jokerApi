import { promises as fs } from "node:fs";
import path from "node:path";

export type BalanceRunStatus = "running" | "completed" | "failed";

export interface BalanceRunHeader {
  id: string;
  cardId: string;
  provider: string;
  providerLabel: string;
  status: BalanceRunStatus;
  initialAmount: number;
  totalApprovedLimit: number;
  requestCount: number;
  approvedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceRunDetail {
  id: string;
  runId: string;
  stepNo: number;
  level: "info" | "success" | "warn" | "error";
  phase: "bubble-sort" | "discovery" | "binary-search" | "summary";
  provider: string;
  providerLabel: string;
  cardMasked: string;
  attemptedAmount: number;
  outcome: "approved" | "declined" | "error";
  addedAmount: number;
  cumulativeApproved: number;
  transactionId?: string;
  message: string;
  createdAt: string;
}

interface BalanceStore {
  headers: BalanceRunHeader[];
  details: BalanceRunDetail[];
}

const filePath = path.resolve(process.cwd(), "data", "balance-checker-runs.json");

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    const init: BalanceStore = { headers: [], details: [] };
    await fs.writeFile(filePath, JSON.stringify(init, null, 2), "utf8");
  }
}

async function readStore(): Promise<BalanceStore> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as BalanceStore;
}

async function writeStore(store: BalanceStore) {
  await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

export async function ensureBalanceCheckerStore() {
  await ensureStore();
}

export async function createRunHeader(input: {
  cardId: string;
  provider: string;
  providerLabel: string;
  initialAmount: number;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: BalanceRunHeader = {
    id: createId("bal-run"),
    cardId: input.cardId,
    provider: input.provider,
    providerLabel: input.providerLabel,
    status: "running",
    initialAmount: input.initialAmount,
    totalApprovedLimit: 0,
    requestCount: 0,
    approvedCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  store.headers.push(record);
  await writeStore(store);
  return record;
}

export async function appendRunDetail(input: Omit<BalanceRunDetail, "id" | "createdAt">) {
  const store = await readStore();
  const detail: BalanceRunDetail = {
    id: createId("bal-det"),
    ...input,
    createdAt: new Date().toISOString(),
  };

  store.details.push(detail);

  const headerIndex = store.headers.findIndex((header) => header.id === input.runId);
  if (headerIndex >= 0) {
    const isRequestRow = input.attemptedAmount > 0;
    if (isRequestRow) {
      store.headers[headerIndex].requestCount += 1;
      if (input.outcome === "approved") {
        store.headers[headerIndex].approvedCount += 1;
      }
    }
    store.headers[headerIndex].updatedAt = new Date().toISOString();
  }

  await writeStore(store);
  return detail;
}

export async function finalizeRunHeader(runId: string, status: BalanceRunStatus, totalApprovedLimit: number) {
  const store = await readStore();
  const idx = store.headers.findIndex((header) => header.id === runId);
  if (idx === -1) return null;

  store.headers[idx].status = status;
  store.headers[idx].totalApprovedLimit = totalApprovedLimit;
  store.headers[idx].updatedAt = new Date().toISOString();
  await writeStore(store);
  return store.headers[idx];
}

export async function getRun(runId: string) {
  const store = await readStore();
  const header = store.headers.find((item) => item.id === runId) ?? null;
  const details = store.details
    .filter((item) => item.runId === runId)
    .sort((a, b) => a.stepNo - b.stepNo);
  return { header, details };
}

export async function listRuns(limit = 20) {
  const store = await readStore();
  return store.headers
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
