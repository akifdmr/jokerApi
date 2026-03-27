import { promises as fs } from "node:fs";
import path from "node:path";

export interface BalanceCheckResultRecord {
  id: string;
  runId: string;
  cardId: string;
  cardMasked: string;
  expiryMonth: string;
  expiryYear: string;
  provider: string;
  providerLabel: string;
  estimatedBalance: number;
  currency: string;
  requestCount: number;
  approvedCount: number;
  status: "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

interface BalanceCheckResultStore {
  results: BalanceCheckResultRecord[];
}

const filePath = path.resolve(process.cwd(), "data", "balance-checker-results.json");

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    const init: BalanceCheckResultStore = { results: [] };
    await fs.writeFile(filePath, JSON.stringify(init, null, 2), "utf8");
  }
}

async function readStore(): Promise<BalanceCheckResultStore> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as BalanceCheckResultStore;
}

async function writeStore(store: BalanceCheckResultStore) {
  await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

export async function upsertBalanceCheckResult(
  input: Omit<BalanceCheckResultRecord, "id" | "createdAt" | "updatedAt">
) {
  const store = await readStore();
  const now = new Date().toISOString();
  const existingIndex = store.results.findIndex((item) => item.runId === input.runId);

  if (existingIndex >= 0) {
    store.results[existingIndex] = {
      ...store.results[existingIndex],
      ...input,
      updatedAt: now,
    };
    await writeStore(store);
    return store.results[existingIndex];
  }

  const record: BalanceCheckResultRecord = {
    id: createId("bal-result"),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  store.results.push(record);
  await writeStore(store);
  return record;
}

export async function getBalanceCheckResultByRunId(runId: string) {
  const store = await readStore();
  return store.results.find((item) => item.runId === runId) ?? null;
}

export async function listBalanceCheckResults(limit = 20) {
  const store = await readStore();
  return store.results
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}
