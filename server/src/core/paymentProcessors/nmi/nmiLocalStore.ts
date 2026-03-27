import { promises as fs } from "node:fs";
import path from "node:path";
import { NmiTransactionRecord } from "./nmiTypes.js";

const filePath = path.resolve(process.cwd(), "data", "nmi-transactions.json");

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

async function readStore(): Promise<NmiTransactionRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as NmiTransactionRecord[];
}

async function writeStore(records: NmiTransactionRecord[]) {
  await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(records, null, 2), "utf8");
}

export async function listNmiTransactions(limit = 50) {
  const records = await readStore();
  return records.slice(-limit).reverse();
}

export async function createNmiTransaction(
  partial: Omit<NmiTransactionRecord, "id" | "createdAt" | "updatedAt">
) {
  const now = new Date().toISOString();
  const id = `NMI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const record: NmiTransactionRecord = {
    id,
    ...partial,
    createdAt: now,
    updatedAt: now,
  };

  const records = await readStore();
  records.push(record);
  await writeStore(records);
  return record;
}

export async function updateNmiTransaction(id: string, patch: Partial<NmiTransactionRecord>) {
  const records = await readStore();
  const index = records.findIndex((item) => item.id === id || item.transactionId === id);

  if (index === -1) return null;

  const updated = {
    ...records[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  records[index] = updated;
  await writeStore(records);
  return updated;
}
