import React from "react";
import { fraudApi } from "../lib/fraudApi";
import "./FraudManager.css";

function JsonEditor({ value, onChange }) {
  return (
    <textarea
      className="fraud-json"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck="false"
    />
  );
}

export default function FraudManager() {
  const [rulesText, setRulesText] = React.useState("");
  const [events, setEvents] = React.useState([]);
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rulesResp, eventsResp] = await Promise.all([fraudApi.getRules(), fraudApi.listEvents(200)]);
      setRulesText(JSON.stringify(rulesResp.rules, null, 2));
      setEvents(Array.isArray(eventsResp.items) ? eventsResp.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setStatus("");
    setError("");
    try {
      const parsed = JSON.parse(rulesText);
      const resp = await fraudApi.setRules(parsed);
      setRulesText(JSON.stringify(resp.rules, null, 2));
      setStatus("Saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <section className="fraud-page">
      <header className="fraud-hero">
        <h2>Fraud Management</h2>
        <p>Kuralları (profiles + rules) güncelle ve son fraud kararlarını izle.</p>
      </header>

      {loading ? <div className="fraud-note">Loading…</div> : null}
      {error ? <div className="fraud-error">{error}</div> : null}
      {status ? <div className="fraud-ok">{status}</div> : null}

      <div className="fraud-grid">
        <div className="fraud-panel">
          <div className="fraud-panel-head">
            <h3>Rules JSON</h3>
            <div className="fraud-actions">
              <button type="button" onClick={load}>Reload</button>
              <button type="button" className="fraud-primary" onClick={save}>Save</button>
            </div>
          </div>
          <JsonEditor value={rulesText} onChange={setRulesText} />
          <div className="fraud-hint">
            Not: Profile seçimi için onramp create order body’sine `fraudProfileId` (örn: `default`, `mcc_7011`) gönderebilirsin.
          </div>
        </div>

        <div className="fraud-panel">
          <div className="fraud-panel-head">
            <h3>Recent Decisions</h3>
            <button type="button" onClick={load}>Refresh</button>
          </div>
          <div className="fraud-table-wrap">
            <table className="fraud-table">
              <thead>
                <tr>
                  <th>At</th>
                  <th>Stage</th>
                  <th>Profile</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Action</th>
                  <th>Rule</th>
                  <th>Ref</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.at}</td>
                    <td className="mono">{e.stage}</td>
                    <td className="mono">{e.context?.profileId ?? "default"}</td>
                    <td className="mono">{e.context?.paymentMethod ?? "-"}</td>
                    <td className="mono">{e.context?.amount ?? "-"}</td>
                    <td className="mono">{e.context?.currencyIsoCode ?? "-"}</td>
                    <td className="mono">{e.decision?.action ?? "-"}</td>
                    <td className="mono">{e.decision?.ruleId ?? "-"}</td>
                    <td className="mono">{e.paymentReference ?? "-"}</td>
                  </tr>
                ))}
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="fraud-empty">No events.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

