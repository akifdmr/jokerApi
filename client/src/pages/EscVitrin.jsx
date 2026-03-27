import React from "react";
import "./EscVitrin.css";
import { escVitrinApi } from "../lib/escVitrinApi";

function PromoFrame({ title, tag, src, width = 250, defaultHeight = 560 }) {
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
    // Equivalent of: frames.iwcframe.postMessage({ready:true}, '*')
    try {
      iframeRef.current?.contentWindow?.postMessage({ ready: true }, "*");
    } catch {
      // ignore
    }
  };

  return (
    <article className="esc-vitrin-card">
      <header className="esc-vitrin-card-header">
        <h3 className="esc-vitrin-card-title">{title}</h3>
        {tag ? <span className="esc-vitrin-card-chip">{tag}</span> : null}
      </header>
      <div className="esc-vitrin-frame-wrap">
        <iframe
          ref={iframeRef}
          className="esc-vitrin-frame"
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
    </article>
  );
}

function ContentWidget({ title, tag, scriptSrc }) {
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    // Ensure re-mounting doesn't duplicate widgets.
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
    <article className="esc-vitrin-card">
      <header className="esc-vitrin-card-header">
        <h3 className="esc-vitrin-card-title">{title}</h3>
        {tag ? <span className="esc-vitrin-card-chip">{tag}</span> : null}
      </header>
      <div className="esc-vitrin-frame-wrap">
        <div ref={rootRef} />
      </div>
    </article>
  );
}

export default function EscVitrin() {
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    escVitrinApi
      .list()
      .then((data) => {
        if (!alive) return;
        setItems(data.items ?? []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="esc-vitrin">
      <header className="esc-vitrin-hero">
        <h1>ESC Vitrin</h1>
        <p>Iframe vitrinleri kutucuklar halinde listelenir. Yükseklik mesaj ile otomatik ayarlanır.</p>
      </header>

      {error ? <div style={{ color: "#ff9f9f", fontWeight: 700 }}>{error}</div> : null}

      <div className="esc-vitrin-grid">
        {items.map((item) =>
          item.type === "content_widget" ? (
            <ContentWidget key={item.id} title={item.header} tag={item.type} scriptSrc={item.content} />
          ) : (
            <PromoFrame
              key={item.id}
              title={item.header}
              tag={item.type}
              src={item.content}
              width={Number(item.width) > 0 ? Number(item.width) : 250}
              defaultHeight={Number(item.height) > 0 ? Number(item.height) : 560}
            />
          )
        )}
      </div>
    </section>
  );
}
