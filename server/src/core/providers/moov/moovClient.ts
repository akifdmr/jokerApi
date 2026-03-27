import { http, getAxiosTransport } from "../../http/axiosTransport.js";

type MoovConfig = {
  baseUrl: string;
  publicKey: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  version: string;
};

function getMoovConfig(): MoovConfig | null {
  const publicKey = (process.env.MOOV_PUBLIC_KEY ?? "").trim();
  const privateKey = (process.env.MOOV_PRIVATE_KEY ?? "").trim();
  const clientId = (process.env.MOOV_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.MOOV_CLIENT_SECRET ?? "").trim();
  if (!publicKey || !privateKey || !clientId || !clientSecret) return null;
  return {
    baseUrl: (process.env.MOOV_BASE_URL ?? "https://api.moov.io").replace(/\/+$/, ""),
    publicKey,
    privateKey,
    clientId,
    clientSecret,
    version: (process.env.MOOV_VERSION ?? "v2024.01.00").trim(),
  };
}

function basicAuthHeader(publicKey: string, privateKey: string) {
  const raw = `${publicKey}:${privateKey}`;
  const encoded = Buffer.from(raw).toString("base64");
  return `Basic ${encoded}`;
}

export function moovEnabled() {
  return Boolean(getMoovConfig());
}

export async function moovCreateAccessToken(scope = "accounts.write transfers.write") {
  const cfg = getMoovConfig();
  if (!cfg) throw new Error("moov_not_configured");

  const url = `${cfg.baseUrl}/oauth2/token`;
  const response = await http.post(
    url,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      scope,
    }),
    {
      headers: {
        Authorization: basicAuthHeader(cfg.publicKey, cfg.privateKey),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: Number(process.env.MOOV_TIMEOUT_MS ?? 8000),
      ...getAxiosTransport(url),
    }
  );
  return response.data;
}

export async function moovRequest<T>(
  method: "GET" | "POST",
  path: string,
  accessToken: string,
  body?: unknown,
  idempotencyKey?: string
) {
  const cfg = getMoovConfig();
  if (!cfg) throw new Error("moov_not_configured");

  const url = `${cfg.baseUrl}${path}`;
  const response = await http.request<T>({
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-moov-version": cfg.version,
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    data: body,
    timeout: Number(process.env.MOOV_TIMEOUT_MS ?? 8000),
    ...getAxiosTransport(url),
  });
  return response.data;
}

