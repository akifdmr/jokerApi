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

export const masterApi = {
  constants: () => request("/api/master/constants"),
  all: () => request("/api/master/all"),
  addBank: (data) => request("/api/master/banks", "POST", data),
  addPerson: (data) => request("/api/master/people", "POST", data),
  addCardTemplate: (data) => request("/api/master/card-templates", "POST", data),
  addCard: (data) => request("/api/master/cards", "POST", data),
  addAccount: (data) => request("/api/master/accounts", "POST", data),
  addTopup: (data) => request("/api/master/topups", "POST", data),
  addTopupNote: (id, note) => request(`/api/master/topups/${id}/notes`, "POST", { note }),
};
