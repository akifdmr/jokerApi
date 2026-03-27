import React from "react";
import { sepaApi } from "../lib/sepaApi";
import "./Sepa.css";

export default function Sepa() {
  const [companies, setCompanies] = React.useState([]);
  const [ibans, setIbans] = React.useState([]);
  const [mandates, setMandates] = React.useState([]);
  const [error, setError] = React.useState("");

  const [companyForm, setCompanyForm] = React.useState({ name: "", cid: "" });
  const [ibanForm, setIbanForm] = React.useState({ iban: "", holderName: "", companyId: "" });
  const [mandateForm, setMandateForm] = React.useState({
    creditorCompanyId: "",
    debtorCompanyId: "",
    ibanId: "",
    amount: "",
    currency: "EUR",
  });

  const load = React.useCallback(async () => {
    setError("");
    try {
      const [c, i, m] = await Promise.all([
        sepaApi.listCompanies(),
        sepaApi.listIbans(),
        sepaApi.listMandates(),
      ]);
      setCompanies(c.items ?? []);
      setIbans(i.items ?? []);
      setMandates(m.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const addCompany = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await sepaApi.addCompany({
        name: companyForm.name.trim(),
        cid: companyForm.cid.trim() || undefined,
      });
      setCompanyForm({ name: "", cid: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const addIban = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await sepaApi.addIban({
        iban: ibanForm.iban.trim(),
        holderName: ibanForm.holderName.trim(),
        companyId: ibanForm.companyId || undefined,
      });
      setIbanForm({ iban: "", holderName: "", companyId: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const addMandate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await sepaApi.addMandate({
        creditorCompanyId: mandateForm.creditorCompanyId,
        debtorCompanyId: mandateForm.debtorCompanyId,
        ibanId: mandateForm.ibanId,
        amount: Number(mandateForm.amount),
        currency: mandateForm.currency,
      });
      setMandateForm({
        creditorCompanyId: "",
        debtorCompanyId: "",
        ibanId: "",
        amount: "",
        currency: "EUR",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const companyName = (id) => companies.find((c) => c.id === id)?.name ?? id;

  return (
    <section className="sepa-page">
      <header className="sepa-hero">
        <h2>SEPA</h2>
        <p>IBAN listesi ve SDD Core mandate olusturma.</p>
      </header>

      {error ? <div className="sepa-error">{error}</div> : null}

      <div className="sepa-grid">
        <div className="sepa-panel">
          <h3>Sirketler</h3>
          <form className="sepa-form" onSubmit={addCompany}>
            <label>
              Sirket Adi
              <input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
            </label>
            <label>
              CID (opsiyonel)
              <input value={companyForm.cid} onChange={(e) => setCompanyForm({ ...companyForm, cid: e.target.value })} />
            </label>
            <button type="submit">Sirket Ekle</button>
          </form>
          <table className="sepa-table">
            <thead>
              <tr>
                <th>Sirket</th>
                <th>CID</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className={c.cid ? "ok" : "muted"}>{c.cid ?? "CID yok"}</td>
                  <td className="mono">{c.createdAt}</td>
                </tr>
              ))}
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">Kayit yok.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="sepa-panel">
          <h3>IBAN Listesi</h3>
          <form className="sepa-form" onSubmit={addIban}>
            <label>
              IBAN
              <input value={ibanForm.iban} onChange={(e) => setIbanForm({ ...ibanForm, iban: e.target.value })} required />
            </label>
            <label>
              Holder Name
              <input value={ibanForm.holderName} onChange={(e) => setIbanForm({ ...ibanForm, holderName: e.target.value })} required />
            </label>
            <label>
              Sirket
              <select value={ibanForm.companyId} onChange={(e) => setIbanForm({ ...ibanForm, companyId: e.target.value })}>
                <option value="">Sec</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <button type="submit">IBAN Ekle</button>
          </form>
          <table className="sepa-table">
            <thead>
              <tr>
                <th>IBAN</th>
                <th>Holder</th>
                <th>Sirket</th>
              </tr>
            </thead>
            <tbody>
              {ibans.map((i) => (
                <tr key={i.id}>
                  <td className="mono">{i.iban}</td>
                  <td>{i.holderName}</td>
                  <td>{i.companyId ? companyName(i.companyId) : "-"}</td>
                </tr>
              ))}
              {ibans.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">Kayit yok.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sepa-panel">
        <h3>SDD Core Mandate</h3>
        <form className="sepa-form wide" onSubmit={addMandate}>
          <label>
            Odeme Yapacak Sirket (Debtor)
            <select value={mandateForm.debtorCompanyId} onChange={(e) => setMandateForm({ ...mandateForm, debtorCompanyId: e.target.value })} required>
              <option value="">Sec</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Odeme Alacak Sirket (Creditor)
            <select value={mandateForm.creditorCompanyId} onChange={(e) => setMandateForm({ ...mandateForm, creditorCompanyId: e.target.value })} required>
              <option value="">Sec</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.cid ? ` (CID: ${c.cid})` : " (CID yok)"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Debtor IBAN
            <select value={mandateForm.ibanId} onChange={(e) => setMandateForm({ ...mandateForm, ibanId: e.target.value })} required>
              <option value="">Sec</option>
              {ibans.map((i) => (
                <option key={i.id} value={i.id}>{i.iban} ({i.holderName})</option>
              ))}
            </select>
          </label>
          <label>
            Odeme Miktari
            <input type="number" value={mandateForm.amount} onChange={(e) => setMandateForm({ ...mandateForm, amount: e.target.value })} required />
          </label>
          <label>
            Para Birimi
            <input value={mandateForm.currency} onChange={(e) => setMandateForm({ ...mandateForm, currency: e.target.value })} required />
          </label>
          <button type="submit">Mandate Olustur</button>
        </form>
        <table className="sepa-table">
          <thead>
            <tr>
              <th>Mandate Code</th>
              <th>Creditor</th>
              <th>Debtor</th>
              <th>IBAN</th>
              <th>Amount</th>
              <th>CID</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {mandates.map((m) => (
              <tr key={m.id}>
                <td className="mono">{m.code}</td>
                <td>{m.payeeCompanyName}</td>
                <td>{m.payerCompanyName}</td>
                <td className="mono">{ibans.find((i) => i.id === m.ibanId)?.iban ?? "-"}</td>
                <td>{m.amount} {m.currency}</td>
                <td className="mono">{m.cid}</td>
                <td className="mono">{m.createdAt}</td>
              </tr>
            ))}
            {mandates.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">Kayit yok.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

