import { promises as fs } from "node:fs";
import path from "node:path";
import { listMasterData } from "./masterDataStore.js";

export const ONRAMP_PAYMENT_METHODS = ["card", "ach", "sepa"] as const;
export const ONRAMP_ASSETS = ["BTC", "ETH", "USDT", "USDC", "SOL"] as const;

type PaymentMethod = (typeof ONRAMP_PAYMENT_METHODS)[number];
type Asset = (typeof ONRAMP_ASSETS)[number];

interface OnrampOrder {
  id: string;
  paymentMethod: PaymentMethod;
  paymentProvider?: string;
  paymentReference?: string;
  asset: Asset;
  fiatCurrency: string;
  fiatAmount: number;
  feeAmount: number;
  netFiatAmount: number;
  assetAmount: number;
  walletAddress: string;
  sourceCardId?: string;
  sourceCardMasked?: string;
  paymentDetails: Record<string, string>;
  status: "processing" | "completed" | "failed";
  transferTxId: string;
  createdAt: string;
  updatedAt: string;
}

interface OnrampStore {
  orders: OnrampOrder[];
}

const filePath = path.resolve(process.cwd(), "data", "onramp-orders.json");

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getRate(asset: Asset) {
  const rates: Record<Asset, number> = {
    BTC: 62000,
    ETH: 3200,
    USDT: 1,
    USDC: 1,
    SOL: 135,
  };
  return rates[asset];
}

function getFeePercent(paymentMethod: PaymentMethod) {
  const fees: Record<PaymentMethod, number> = {
    card: 2.9,
    ach: 1.1,
    sepa: 0.9,
  };
  return fees[paymentMethod];
}

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    const initial: OnrampStore = { orders: [] };
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore(): Promise<OnrampStore> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as OnrampStore;
}

async function writeStore(store: OnrampStore) {
  await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

export async function ensureOnrampStore() {
  await ensureStore();
}

export async function getOnrampSources() {
  const master = await listMasterData();
  return {
    cards: master.cards.map((card) => ({
      id: card.id,
      label: `${card.cardNumber} (${card.expiryMonth}/${card.expiryYear})`,
      masked: `**** **** **** ${card.cardNumber.slice(-4)}`,
    })),
  };
}

export async function listOnrampOrders() {
  const store = await readStore();
  return store.orders.slice().reverse();
}

export async function createOnrampOrder(input: {
  paymentMethod: PaymentMethod;
  asset: Asset;
  fiatCurrency: string;
  fiatAmount: number;
  walletAddress: string;
  sourceCardId?: string;
  paymentDetails: Record<string, string>;
  paymentProvider?: string;
  paymentReference?: string;
  status?: OnrampOrder["status"];
}) {
  const feePercent = getFeePercent(input.paymentMethod);
  const feeAmount = Number(((input.fiatAmount * feePercent) / 100).toFixed(2));
  const netFiatAmount = Number((input.fiatAmount - feeAmount).toFixed(2));
  const assetAmount = Number((netFiatAmount / getRate(input.asset)).toFixed(8));

  const sources = await getOnrampSources();
  const sourceCard = sources.cards.find((card) => card.id === input.sourceCardId);

  const now = new Date().toISOString();
  const order: OnrampOrder = {
    id: createId("onramp"),
    paymentMethod: input.paymentMethod,
    paymentProvider: input.paymentProvider,
    paymentReference: input.paymentReference,
    asset: input.asset,
    fiatCurrency: input.fiatCurrency,
    fiatAmount: input.fiatAmount,
    feeAmount,
    netFiatAmount,
    assetAmount,
    walletAddress: input.walletAddress,
    sourceCardId: sourceCard?.id,
    sourceCardMasked: sourceCard?.masked,
    paymentDetails: input.paymentDetails,
    status: input.status ?? "completed",
    transferTxId: `CHAIN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    createdAt: now,
    updatedAt: now,
  };

  const store = await readStore();
  store.orders.push(order);
  await writeStore(store);
  return order;
}

export function quoteOnramp(input: { paymentMethod: PaymentMethod; asset: Asset; fiatAmount: number }) {
  const feePercent = getFeePercent(input.paymentMethod);
  const feeAmount = Number(((input.fiatAmount * feePercent) / 100).toFixed(2));
  const netFiatAmount = Number((input.fiatAmount - feeAmount).toFixed(2));
  const estimatedAssetAmount = Number((netFiatAmount / getRate(input.asset)).toFixed(8));

  return {
    feePercent,
    feeAmount,
    netFiatAmount,
    estimatedAssetAmount,
    rate: getRate(input.asset),
  };
}
