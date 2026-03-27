import { promises as fs } from "node:fs";
import path from "node:path";

export type SepaCompany = {
  id: string;
  name: string;
  cid?: string;
  createdAt: string;
};

export type SepaIban = {
  id: string;
  iban: string;
  holderName: string;
  companyId?: string;
  createdAt: string;
};

export type SepaMandate = {
  id: string;
  code: string;
  creditorCompanyId: string;
  debtorCompanyId: string;
  ibanId: string;
  amount: number;
  currency: string;
  payerCompanyName: string;
  payeeCompanyName: string;
  cid: string;
  createdAt: string;
};

type SepaStore = {
  companies: SepaCompany[];
  ibans: SepaIban[];
  mandates: SepaMandate[];
};

const filePath = path.resolve(process.cwd(), "data", "sepa-store.json");

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function createMandateCode() {
  return `MDT-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    const initial: SepaStore = { companies: [], ibans: [], mandates: [] };
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore(): Promise<SepaStore> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as SepaStore;
}

async function writeStore(store: SepaStore) {
  await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

export async function listSepaCompanies() {
  const store = await readStore();
  return store.companies.slice().reverse();
}

export async function addSepaCompany(input: { name: string; cid?: string }) {
  const store = await readStore();
  const now = new Date().toISOString();
  const item: SepaCompany = {
    id: createId("sepa-company"),
    name: input.name,
    cid: input.cid,
    createdAt: now,
  };
  store.companies.push(item);
  await writeStore(store);
  return item;
}

export async function listSepaIbans() {
  const store = await readStore();
  return store.ibans.slice().reverse();
}

export async function addSepaIban(input: { iban: string; holderName: string; companyId?: string }) {
  const store = await readStore();
  const now = new Date().toISOString();
  const item: SepaIban = {
    id: createId("sepa-iban"),
    iban: input.iban,
    holderName: input.holderName,
    companyId: input.companyId,
    createdAt: now,
  };
  store.ibans.push(item);
  await writeStore(store);
  return item;
}

export async function listSepaMandates() {
  const store = await readStore();
  return store.mandates.slice().reverse();
}

export async function addSepaMandate(input: {
  creditorCompanyId: string;
  debtorCompanyId: string;
  ibanId: string;
  amount: number;
  currency: string;
}) {
  const store = await readStore();
  const creditor = store.companies.find((c) => c.id === input.creditorCompanyId);
  const debtor = store.companies.find((c) => c.id === input.debtorCompanyId);
  const iban = store.ibans.find((i) => i.id === input.ibanId);

  if (!creditor || !debtor || !iban) {
    throw new Error("invalid_company_or_iban");
  }
  if (!creditor.cid) {
    throw new Error("missing_cid");
  }

  const now = new Date().toISOString();
  const item: SepaMandate = {
    id: createId("sepa-mandate"),
    code: createMandateCode(),
    creditorCompanyId: creditor.id,
    debtorCompanyId: debtor.id,
    ibanId: iban.id,
    amount: Number(input.amount),
    currency: input.currency,
    payerCompanyName: debtor.name,
    payeeCompanyName: creditor.name,
    cid: creditor.cid,
    createdAt: now,
  };
  store.mandates.push(item);
  await writeStore(store);
  return item;
}

