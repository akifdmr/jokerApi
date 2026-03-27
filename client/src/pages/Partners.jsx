import React from "react";
import { masterApi } from "../lib/masterApi";
import "./MasterData.css";

export default function Partners() {
  const [form, setForm] = React.useState({ name: "", swift: "", country: "" });
  const [banks, setBanks] = React.useState([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    const response = await masterApi.all();
    setBanks(response.banks ?? []);
  }, []);

  React.useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await masterApi.addBank(form);
      setForm({ name: "", swift: "", country: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <section className="master-page">
      <h2>Banks</h2>
      <form className="master-form" onSubmit={submit}>
        <label>Bank Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>SWIFT<input value={form.swift} onChange={(e) => setForm({ ...form, swift: e.target.value })} /></label>
        <label>Country<input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
        <button type="submit">Add Bank</button>
      </form>
      {error ? <div className="master-error">{error}</div> : null}
      <div className="master-table-wrap">
        <table className="master-table">
          <thead><tr><th>Name</th><th>SWIFT</th><th>Country</th><th>Created</th></tr></thead>
          <tbody>
            {banks.map((item) => (
              <tr key={item.id}><td>{item.name}</td><td>{item.swift ?? "-"}</td><td>{item.country ?? "-"}</td><td>{item.createdAt}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
