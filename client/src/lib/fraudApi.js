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
  if (!response.ok) throw new Error(payload?.error ?? `Request failed (${response.status})`);
  return payload;
}

export const fraudApi = {
  getRules: () => request("/api/fraud/rules"),
  setRules: (rules) => request("/api/fraud/rules", "PUT", { rules }),
  listEvents: (limit = 200) => request(`/api/fraud/events?limit=${encodeURIComponent(String(limit))}`),
};

