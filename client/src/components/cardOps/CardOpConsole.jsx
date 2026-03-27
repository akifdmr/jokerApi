import React from "react";
import "./CardOpConsole.css";

export default function CardOpConsole({
  title,
  fields,
  actionLabel,
  onSubmit,
  onBack,
  transformBeforeSubmit,
}) {
  const [form, setForm] = React.useState(() =>
    Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ""]))
  );
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = typeof transformBeforeSubmit === "function" ? transformBeforeSubmit(form) : form;
      const payload = await onSubmit(data);
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card-op-page">
      <header className="card-op-header">
        <h2>{title}</h2>
        <button type="button" className="card-op-back" onClick={onBack}>
          Back to Card Operations
        </button>
      </header>

      <div className="card-op-grid">
        <div className="card-op-panel">
          <form className="card-op-form" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <React.Fragment key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                {Array.isArray(field.options) ? (
                  <select
                    id={field.name}
                    value={form[field.name] ?? ""}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    required={field.required ?? true}
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    type={field.type ?? "text"}
                    value={form[field.name] ?? ""}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    required={field.required ?? true}
                  />
                )}
              </React.Fragment>
            ))}

            {error ? <p className="card-op-error">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Working..." : actionLabel}
            </button>
          </form>
        </div>

        <div className="card-op-panel">
          <h3 style={{ marginTop: 0, color: "#fff" }}>Response</h3>
          <pre className="card-op-result">{JSON.stringify(result, null, 2) || "No response yet."}</pre>
        </div>
      </div>
    </section>
  );
}
