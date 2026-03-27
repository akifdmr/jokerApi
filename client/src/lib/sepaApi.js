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

export const sepaApi = {
  listCompanies: () => request("/api/sepa/companies"),
  addCompany: (input) => request("/api/sepa/companies", "POST", input),
  listIbans: () => request("/api/sepa/ibans"),
  addIban: (input) => request("/api/sepa/ibans", "POST", input),
  listMandates: () => request("/api/sepa/mandates"),
  addMandate: (input) => request("/api/sepa/mandates", "POST", input),
};

