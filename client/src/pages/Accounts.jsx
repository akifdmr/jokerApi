import React from "react";
import { masterApi } from "../lib/masterApi";
import "./MasterData.css";

export default function Accounts() {
  const [form, setForm] = React.useState({
    bankId: "",
    accountOwnership: "personal",
    accountType: "checking",
    balance: "",
    companyName: "",
    firstName: "",
    lastName: "",
    address: "",
    contactInfo: "",
  });
  const [accounts, setAccounts] = React.useState([]);
  const [banks, setBanks] = React.useState([]);
  const [accountTypes, setAccountTypes] = React.useState([]);
  const [accountOwnerships, setAccountOwnerships] = React.useState([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    const [all, constants] = await Promise.all([masterApi.all(), masterApi.constants()]);
    setAccounts(all.accounts ?? []);
    setBanks(all.banks ?? []);
    setAccountTypes(constants.accountTypes ?? []);
    setAccountOwnerships(constants.accountOwnerships ?? []);
  }, []);

  React.useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await masterApi.addAccount({
        ...form,
        balance: Number(form.balance),
      });
      setForm({
        bankId: "",
        accountOwnership: accountOwnerships[0] ?? "personal",
        accountType: accountTypes[0] ?? "checking",
        balance: "",
        companyName: "",
        firstName: "",
        lastName: "",
        address: "",
        contactInfo: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const ownerLabel = (item) => {
    if (item.accountOwnership === "business") {
      return item.companyName ?? item.ownerPersonId ?? "-";
    }
    if (item.firstName || item.lastName) {
      return `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "-";
    }
    return item.ownerPersonId ?? "-";
  };

  return (
    <section className="master-page">
      <h2>Accounts</h2>
      <form className="master-form" onSubmit={submit}>
        <label>
          Bank
          <select value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })} required>
            <option value="">Select bank</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>{bank.name}</option>
            ))}
          </select>
        </label>
        <label>
          Ownership
          <select value={form.accountOwnership} onChange={(e) => setForm({ ...form, accountOwnership: e.target.value })} required>
            {accountOwnerships.map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </select>
        </label>
        {form.accountOwnership === "business" ? (
          <>
            <label>Company Name<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required /></label>
            <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></label>
            <label>Contact Info<input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} required /></label>
          </>
        ) : (
          <>
            <label>First Name<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
            <label>Last Name<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
            <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></label>
            <label>Contact Info<input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} required /></label>
          </>
        )}
        <label>
          Account Type
          <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} required>
            {accountTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>Balance<input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} required /></label>
        <button type="submit">Add Account</button>
      </form>
      {error ? <div className="master-error">{error}</div> : null}
      <div className="master-table-wrap">
        <table className="master-table">
          <thead>
            <tr>
              <th>Bank</th><th>Owner</th><th>Address</th><th>Contact</th><th>Ownership</th><th>Type</th><th>Balance</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((item) => (
              <tr key={item.id}>
                <td>{banks.find((b) => b.id === item.bankId)?.name ?? item.bankId}</td>
                <td>{ownerLabel(item)}</td>
                <td>{item.address ?? "-"}</td>
                <td>{item.contactInfo ?? "-"}</td>
                <td>{item.accountOwnership ?? "personal"}</td>
                <td>{item.accountType}</td>
                <td>{item.balance}</td>
                <td>{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
