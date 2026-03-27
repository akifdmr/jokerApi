import { http, getAxiosTransport } from "../../http/axiosTransport.js";

type MxConfig = {
  baseUrl: string;
  clientId: string;
  apiKey: string;
  acceptVersion: string;
};

function getMxConfig(): MxConfig | null {
  const clientId = (process.env.MX_CLIENT_ID ?? "").trim();
  const apiKey = (process.env.MX_API_KEY ?? "").trim();
  if (!clientId || !apiKey) return null;
  return {
    baseUrl: (process.env.MX_BASE_URL ?? "https://int-api.mx.com").replace(/\/+$/, ""),
    clientId,
    apiKey,
    acceptVersion: (process.env.MX_ACCEPT_VERSION ?? "v20250224").trim(),
  };
}

function authHeader(clientId: string, apiKey: string) {
  const raw = `${clientId}:${apiKey}`;
  const encoded = Buffer.from(raw).toString("base64");
  return `Basic ${encoded}`;
}

export function mxEnabled() {
  return Boolean(getMxConfig());
}

export async function mxRequest<T>(method: "GET" | "POST", path: string, body?: unknown) {
  const cfg = getMxConfig();
  if (!cfg) throw new Error("mx_not_configured");

  const url = `${cfg.baseUrl}${path}`;
  const response = await http.request<T>({
    method,
    url,
    headers: {
      Accept: "application/json",
      "Accept-Version": cfg.acceptVersion,
      Authorization: authHeader(cfg.clientId, cfg.apiKey),
    },
    data: body,
    timeout: Number(process.env.MX_TIMEOUT_MS ?? 8000),
    ...getAxiosTransport(url),
  });
  return response.data;
}

