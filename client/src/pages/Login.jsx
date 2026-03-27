import React from "react";
import { loginApi } from "../lib/authApi";
import "./Login.css";

const trustItems = [
  "PCI-focused processing workflow",
  "NMI processor module-ready architecture",
  "Audit-friendly operation history",
];

export default function Login({ onAuthenticate }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const session = await loginApi(username, password);
      onAuthenticate(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-screen">
      <div className="login-overlay" />
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-chip">Secure Treasury Access</span>
          <h1>Payment Manager Console</h1>
          <p>Control card operations, settlement health and partner transactions from one panel.</p>

          <div className="brand-metrics">
            <div>
              <strong>99.98%</strong>
              <span>Platform uptime</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Risk monitoring</span>
            </div>
            <div>
              <strong>6 Modules</strong>
              <span>Card operation flow</span>
            </div>
          </div>

          <ul className="trust-list">
            {trustItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. admin.ops"
            autoComplete="username"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" disabled={loading}>{loading ? "Signing In..." : "Sign In"}</button>
        </form>
      </div>
    </section>
  );
}
