import React from "react";
import { masterApi } from "../../lib/masterApi";
import { balanceCheckerApi } from "../../lib/balanceCheckerApi";
import "../../components/cardOps/CardOpConsole.css";
import { cardOperationsHomePath, getProcessorFromQuery } from "./processorQuery";

function phaseLabel(phase) {
  if (phase === "bubble-sort") return "bubble";
  if (phase === "binary-search") return "binary";
  if (phase === "discovery") return "discovery";
  if (phase === "summary") return "summary";
  return "-";
}

export default function SmartBalanceCheckerPage({ onNavigate }) {
  const [cards, setCards] = React.useState([]);
  const [providers, setProviders] = React.useState([]);
  const [form, setForm] = React.useState(() => ({
    cardId: "",
    provider: getProcessorFromQuery("us-bank"),
    initialAmount: "2500",
    maxRequests: "12",
  }));
  const [run, setRun] = React.useState(null);
  const [activeRuns, setActiveRuns] = React.useState([]);
  const [details, setDetails] = React.useState([]);
  const [results, setResults] = React.useState([]);
  const [latestResult, setLatestResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const mergedActiveRuns = React.useMemo(() => {
    const runningFromApi = activeRuns ?? [];
    if (!run || run.status !== "running") return runningFromApi;
    if (runningFromApi.some((item) => item.id === run.id)) return runningFromApi;
    return [run, ...runningFromApi];
  }, [activeRuns, run]);

  React.useEffect(() => {
    masterApi
      .all()
      .then((res) => {
        setCards(res.cards ?? []);
      })
      .catch((err) => setError(err.message));
  }, []);

  React.useEffect(() => {
    balanceCheckerApi
      .listProviders()
      .then((res) => setProviders(res.items ?? []))
      .catch(() => setProviders([]));
  }, []);

  React.useEffect(() => {
    let timer;
    const fetchData = async () => {
      try {
        const [runsResponse, resultsResponse] = await Promise.all([
          balanceCheckerApi.listRuns(),
          balanceCheckerApi.listResults(),
        ]);
        const running = (runsResponse.items ?? []).filter((item) => item.status === "running");
        setActiveRuns(running);
        setResults(resultsResponse.items ?? []);
      } catch {
        // no-op
      }
    };

    fetchData();
    timer = setInterval(fetchData, 2000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (!run?.id) return;

    const timer = setInterval(async () => {
      try {
        const snapshot = await balanceCheckerApi.getRun(run.id);
        setRun(snapshot.header);
        setDetails(snapshot.details ?? []);
        setLatestResult(snapshot.result ?? null);

        const [runsResponse, resultsResponse] = await Promise.all([
          balanceCheckerApi.listRuns(),
          balanceCheckerApi.listResults(),
        ]);
        setActiveRuns((runsResponse.items ?? []).filter((item) => item.status === "running"));
        setResults(resultsResponse.items ?? []);

        if (!snapshot.active) clearInterval(timer);
      } catch {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [run?.id]);

  const start = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await balanceCheckerApi.startRun({
        cardId: form.cardId,
        provider: form.provider,
        initialAmount: Number(form.initialAmount),
        maxRequests: Number(form.maxRequests),
      });
      setRun(response.run);
      setActiveRuns((prev) => {
        const next = prev ?? [];
        if (next.some((item) => item.id === response.run.id)) return next;
        return [response.run, ...next];
      });
      setDetails([]);
      setLatestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setLoading(false);
    }
  };

  const rowColor = (level) => {
    if (level === "success") return "#8dffb3";
    if (level === "warn") return "#ffd48d";
    if (level === "error") return "#ff9898";
    return "#d5e3fb";
  };

  const detailRowStyle = (outcome) => {
    if (outcome === "approved") return { background: "rgba(38, 152, 82, 0.18)" };
    if (outcome === "declined") return { background: "rgba(213, 145, 35, 0.18)" };
    if (outcome === "error") return { background: "rgba(190, 57, 57, 0.2)" };
    if (outcome === "failed") return { background: "rgba(190, 57, 57, 0.2)" };
    return {};
  };

  const displayedResults = latestResult
    ? [latestResult, ...results.filter((item) => item.runId !== latestResult.runId)]
    : results;

  const providerOptions = providers.length > 0 ? providers : [{ value: "us-bank", label: "US Bank" }];

  return (
    <section className="card-op-page">
      <header className="card-op-header">
        <h2>Smart Balance Checker</h2>
        <button type="button" className="card-op-back" onClick={() => onNavigate(cardOperationsHomePath())}>
          Back to Card Operations
        </button>
      </header>

      <div className="card-op-panel">
        <div className="card-op-form" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <label>
            Card
            <select value={form.cardId} onChange={(e) => setForm({ ...form, cardId: e.target.value })}>
              <option value="">Select card</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.cardNumber}
                </option>
              ))}
            </select>
          </label>
          <label>
            Provider
            <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
              {providerOptions.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Initial Amount (USD)
            <input
              type="number"
              value={form.initialAmount}
              onChange={(e) => setForm({ ...form, initialAmount: e.target.value })}
            />
          </label>
          <label>
            Max Requests
            <input
              type="number"
              value={form.maxRequests}
              onChange={(e) => setForm({ ...form, maxRequests: e.target.value })}
            />
          </label>
          <button type="button" onClick={start} disabled={loading || !form.cardId}>
            {loading ? "Starting..." : "Start Smart Check"}
          </button>
        </div>
      </div>

      {error ? <p className="card-op-error">{error}</p> : null}

      <div className="card-op-panel">
        <h3 style={{ marginTop: 0, color: "#fff" }}>Ongoing Processes</h3>
        {loading ? (
          <div className="bal-loader-row">
            <span className="bal-loader-dot" />
            <span>Starting balance process...</span>
          </div>
        ) : mergedActiveRuns.length === 0 ? (
          <p style={{ margin: 0, color: "#c7d8f6" }}>No running balance process.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {mergedActiveRuns.map((item) => (
              <div key={item.id} className="bal-loader-row">
                <span className="bal-loader-dot" />
                <span>
                  {item.id} | {item.providerLabel ?? item.provider} | requests={item.requestCount} | approved={item.approvedCount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-op-grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="card-op-panel">
          <h3 style={{ marginTop: 0, color: "#fff" }}>Live Console</h3>
          <div className="card-op-terminal">
            <div className="card-op-terminal__toolbar">
              <span className="card-op-terminal__dot card-op-terminal__dot--red" />
              <span className="card-op-terminal__dot card-op-terminal__dot--yellow" />
              <span className="card-op-terminal__dot card-op-terminal__dot--green" />
              <span className="card-op-terminal__title">balance-checker@console</span>
            </div>
            <div className="card-op-terminal__body">
              {details.length === 0 ? "No log yet." : null}
              {details.map((line) => (
                <div key={line.id} className="card-op-terminal__line" style={{ color: rowColor(line.level) }}>
                  <span className="card-op-terminal__phase">[{phaseLabel(line.phase)}]</span>
                  <span>{line.cardMasked}</span>
                  <span>{line.providerLabel ?? line.provider}</span>
                  <span>{line.attemptedAmount ? `${line.attemptedAmount} USD` : "--"}</span>
                  <span>{line.outcome.toUpperCase()}</span>
                  <span>{line.transactionId ?? line.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-op-panel" style={{ overflow: "auto" }}>
          <h3 style={{ marginTop: 0, color: "#fff" }}>Header Table</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#d5e3fb" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Run ID</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Provider</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Status</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Requests</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Approved</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Total Limit</th>
              </tr>
            </thead>
            <tbody>
              {run ? (
                <tr>
                  <td style={{ padding: 8 }}>{run.id}</td>
                  <td style={{ padding: 8 }}>{run.providerLabel ?? run.provider}</td>
                  <td style={{ padding: 8 }}>{run.status}</td>
                  <td style={{ padding: 8 }}>{run.requestCount}</td>
                  <td style={{ padding: 8 }}>{run.approvedCount}</td>
                  <td style={{ padding: 8 }}>{run.totalApprovedLimit}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="card-op-panel" style={{ overflow: "auto" }}>
          <h3 style={{ marginTop: 0, color: "#fff" }}>Detail Table</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#d5e3fb" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Step</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Phase</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Card</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Provider</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Attempt</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Outcome</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Added</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Cumulative</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Tx</th>
              </tr>
            </thead>
            <tbody>
              {details.map((item) => (
                <tr key={item.id} style={detailRowStyle(item.outcome)}>
                  <td style={{ padding: 8 }}>{item.stepNo}</td>
                  <td style={{ padding: 8 }}>{phaseLabel(item.phase)}</td>
                  <td style={{ padding: 8 }}>{item.cardMasked}</td>
                  <td style={{ padding: 8 }}>{item.providerLabel ?? item.provider}</td>
                  <td style={{ padding: 8 }}>{item.attemptedAmount}</td>
                  <td style={{ padding: 8 }}>{item.outcome}</td>
                  <td style={{ padding: 8 }}>{item.addedAmount}</td>
                  <td style={{ padding: 8 }}>{item.cumulativeApproved}</td>
                  <td style={{ padding: 8 }}>{item.transactionId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-op-panel" style={{ overflow: "auto" }}>
          <h3 style={{ marginTop: 0, color: "#fff" }}>Balance Result Table</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#d5e3fb" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Run ID</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Card</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Expiry</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Provider</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Estimated Balance</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #2c4162", padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedResults.map((item) => (
                <tr key={item.id} style={detailRowStyle(item.status)}>
                  <td style={{ padding: 8 }}>{item.runId}</td>
                  <td style={{ padding: 8 }}>{item.cardMasked}</td>
                  <td style={{ padding: 8 }}>
                    {item.expiryMonth}/{item.expiryYear}
                  </td>
                  <td style={{ padding: 8 }}>{item.providerLabel ?? item.provider}</td>
                  <td style={{ padding: 8 }}>
                    {item.estimatedBalance} {item.currency}
                  </td>
                  <td style={{ padding: 8 }}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
