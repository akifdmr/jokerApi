import React from "react";
import { fetchFinanceResource } from "../lib/financeApi";
import "./DataGridPage.css";

function toDisplayValue(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function DataGridPage({ resource, title }) {
  const [rows, setRows] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let isAlive = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchFinanceResource(resource);
        if (!isAlive) return;
        setRows(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (!isAlive) return;
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        if (isAlive) setIsLoading(false);
      }
    };

    load();
    return () => {
      isAlive = false;
    };
  }, [resource]);

  const columns = React.useMemo(() => {
    const keys = new Set();
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  }, [rows]);

  return (
    <section className="data-grid-page">
      <header className="data-grid-header">
        <h2>{title}</h2>
      </header>

      {isLoading ? <p className="data-grid-state">Loading...</p> : null}
      {error ? <p className="data-grid-error">{error}</p> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <p className="data-grid-state">No data found in MongoDB.</p>
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <div className="data-grid-wrap">
          <table className="data-grid-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${resource}-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={`${resource}-${rowIndex}-${column}`}>
                      {toDisplayValue(row?.[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
