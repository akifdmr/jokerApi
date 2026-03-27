import { promises as fs } from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "finance-datasets.json");

const DEFAULT_DATASETS = {
  dashboard: [
    { key: "dailyVolume", label: "Daily Volume", value: 126400, currency: "USD" },
    { key: "settlementRate", label: "Settlement Rate", value: 98.6, unit: "%" },
    { key: "riskAlerts", label: "Risk Alerts", value: 4, unit: "open" },
    { key: "activeAccounts", label: "Active Accounts", value: 18, unit: "accounts" },
  ],
  assets: [
    { code: "AST-001", name: "Corporate Card Pool", status: "active", owner: "Treasury" },
    { code: "AST-002", name: "FX Reserve Wallet", status: "active", owner: "Finance Ops" },
    { code: "AST-003", name: "Chargeback Buffer", status: "watchlist", owner: "Risk Desk" },
  ],
  customers: [
    { customerId: "C-1001", fullName: "Atlas Trading LLC", segment: "Enterprise", riskScore: 12 },
    { customerId: "C-1002", fullName: "NorthBridge Retail", segment: "SMB", riskScore: 29 },
    { customerId: "C-1003", fullName: "Mera Logistics", segment: "Mid-Market", riskScore: 21 },
  ],
  partners: [
    { partnerId: "P-01", name: "Vakifbank", channel: "VPOS", commissionPct: 1.45 },
    { partnerId: "P-02", name: "Stripe", channel: "Gateway", commissionPct: 2.1 },
    { partnerId: "P-03", name: "Adyen", channel: "Gateway", commissionPct: 1.95 },
  ],
  accounts: [
    { iban: "TR00 0000 0000 0000 0000 0001", bank: "Vakifbank", currency: "TRY", balance: 845220.31 },
    { iban: "TR00 0000 0000 0000 0000 0002", bank: "Garanti BBVA", currency: "USD", balance: 214332.87 },
    { iban: "TR00 0000 0000 0000 0000 0003", bank: "Yapi Kredi", currency: "EUR", balance: 96840.54 },
  ],
  transactions: [
    { txId: "TX-7781", amount: 1499.5, currency: "USD", status: "approved", provider: "Stripe" },
    { txId: "TX-7782", amount: 525.0, currency: "USD", status: "pending", provider: "Vakifbank" },
    { txId: "TX-7783", amount: 7620.2, currency: "TRY", status: "declined", provider: "Adyen" },
  ],
};

type LocalDataset = typeof DEFAULT_DATASETS;

async function readStore(): Promise<LocalDataset> {
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as LocalDataset;
}

export async function ensureLocalFinanceStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(DEFAULT_DATASETS, null, 2), "utf8");
  }
}

export async function getLocalFinanceItems(resource: keyof LocalDataset) {
  await ensureLocalFinanceStore();
  const store = await readStore();
  return store[resource] ?? [];
}
