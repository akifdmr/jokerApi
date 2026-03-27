import { http, getAxiosTransport } from "../../http/axiosTransport.js";

type WhopConfig = {
  baseUrl: string;
  apiKey: string;
  defaultCompanyId?: string;
  timeoutMs: number;
};

function getWhopConfig(): WhopConfig | null {
  const apiKey = (process.env.WHOP_API_KEY ?? "").trim();
  if (!apiKey) return null;

  const defaultCompanyId = (process.env.WHOP_DEFAULT_COMPANY_ID ?? "").trim();

  return {
    baseUrl: (process.env.WHOP_BASE_URL ?? "https://api.whop.com").replace(/\/+$/, ""),
    apiKey,
    defaultCompanyId: defaultCompanyId || undefined,
    timeoutMs: Number(process.env.WHOP_TIMEOUT_MS ?? 8000),
  };
}

export function whopEnabled() {
  return Boolean(getWhopConfig());
}

export function getWhopDefaultCompanyId() {
  return getWhopConfig()?.defaultCompanyId;
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const cfg = getWhopConfig();
  if (!cfg) throw new Error("whop_not_configured");

  const url = new URL(`${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return { cfg, url: url.toString() };
}

export async function whopRequest<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  options?: {
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }
) {
  const { cfg, url } = buildUrl(path, options?.query);
  const response = await http.request<T>({
    method,
    url,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    data: options?.body,
    timeout: cfg.timeoutMs,
    ...getAxiosTransport(url),
  });

  return response.data;
}
