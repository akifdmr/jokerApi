import React from "react";
import { masterApi } from "../lib/masterApi";
import "./MasterData.css";

export default function Transactions() {
  const [form, setForm] = React.useState({ cardId: "", accountId: "", loadedAmount: "", totalAmount: "", status: "success", commissionRate: "" });
  const [notes, setNotes] = React.useState({ topupId: "", note: "" });
  const [topups, setTopups] = React.useState([]);
  const [cards, setCards] = React.useState([]);
  const [accounts, setAccounts] = React.useState([]);
  const [statuses, setStatuses] = React.useState([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    const [all, constants] = await Promise.all([masterApi.all(), masterApi.constants()]);
    setTopups(all.topups ?? []);
    setCards(all.cards ?? []);
    setAccounts(all.accounts ?? []);
    setStatuses(constants.topupStatuses ?? []);
  }, []);

  React.useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const commissionPreview = React.useMemo(() => {
    const loaded = Number(form.loadedAmount || 0);
    const rate = Number(form.commissionRate || 0);
    return Number(((loaded * rate) / 100).toFixed(2));
  }, [form.loadedAmount, form.commissionRate]);

  const submitTopup = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await masterApi.addTopup({
        ...form,
        loadedAmount: Number(form.loadedAmount),
        totalAmount: Number(form.totalAmount),
        commissionRate: Number(form.commissionRate),
      });
      setForm({ cardId: "", accountId: "", loadedAmount: "", totalAmount: "", status: "success", commissionRate: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const submitNote = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await masterApi.addTopupNote(notes.topupId, notes.note);
      setNotes({ topupId: "", note: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <section className="master-page">
      <h2>Card Topups</h2>

      <form className="master-form" onSubmit={submitTopup}>
        <label>
          Card
          <select value={form.cardId} onChange={(e) => setForm({ ...form, cardId: e.target.value })} required>
            <option value="">Select card</option>
            {cards.map((card) => <option key={card.id} value={card.id}>{card.cardNumber}</option>)}
          </select>
        </label>
        <label>
          Account
          <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
            <option value="">Select account</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.id}</option>)}
          </select>
        </label>
        <label>Loaded Amount<input type="number" value={form.loadedAmount} onChange={(e) => setForm({ ...form, loadedAmount: e.target.value })} required /></label>
        <label>Total Amount<input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} required /></label>
        <label>
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label>Loader Rate %<input type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} required /></label>
        <label>Loader Earning Preview<input value={commissionPreview} readOnly /></label>
        <button type="submit">Add Topup</button>
      </form>

      <form className="master-form" onSubmit={submitNote}>
        <label>
          Topup
          <select value={notes.topupId} onChange={(e) => setNotes({ ...notes, topupId: e.target.value })} required>
            <option value="">Select topup</option>
            {topups.map((topup) => <option key={topup.id} value={topup.id}>{topup.id}</option>)}
          </select>
        </label>
        <label style={{ gridColumn: "span 2" }}>Note<input value={notes.note} onChange={(e) => setNotes({ ...notes, note: e.target.value })} required /></label>
        <button type="submit">Add Note</button>
      </form>

      {error ? <div className="master-error">{error}</div> : null}

      <div className="master-table-wrap">
        <table className="master-table">
          <thead>
            <tr>
              <th>ID</th><th>Card</th><th>Account</th><th>Loaded</th><th>Total</th><th>Status</th><th>Rate</th><th>Expected</th><th>Earnings</th><th>History</th><th>Created</th><th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {topups.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{cards.find((card) => card.id === item.cardId)?.cardNumber ?? item.cardId}</td>
                <td>{item.accountId}</td>
                <td>{item.loadedAmount}</td>
                <td>{item.totalAmount}</td>
                <td>{item.status}</td>
                <td>{item.commissionRate}%</td>
                <td>{item.expectedCommission}</td>
                <td>{item.fillerEarnings}</td>
                <td>{(item.noteHistory ?? []).map((note) => `${note.createdAt}: ${note.note}`).join(" | ") || "-"}</td>
                <td>{item.createdAt}</td>
                <td>{item.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
