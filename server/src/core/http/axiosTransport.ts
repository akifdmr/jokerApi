import https from "node:https";
import axios from "axios";
import proxyAgentPkg from "https-proxy-agent";

const { HttpsProxyAgent } = proxyAgentPkg as unknown as {
  HttpsProxyAgent: new (proxy: string, options?: { rejectUnauthorized?: boolean }) => unknown;
};

function isTruthy(value: string | undefined) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseAllowlist(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function shouldProxyForUrl(targetUrl: string) {
  const allowlist = parseAllowlist(process.env.PROXY_ALLOWLIST) ?? [];
  const defaultAllowlist = [
    "secure.nmi.com",
    "api.stripe.com",
    "lookup.binlist.net",
    "api.mx.com",
    "int-api.mx.com",
    "api.moov.io",
    "api.whop.com",
  ];
  const hosts = allowlist.length > 0 ? allowlist : defaultAllowlist;

  let hostname = "";
  try {
    hostname = new URL(targetUrl).hostname.toLowerCase();
  } catch {
    return false;
  }

  return hosts.some((allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`));
}

export function getAxiosTransport(targetUrl: string) {
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.PROXY_URL ||
    "";

  const allowInsecureTls =
    isTruthy(process.env.ALLOW_INSECURE_TLS) ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0";

  // Axios' built-in proxy option is for basic host/port proxies. We use an agent.
  if (proxyUrl && shouldProxyForUrl(targetUrl)) {
    return {
      proxy: false as const,
      httpsAgent: new HttpsProxyAgent(proxyUrl, {
        rejectUnauthorized: !allowInsecureTls,
      }),
    };
  }

  if (allowInsecureTls) {
    return {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };
  }

  return {};
}

export const http = axios.create();
