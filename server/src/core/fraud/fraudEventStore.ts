import { promises as fs } from "node:fs";
import path from "node:path";
import type { FraudContext, FraudDecision } from "./fraudTypes.js";

type FraudEvent = {
  id: string;
  at: string;
  stage: "pre" | "post";
  context: FraudContext;
  decision: FraudDecision;
  paymentProvider?: string;
  paymentReference?: string;
};

const filePath = path.resolve(process.cwd(), "data", "fraud-events.json");

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify({ events: [] }, null, 2), "utf8");
  }
}

async function readStore(): Promise<{ events: FraudEvent[] }> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as { events: FraudEvent[] };
}

async function writeStore(store: { events: FraudEvent[] }) {
  await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

export async function appendFraudEvent(event: Omit<FraudEvent, "id" | "at">) {
  const now = new Date().toISOString();
  const record: FraudEvent = {
    id: createId("fraud"),
    at: now,
    ...event,
  };
  const store = await readStore();
  store.events.push(record);
  await writeStore(store);
  return record;
}

export async function listFraudEvents(limit = 200) {
  const store = await readStore();
  return store.events.slice(-limit).reverse();
}

