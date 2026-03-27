import React from "react";
import { nmiApi } from "../../lib/nmiApi";
import "../../components/cardOps/CardOpConsole.css";
import { cardOperationsHomePath } from "./processorQuery";

export default function TransactionListPage({ onNavigate }) {
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await nmiApi.transactions();
      setItems(Array.isArray(response.items) ? response.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  return (
    <section className="card-op-page">
      <header className="card-op-header">
        <h2>Transaction List</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="card-op-back" onClick={load}>
            Refresh
          </button>
          <button type="button" className="card-op-back" onClick={() => onNavigate(cardOperationsHomePath())}>
            Back to Card Operations
          </button>
        </div>
      </header>

      {loading ? <p style={{ color: "#c7d8f6" }}>Loading...</p> : null}
      {error ? <p className="card-op-error">{error}</p> : null}

      <div className="card-op-panel" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#d5e3fb" }}>
          <thead>
            <tr>
              {[
                "id",
                "transactionId",
                "processor",
                "operation",
                "status",
                "amount",
                "currency",
                "panMasked",
                "updatedAt",
              ].map((column) => (
                <th key={column} style={{ borderBottom: "1px solid #2c4162", padding: 10, textAlign: "left" }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.id}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.transactionId ?? "-"}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.processor ?? "-"}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.operation}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.status}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.amount ?? "-"}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.currency ?? "-"}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.panMasked ?? "-"}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #1d2f4b" }}>{item.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
