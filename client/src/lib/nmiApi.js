import { getAuthHeaders } from "./session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path, method = "GET", body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }
  return payload;
}

export const nmiApi = {
  binCheck: (input) => request("/api/nmi/bin-check", "POST", input),
  balanceCheck: (input) => request("/api/nmi/balance-check", "POST", input),
  provision: (input) => request("/api/nmi/provision", "POST", input),
  provisionCompletion: (input) => request("/api/nmi/provision-completion", "POST", input),
  cancel: (input) => request("/api/nmi/cancel", "POST", input),
  transactions: () => request("/api/nmi/transactions", "GET"),
};
