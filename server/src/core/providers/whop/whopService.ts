import { getWhopDefaultCompanyId, whopRequest } from "./whopClient.js";

type ListQuery = {
  first?: number;
  after?: string;
  before?: string;
  direction?: "asc" | "desc";
};

function companyIdOrDefault(companyId?: string) {
  const resolved = (companyId ?? "").trim() || getWhopDefaultCompanyId();
  if (!resolved) throw new Error("company_id_required");
  return resolved;
}

export async function whopListCompanies(query: ListQuery & { parentCompanyId?: string } = {}) {
  return whopRequest("GET", "/companies", {
    query: {
      first: query.first ?? 20,
      after: query.after,
      before: query.before,
      direction: query.direction ?? "desc",
      parent_company_id: query.parentCompanyId,
    },
  });
}

export async function whopGetCompany(companyId: string) {
  return whopRequest("GET", `/companies/${encodeURIComponent(companyId)}`);
}

export async function whopListProducts(query: ListQuery & { companyId?: string } = {}) {
  return whopRequest("GET", "/products", {
    query: {
      first: query.first ?? 20,
      after: query.after,
      before: query.before,
      direction: query.direction ?? "desc",
      company_id: companyIdOrDefault(query.companyId),
    },
  });
}

export async function whopListPayments(query: ListQuery & { companyId?: string; status?: string } = {}) {
  return whopRequest("GET", "/payments", {
    query: {
      first: query.first ?? 20,
      after: query.after,
      before: query.before,
      direction: query.direction ?? "desc",
      company_id: companyIdOrDefault(query.companyId),
      statuses: query.status,
    },
  });
}
