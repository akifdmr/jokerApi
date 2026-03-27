import { getAuthHeaders } from "./session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function fetchFinanceResource(resource) {
  const response = await fetch(`${API_BASE_URL}/api/finance/${resource}`, {
    headers: {
      Accept: "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${resource}: ${response.status}`);
  }

  return response.json();
}
