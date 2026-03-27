import { promises as fs } from "node:fs";
import path from "node:path";
import type { FraudRuleset } from "./fraudTypes.js";

const filePath = path.resolve(process.cwd(), "data", "fraud-rules.json");

const defaultRuleset: FraudRuleset = {
  version: 1,
  updatedAt: new Date("2026-03-10T00:00:00.000Z").toISOString(),
  profiles: {
    default: {
      id: "default",
      rules: [
        {
          id: "reject-high-amount",
          enabled: true,
          action: "review",
          criteria: { amountGte: 1500 },
          reason: "High amount requires review",
        },
        {
          id: "require-3ds-mid-amount",
          enabled: true,
          action: "require_3ds",
          criteria: { paymentMethodIn: ["card"], amountGte: 200 },
          reason: "3DS required for mid/high card amounts",
        },
        {
          id: "reject-prepaid-by-default",
          enabled: true,
          action: "review",
          criteria: { paymentMethodIn: ["card"], cardPrepaid: true },
          reason: "Prepaid/virtual-like products require review",
        },
      ],
    },
    mcc_7011: {
      id: "mcc_7011",
      rules: [
        {
          id: "7011-require-3ds",
          enabled: true,
          action: "require_3ds",
          criteria: { paymentMethodIn: ["card"], amountGte: 50 },
          reason: "Stricter profile requires 3DS for cards",
        },
        {
          id: "7011-review-prepaid",
          enabled: true,
          action: "review",
          criteria: { paymentMethodIn: ["card"], cardPrepaid: true },
          reason: "Prepaid/virtual-like products require manual review",
        },
        {
          id: "7011-review-high-amount",
          enabled: true,
          action: "review",
          criteria: { amountGte: 500 },
          reason: "High amount requires manual review in this profile",
        },
      ],
    },
  },
};

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultRuleset, null, 2), "utf8");
  }
}

export async function getFraudRuleset(): Promise<FraudRuleset> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as FraudRuleset;
}

export async function setFraudRuleset(next: FraudRuleset) {
  await ensureStore();
  const payload: FraudRuleset = {
    ...next,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

