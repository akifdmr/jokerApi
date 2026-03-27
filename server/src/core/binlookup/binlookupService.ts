import { http, getAxiosTransport } from "../http/axiosTransport.js";

type BinLookupResponse = {
  number?: { length?: number; luhn?: boolean };
  scheme?: string | null;
  type?: string | null;
  brand?: string | null;
  prepaid?: boolean | null;
  country?: {
    numeric?: string | null;
    alpha2?: string | null;
    name?: string | null;
    emoji?: string | null;
    currency?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  bank?: {
    name?: string | null;
    url?: string | null;
    phone?: string | null;
    city?: string | null;
  } | null;
};

type BinLookupResult = {
  source: "binlist" | "mock";
  bin: string;
  scheme?: string;
  brand?: string;
  cardType?: string;
  prepaid?: boolean | null;
  debit?: boolean | null;
  credit?: boolean | null;
  issuer?: string;
  bank?: {
    name?: string | null;
    url?: string | null;
    phone?: string | null;
    city?: string | null;
  };
  country?: {
    alpha2?: string | null;
    name?: string | null;
    emoji?: string | null;
    currency?: string | null;
  };
  raw?: BinLookupResponse;
  warning?: string;
};

const CACHE_TTL_MS = Number(process.env.BINLOOKUP_CACHE_TTL_MS ?? 24 * 60 * 60 * 1000);
const CACHE_MAX = Number(process.env.BINLOOKUP_CACHE_MAX ?? 500);
const BINLOOKUP_BASE_URL =
  (process.env.BINLOOKUP_BASE_URL ?? "https://lookup.binlist.net").replace(/\/+$/, "");

const cache = new Map<string, { at: number; value: BinLookupResult }>();

function getFromCache(bin: string) {
  const hit = cache.get(bin);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(bin);
    return null;
  }
  return hit.value;
}

function setCache(bin: string, value: BinLookupResult) {
  if (cache.size >= CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(bin, { at: Date.now(), value });
}

function extractBin(panOrBin: string) {
  const clean = String(panOrBin || "").replace(/\D/g, "");
  if (clean.length < 6) return "";
  return clean.length >= 8 ? clean.slice(0, 8) : clean.slice(0, 6);
}

function toCardType(type?: string | null) {
  if (!type) return "UNKNOWN";
  const t = type.toLowerCase();
  if (t === "debit") return "DEBIT";
  if (t === "credit") return "CREDIT";
  if (t === "prepaid") return "PREPAID";
  return t.toUpperCase();
}

export async function lookupBin(panOrBin: string): Promise<BinLookupResult> {
  const bin = extractBin(panOrBin);
  if (!bin) {
    return {
      source: "mock",
      bin: "",
      warning: "invalid_bin",
    };
  }

  const cached = getFromCache(bin);
  if (cached) return cached;

  const url = `${BINLOOKUP_BASE_URL}/${bin}`;
  try {
    const response = await http.get<BinLookupResponse>(url, {
      headers: {
        "Accept-Version": "3",
      },
      timeout: Number(process.env.BINLOOKUP_TIMEOUT_MS ?? 5000),
      ...getAxiosTransport(url),
    });

    const data = response.data ?? {};
    const cardType = toCardType(data.type ?? undefined);
    const result: BinLookupResult = {
      source: "binlist",
      bin,
      scheme: data.scheme ?? undefined,
      brand: data.brand ?? undefined,
      cardType,
      prepaid: typeof data.prepaid === "boolean" ? data.prepaid : null,
      debit: data.type ? data.type.toLowerCase() === "debit" : null,
      credit: data.type ? data.type.toLowerCase() === "credit" : null,
      issuer: data.bank?.name ?? undefined,
      bank: data.bank ?? undefined,
      country: data.country
        ? {
            alpha2: data.country.alpha2 ?? null,
            name: data.country.name ?? null,
            emoji: data.country.emoji ?? null,
            currency: data.country.currency ?? null,
          }
        : undefined,
      raw: data,
    };

    setCache(bin, result);
    return result;
  } catch (err) {
    const fallback: BinLookupResult = {
      source: "mock",
      bin,
      scheme: bin.startsWith("4")
        ? "visa"
        : /^5[1-5]/.test(bin)
        ? "mastercard"
        : /^3[47]/.test(bin)
        ? "amex"
        : "unknown",
      brand: undefined,
      cardType: "UNKNOWN",
      prepaid: null,
      debit: null,
      credit: null,
      issuer: undefined,
      country: undefined,
      warning: "binlookup_failed",
    };
    return fallback;
  }
}

