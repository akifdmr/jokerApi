import { getAuthHeaders } from "./session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...getAuthHeaders(),
    },
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error ?? `Request failed (${response.status})`);
  return payload;
}

export const whopApi = {
  status: () => request("/api/whop/status"),
  listCompanies: () => request("/api/whop/companies"),
  getCompany: (companyId) => request(`/api/whop/companies/${encodeURIComponent(companyId)}`),
  listProducts: (companyId) => request(`/api/whop/products${companyId ? `?companyId=${encodeURIComponent(companyId)}` : ""}`),
  listPayments: (companyId) => request(`/api/whop/payments${companyId ? `?companyId=${encodeURIComponent(companyId)}` : ""}`),
};
