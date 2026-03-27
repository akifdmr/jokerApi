import React from "react";
import { escVitrinApi } from "../lib/escVitrinApi";
import "./EscVitrinManage.css";

const TYPE_LABELS = {
  tipbox: "Tip Box (iframe)",
  content_widget: "Content Widget (script)",
  iframe: "Iframe",
};

export default function EscVitrinManage() {
  const [items, setItems] = React.useState([]);
  const [types, setTypes] = React.useState(["tipbox", "content_widget", "iframe"]);
  const [error, setError] = React.useState("");
  const [editingId, setEditingId] = React.useState("");
  const [previewId, setPreviewId] = React.useState("");
  const [form, setForm] = React.useState({
    header: "",
    type: "tipbox",
    content: "",
    width: "",
    height: "",
  });

  const load = React.useCallback(async () => {
    const data = await escVitrinApi.list();
    setItems(data.items ?? []);
    setTypes(data.types ?? ["tipbox", "content_widget", "iframe"]);
  }, []);

  React.useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        header: form.header.trim(),
        type: form.type,
        content: form.content.trim(),
        width: form.width ? Number(form.width) : undefined,
        height: form.height ? Number(form.height) : undefined,
      };

      if (editingId) {
        await escVitrinApi.update(editingId, payload);
      } else {
        await escVitrinApi.add(payload);
      }

      setEditingId("");
      setForm({ header: "", type: types[0] ?? "tipbox", content: "", width: "", height: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const remove = async (id) => {
    setError("");
    try {
      await escVitrinApi.remove(id);
      setPreviewId((current) => (current === id ? "" : current));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const contentHint =
    form.type === "content_widget"
      ? "Script URL (e.g. https://iwantclips.com/content_widget/widget_js/1918149)"
      : "Iframe URL (e.g. https://iwantclips.com/model/promotional_tool/...)";

  const showSize = form.type !== "content_widget";

  function PreviewIframe({ title, src, width = 250, defaultHeight = 560 }) {
    const iframeRef = React.useRef(null);
    const [height, setHeight] = React.useState(defaultHeight);

    React.useEffect(() => {
      const handler = (event) => {
        if (!iframeRef.current) return;
        if (event.source !== iframeRef.current.contentWindow) return;

        const nextHeight = Number(event?.data?.height);
        if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
        setHeight(nextHeight);
      };

      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }, []);

    const onLoad = () => {
      try {
        iframeRef.current?.contentWindow?.postMessage({ ready: true }, "*");
      } catch {
        // ignore
      }
    };

    return (
      <div className="esc-manage-preview-body">
        <iframe
          ref={iframeRef}
          className="esc-manage-preview-frame"
          title={title}
          src={src}
          width={width}
          height={height}
          frameBorder="0"
          marginWidth="0"
          marginHeight="0"
          scrolling="no"
          onLoad={onLoad}
        />
      </div>
    );
  }

  function PreviewContentWidget({ scriptSrc }) {
    const rootRef = React.useRef(null);

    React.useEffect(() => {
      const root = rootRef.current;
      if (!root) return undefined;

      root.innerHTML = "";
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      root.appendChild(script);

      return () => {
        root.innerHTML = "";
      };
    }, [scriptSrc]);

    return (
      <div className="esc-manage-preview-body">
        <div ref={rootRef} />
      </div>
    );
  }

  return (
    <section className="esc-manage">
      <header className="esc-manage-hero">
        <h1>ESC Vitrin Manager</h1>
        <p>Header + content + type ekle, güncelle veya listeden sil. Gösterim: /esc-vitrin</p>
      </header>

      <form className="esc-manage-form" onSubmit={submit}>
        <label>
          Header
          <input
            value={form.header}
            onChange={(e) => setForm({ ...form, header: e.target.value })}
            placeholder="Başlık"
            required
          />
        </label>

        <label>
          Type
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
            {types.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type] ?? type}
              </option>
            ))}
          </select>
        </label>

        <label>
          Content
          <input
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder={contentHint}
            required
          />
        </label>

        {showSize ? (
          <label>
            Width (optional)
            <input
              type="number"
              value={form.width}
              onChange={(e) => setForm({ ...form, width: e.target.value })}
              placeholder="150"
              min="1"
            />
          </label>
        ) : null}

        {showSize ? (
          <label>
            Height (optional)
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              placeholder="35"
              min="1"
            />
          </label>
        ) : null}

        <button type="submit">{editingId ? "Update Item" : "Add Item"}</button>
        {editingId ? (
          <button
            type="button"
            onClick={() => {
              setEditingId("");
              setForm({ header: "", type: types[0] ?? "tipbox", content: "", width: "", height: "" });
            }}
          >
            Cancel
          </button>
        ) : null}
      </form>

      {error ? <div className="esc-manage-error">{error}</div> : null}

      <table className="esc-manage-table">
        <thead>
          <tr>
            <th>Header</th>
            <th>Type</th>
            <th>Content</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isPreviewOpen = previewId === item.id;
            return (
              <React.Fragment key={item.id}>
                <tr>
                  <td>{item.header}</td>
                  <td>{TYPE_LABELS[item.type] ?? item.type}</td>
                  <td className="esc-manage-mono">{item.content}</td>
                  <td className="esc-manage-mono">{item.createdAt}</td>
                  <td>
                    <div className="esc-manage-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewId((current) => (current === item.id ? "" : item.id));
                        }}
                      >
                        {isPreviewOpen ? "Hide Preview" : "Preview"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            header: item.header ?? "",
                            type: item.type ?? "tipbox",
                            content: item.content ?? "",
                            width: item.width ? String(item.width) : "",
                            height: item.height ? String(item.height) : "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className="esc-manage-danger" onClick={() => remove(item.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {isPreviewOpen ? (
                  <tr className="esc-manage-preview-row">
                    <td colSpan={5}>
                      <div className="esc-manage-preview">
                        <div className="esc-manage-preview-head">
                          <div>
                            <div className="esc-manage-preview-title">{item.header ?? "Preview"}</div>
                            <div className="esc-manage-preview-sub">
                              {TYPE_LABELS[item.type] ?? item.type} •{" "}
                              <a className="esc-manage-preview-link" href={item.content} target="_blank" rel="noreferrer">
                                open source
                              </a>
                            </div>
                          </div>
                          <button type="button" onClick={() => setPreviewId("")}>
                            Close
                          </button>
                        </div>

                        {item.type === "content_widget" ? (
                          <PreviewContentWidget scriptSrc={item.content} />
                        ) : (
                          <PreviewIframe
                            title={item.header ?? "Preview"}
                            src={item.content}
                            width={Number(item.width) > 0 ? Number(item.width) : 250}
                            defaultHeight={Number(item.height) > 0 ? Number(item.height) : 560}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 16, color: "rgba(255,255,255,0.7)" }}>
                No items yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
