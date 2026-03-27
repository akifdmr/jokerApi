import React from "react";
import { whopApi } from "../lib/whopApi";
import "./Whop.css";

function money(amount, currency) {
  if (amount === undefined || amount === null) return "-";
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return String(amount);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(currency || "USD").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(numeric / 100);
  } catch {
    return `${numeric} ${currency ?? ""}`.trim();
  }
}

export default function Whop() {
  const [status, setStatus] = React.useState({ enabled: false, defaultCompanyId: null });
  const [companies, setCompanies] = React.useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState("");
  const [company, setCompany] = React.useState(null);
  const [products, setProducts] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const statusPayload = await whopApi.status();
      setStatus({
        enabled: Boolean(statusPayload.enabled),
        defaultCompanyId: statusPayload.defaultCompanyId ?? null,
      });

      if (!statusPayload.enabled) {
        setCompanies([]);
        setSelectedCompanyId("");
        setCompany(null);
        setProducts([]);
        setPayments([]);
        return;
      }

      const companiesPayload = await whopApi.listCompanies();
      const items = companiesPayload.data?.data ?? [];
      setCompanies(items);

      const initialCompanyId =
        statusPayload.defaultCompanyId ??
        items[0]?.id ??
        "";
      setSelectedCompanyId(initialCompanyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Whop");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!selectedCompanyId) {
      setCompany(null);
      setProducts([]);
      setPayments([]);
      return;
    }

    let active = true;
    setError("");
    setLoading(true);

    Promise.all([
      whopApi.getCompany(selectedCompanyId),
      whopApi.listProducts(selectedCompanyId),
      whopApi.listPayments(selectedCompanyId),
    ])
      .then(([companyPayload, productsPayload, paymentsPayload]) => {
        if (!active) return;
        setCompany(companyPayload.data ?? null);
        setProducts(productsPayload.data?.data ?? []);
        setPayments(paymentsPayload.data?.data ?? []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load company data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCompanyId]);

  return (
    <section className="whop-page">
      <header className="whop-hero">
        <div>
          <h2>Whop</h2>
          <p>Company app verilerini Whop API uzerinden cek, company sec ve products/payments gor.</p>
        </div>
        <div className={`whop-status ${status.enabled ? "online" : "offline"}`}>
          {status.enabled ? "Configured" : "Not configured"}
        </div>
      </header>

      {error ? <div className="whop-error">{error}</div> : null}

      <div className="whop-toolbar">
        <label>
          Company
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            disabled={!status.enabled || companies.length === 0}
          >
            <option value="">Select company</option>
            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.id})
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => load()} disabled={loading}>
          Refresh
        </button>
      </div>

      {!status.enabled ? (
        <div className="whop-empty">
          `server/.env` icine `WHOP_API_KEY` ekle. Istersen varsayilan company icin `WHOP_DEFAULT_COMPANY_ID` de tanimlayabilirsin.
        </div>
      ) : null}

      {company ? (
        <div className="whop-company-card">
          <div>
            <div className="whop-company-title">{company.title ?? company.name ?? selectedCompanyId}</div>
            <div className="whop-company-meta">Route: {company.route ?? "-"} • Owner: {company.owner_user?.username ?? "-"}</div>
          </div>
          <div className="whop-company-badges">
            <span>{company.verified ? "Verified" : "Unverified"}</span>
            <span>{company.member_count ?? 0} members</span>
          </div>
        </div>
      ) : null}

      <div className="whop-grid">
        <div className="whop-panel">
          <div className="whop-panel-head">
            <h3>Products</h3>
            <span>{products.length}</span>
          </div>
          <table className="whop-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Route</th>
                <th>Visibility</th>
                <th>Members</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.title ?? item.name ?? item.id}</td>
                  <td className="mono">{item.route ?? "-"}</td>
                  <td>{item.visibility ?? "-"}</td>
                  <td>{item.member_count ?? "-"}</td>
                </tr>
              ))}
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="whop-muted">No products</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="whop-panel">
          <div className="whop-panel-head">
            <h3>Payments</h3>
            <span>{payments.length}</span>
          </div>
          <table className="whop-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td>{item.substatus ?? item.status ?? "-"}</td>
                  <td>{money(item.final_amount ?? item.amount, item.currency)}</td>
                  <td className="mono">{item.created_at ?? "-"}</td>
                </tr>
              ))}
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="whop-muted">No payments</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
