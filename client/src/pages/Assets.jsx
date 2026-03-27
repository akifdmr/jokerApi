import React from "react";
import { masterApi } from "../lib/masterApi";
import {
  formatCardNumberMasked,
  monthOptions,
  normalizeCardNumber,
  yearOptions,
} from "../lib/cardFormat";
import "./MasterData.css";

export default function Assets() {
  const months = monthOptions();
  const years = yearOptions();
  const [templateForm, setTemplateForm] = React.useState({ templateName: "", bankId: "", address: "", city: "", state: "", zip: "" });
  const [form, setForm] = React.useState({
    templateId: "",
    cardNumber: "",
    expiryMonth: months[0]?.value ?? "01",
    expiryYear: years[0]?.value ?? String(new Date().getFullYear()),
    cvv: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    holderPersonId: "",
    bankId: "",
  });
  const [cards, setCards] = React.useState([]);
  const [templates, setTemplates] = React.useState([]);
  const [people, setPeople] = React.useState([]);
  const [banks, setBanks] = React.useState([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    const response = await masterApi.all();
    setCards(response.cards ?? []);
    setTemplates(response.cardTemplates ?? []);
    setPeople(response.people ?? []);
    setBanks(response.banks ?? []);
  }, []);

  React.useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const submitTemplate = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await masterApi.addCardTemplate(templateForm);
      setTemplateForm({ templateName: "", bankId: "", address: "", city: "", state: "", zip: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const applyTemplate = (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    setForm((prev) => ({
      ...prev,
      templateId,
      bankId: template.bankId,
      address: template.address,
      city: template.city,
      state: template.state,
      zip: template.zip,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await masterApi.addCard({
        cardNumber: normalizeCardNumber(form.cardNumber),
        expiryMonth: form.expiryMonth,
        expiryYear: form.expiryYear,
        cvv: form.cvv,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        holderPersonId: form.holderPersonId,
        bankId: form.bankId,
      });
      setForm({
        templateId: "",
        cardNumber: "",
        expiryMonth: months[0]?.value ?? "01",
        expiryYear: years[0]?.value ?? String(new Date().getFullYear()),
        cvv: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        holderPersonId: "",
        bankId: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const personName = (id) => {
    const person = people.find((p) => p.id === id);
    return person ? `${person.firstName} ${person.lastName}` : id;
  };

  const bankName = (id) => banks.find((b) => b.id === id)?.name ?? id;

  return (
    <section className="master-page">
      <h2>Card Templates</h2>
      <form className="master-form" onSubmit={submitTemplate}>
        <label>Template Name<input value={templateForm.templateName} onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })} required /></label>
        <label>
          Bank
          <select value={templateForm.bankId} onChange={(e) => setTemplateForm({ ...templateForm, bankId: e.target.value })} required>
            <option value="">Select bank</option>
            {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
          </select>
        </label>
        <label>Address<input value={templateForm.address} onChange={(e) => setTemplateForm({ ...templateForm, address: e.target.value })} required /></label>
        <label>City<input value={templateForm.city} onChange={(e) => setTemplateForm({ ...templateForm, city: e.target.value })} required /></label>
        <label>State<input value={templateForm.state} onChange={(e) => setTemplateForm({ ...templateForm, state: e.target.value })} required /></label>
        <label>ZIP<input value={templateForm.zip} onChange={(e) => setTemplateForm({ ...templateForm, zip: e.target.value })} required /></label>
        <button type="submit">Add Template</button>
      </form>

      <h2>Cards</h2>
      <form className="master-form" onSubmit={submit}>
        <label>
          Card Template
          <select value={form.templateId} onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">Manual entry</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.templateName}</option>)}
          </select>
        </label>
        <label>
          Card Number
          <input
            value={form.cardNumber}
            onChange={(e) => setForm({ ...form, cardNumber: formatCardNumberMasked(e.target.value) })}
            placeholder="1234 5678 9012 3456 / 3782 822463 10005"
            required
          />
        </label>
        <label>
          Expiry Month
          <select value={form.expiryMonth} onChange={(e) => setForm({ ...form, expiryMonth: e.target.value })} required>
            {months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
        </label>
        <label>
          Expiry Year
          <select value={form.expiryYear} onChange={(e) => setForm({ ...form, expiryYear: e.target.value })} required>
            {years.map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
          </select>
        </label>
        <label>CVV<input value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} required /></label>
        <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></label>
        <label>City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></label>
        <label>State<input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required /></label>
        <label>ZIP<input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required /></label>
        <label>
          Holder
          <select value={form.holderPersonId} onChange={(e) => setForm({ ...form, holderPersonId: e.target.value })} required>
            <option value="">Select person</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
          </select>
        </label>
        <label>
          Bank
          <select value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })} required>
            <option value="">Select bank</option>
            {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
          </select>
        </label>
        <button type="submit">Add Card</button>
      </form>
      {error ? <div className="master-error">{error}</div> : null}
      <div className="master-table-wrap">
        <table className="master-table">
          <thead><tr><th>Card</th><th>Expiry</th><th>Holder</th><th>Bank</th><th>Address</th><th>Created</th></tr></thead>
          <tbody>
            {cards.map((item) => (
              <tr key={item.id}>
                <td>{item.cardNumber}</td>
                <td>{item.expiryMonth}/{item.expiryYear}</td>
                <td>{personName(item.holderPersonId)}</td>
                <td>{bankName(item.bankId)}</td>
                <td>{item.address}, {item.city}, {item.state} {item.zip}</td>
                <td>{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
