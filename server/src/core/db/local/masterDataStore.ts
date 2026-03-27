import { promises as fs } from "node:fs";
import path from "node:path";
import bcrypt from "bcrypt";

export const ACCOUNT_TYPES = ["checking", "savings", "money_market"] as const;
export const ACCOUNT_OWNERSHIPS = ["business", "personal"] as const;
export const TOPUP_STATUSES = ["success", "returned", "canceled"] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number];
type AccountOwnership = (typeof ACCOUNT_OWNERSHIPS)[number];
type TopupStatus = (typeof TOPUP_STATUSES)[number];

export interface BankRecord {
  id: string;
  name: string;
  swift?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardRecord {
  id: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  holderPersonId: string;
  bankId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardTemplateRecord {
  id: string;
  templateName: string;
  bankId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountRecord {
  id: string;
  bankId: string;
  ownerPersonId?: string;
  accountOwnership: AccountOwnership;
  accountType: AccountType;
  balance: number;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopupNote {
  id: string;
  note: string;
  createdAt: string;
}

export interface TopupRecord {
  id: string;
  cardId: string;
  accountId: string;
  loadedAmount: number;
  totalAmount: number;
  status: TopupStatus;
  commissionRate: number;
  expectedCommission: number;
  fillerEarnings: number;
  noteHistory: TopupNote[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemUserRecord {
  id: string;
  personId: string;
  username: string;
  passwordHash: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MasterStore {
  banks: BankRecord[];
  people: PersonRecord[];
  cardTemplates: CardTemplateRecord[];
  cards: CardRecord[];
  accounts: AccountRecord[];
  topups: TopupRecord[];
  systemUsers: SystemUserRecord[];
}

const filePath = path.resolve(process.cwd(), "data", "master-data.json");

const defaultStore: MasterStore = {
  banks: [
    {
      id: "bank-us-boa",
      name: "Bank of America",
      swift: "BOFAUS3N",
      country: "US",
      createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    },
    {
      id: "bank-us-chase",
      name: "JPMorgan Chase Bank",
      swift: "CHASUS33",
      country: "US",
      createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    },
    {
      id: "bank-us-wf",
      name: "Wells Fargo Bank",
      swift: "WFBIUS6S",
      country: "US",
      createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    },
    {
      id: "bank-us-citi",
      name: "Citibank N.A.",
      swift: "CITIUS33",
      country: "US",
      createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    },
    {
      id: "bank-us-usbank",
      name: "U.S. Bank",
      swift: "USBKUS44",
      country: "US",
      createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    },
  ],
  people: [],
  cardTemplates: [],
  cards: [],
  accounts: [],
  topups: [],
  systemUsers: [],
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<MasterStore> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as MasterStore;
}

async function writeStore(store: MasterStore) {
  await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

export async function ensureMasterStore() {
  await ensureStore();
  const store = await readStore();
  const existingIds = new Set((store.banks ?? []).map((bank) => bank.id));
  const missingDefaults = defaultStore.banks.filter((bank) => !existingIds.has(bank.id));
  let changed = false;
  if (missingDefaults.length > 0) {
    store.banks = [...(store.banks ?? []), ...missingDefaults];
    changed = true;
  }
  if (!Array.isArray(store.cardTemplates)) {
    store.cardTemplates = [];
    changed = true;
  }
  if (!Array.isArray(store.systemUsers)) {
    store.systemUsers = [];
    changed = true;
  }
  if (!Array.isArray(store.accounts)) {
    store.accounts = [];
    changed = true;
  }
  if (!Array.isArray(store.people)) {
    store.people = [];
    changed = true;
  }

  if (store.systemUsers.length === 0) {
    const now = new Date().toISOString();
    const adminPersonId = "person-system-admin";
    const adminPersonExists = store.people.some((person) => person.id === adminPersonId);
    if (!adminPersonExists) {
      store.people.push({
        id: adminPersonId,
        firstName: "System",
        lastName: "Admin",
        createdAt: now,
        updatedAt: now,
      });
    }

    store.systemUsers.push({
      id: "sys-user-admin",
      personId: adminPersonId,
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    });
    changed = true;
  }

  // Backward compatibility: migrate old accountType values where business/personal
  for (const account of store.accounts) {
    const legacyType = (account as { accountType?: string }).accountType ?? "";
    if (!(account as { accountOwnership?: string }).accountOwnership) {
      (account as { accountOwnership: AccountOwnership }).accountOwnership =
        legacyType === "business" ? "business" : "personal";
      changed = true;
    }

    if (!ACCOUNT_TYPES.includes(legacyType as AccountType)) {
      (account as { accountType: AccountType }).accountType = "checking";
      changed = true;
    }
  }

  if (changed) await writeStore(store);
}

export async function listMasterData() {
  return readStore();
}

export async function getCardById(cardId: string) {
  const store = await readStore();
  return store.cards.find((card) => card.id === cardId) ?? null;
}

export async function addBank(input: Omit<BankRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: BankRecord = { id: createId("bank"), ...input, createdAt: now, updatedAt: now };
  store.banks.push(record);
  await writeStore(store);
  return record;
}

export async function addPerson(input: Omit<PersonRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: PersonRecord = { id: createId("person"), ...input, createdAt: now, updatedAt: now };
  store.people.push(record);
  await writeStore(store);
  return record;
}

export async function addCardTemplate(input: Omit<CardTemplateRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: CardTemplateRecord = {
    id: createId("card-template"),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  store.cardTemplates.push(record);
  await writeStore(store);
  return record;
}

export async function addCard(input: Omit<CardRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: CardRecord = { id: createId("card"), ...input, createdAt: now, updatedAt: now };
  store.cards.push(record);
  await writeStore(store);
  return record;
}

export async function createSystemUser(input: { personId: string; username: string; password: string }) {
  const store = await readStore();
  const username = input.username.trim().toLowerCase();
  const exists = store.systemUsers.find((user) => user.username === username);
  if (exists) throw new Error("username already exists");

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const record: SystemUserRecord = {
    id: createId("sys-user"),
    personId: input.personId,
    username,
    passwordHash,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  };
  store.systemUsers.push(record);
  await writeStore(store);
  return { id: record.id, personId: record.personId, username: record.username, isSystem: true };
}

export async function verifySystemUser(username: string, password: string) {
  const store = await readStore();
  const normalized = username.trim().toLowerCase();
  const user = store.systemUsers.find((item) => item.username === normalized);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  const person = store.people.find((item) => item.id === user.personId);
  return {
    id: user.id,
    username: user.username,
    personId: user.personId,
    name: person ? `${person.firstName} ${person.lastName}` : user.username,
  };
}

export async function addAccount(input: Omit<AccountRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: AccountRecord = { id: createId("account"), ...input, createdAt: now, updatedAt: now };
  store.accounts.push(record);
  await writeStore(store);
  return record;
}

export async function addTopup(
  input: Omit<TopupRecord, "id" | "expectedCommission" | "fillerEarnings" | "noteHistory" | "createdAt" | "updatedAt">
) {
  const store = await readStore();
  const now = new Date().toISOString();
  const expectedCommission = Number(((input.loadedAmount * input.commissionRate) / 100).toFixed(2));

  const record: TopupRecord = {
    id: createId("topup"),
    ...input,
    expectedCommission,
    fillerEarnings: expectedCommission,
    noteHistory: [],
    createdAt: now,
    updatedAt: now,
  };

  store.topups.push(record);
  await writeStore(store);
  return record;
}

export async function addTopupNote(topupId: string, note: string) {
  const store = await readStore();
  const index = store.topups.findIndex((item) => item.id === topupId);
  if (index === -1) return null;

  const noteItem: TopupNote = {
    id: createId("note"),
    note,
    createdAt: new Date().toISOString(),
  };

  store.topups[index].noteHistory.push(noteItem);
  store.topups[index].updatedAt = new Date().toISOString();
  await writeStore(store);
  return store.topups[index];
}
