import React from "react";
import { masterApi } from "../lib/masterApi";
import "./MasterData.css";

export default function Customers() {
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    isSystem: false,
    username: "",
    password: "",
  });
  const [people, setPeople] = React.useState([]);
  const [systemUsers, setSystemUsers] = React.useState([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    const response = await masterApi.all();
    setPeople(response.people ?? []);
    setSystemUsers(response.systemUsers ?? []);
  }, []);

  React.useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await masterApi.addPerson(form);
      setForm({ firstName: "", lastName: "", phone: "", address: "", city: "", state: "", zip: "", isSystem: false, username: "", password: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const systemUserByPersonId = (personId) => systemUsers.find((user) => user.personId === personId)?.username ?? "-";

  return (
    <section className="master-page">
      <h2>People</h2>
      <form className="master-form" onSubmit={submit}>
        <label>First Name<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
        <label>Last Name<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
        <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        <label>City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
        <label>State<input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></label>
        <label>ZIP<input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} /></label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={form.isSystem}
            onChange={(e) => setForm({ ...form, isSystem: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          ISsystem User
        </label>

        {form.isSystem ? (
          <>
            <label>Login Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></label>
            <label>Login Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          </>
        ) : null}

        <button type="submit">Add Person</button>
      </form>
      {error ? <div className="master-error">{error}</div> : null}
      <div className="master-table-wrap">
        <table className="master-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Address</th><th>ISsystem Username</th><th>Created</th></tr></thead>
          <tbody>
            {people.map((item) => (
              <tr key={item.id}>
                <td>{item.firstName} {item.lastName}</td>
                <td>{item.phone ?? "-"}</td>
                <td>{[item.address, item.city, item.state, item.zip].filter(Boolean).join(", ") || "-"}</td>
                <td>{systemUserByPersonId(item.id)}</td>
                <td>{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
