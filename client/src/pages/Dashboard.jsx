import React from "react";
import { fetchFinanceResource } from "../lib/financeApi";
import "./Dashboard.css";
import { CardIcon, EscIcon, FinanceIcon, HistoryIcon, PosIcon, UsBankIcon } from "../components/Icons.jsx";

function MetricCard({ label, value, unit, currency }) {
  const displayValue =
    typeof value === "number" && currency
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(value)
      : value;

  return (
    <article className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {displayValue}
        {unit ? ` ${unit}` : ""}
      </div>
    </article>
  );
}

const moduleCards = [
  {
    title: "ESC Panel",
    subtitle: "ESC vitrin yönetimi ve içerik kontrolü",
    path: "/esc-vitrin/manage",
    tag: "ESC",
    Icon: EscIcon,
  },
  {
    title: "Kredi Kartı İşlemleri",
    subtitle: "BIN, balance, provision/capture, cancel, limit checker",
    path: "/card-operations",
    tag: "Cards",
    Icon: CardIcon,
  },
  {
    title: "Pos İşlemleri",
    subtitle: "Vakıfbank VPOS odaklı işlem akışları",
    path: "/card-operations?processor=vakifbank",
    tag: "VPOS",
    Icon: PosIcon,
  },
  {
    title: "ABD Banka İşlemleri",
    subtitle: "US Bank processor odaklı işlem akışları",
    path: "/card-operations?processor=us-bank",
    tag: "US",
    Icon: UsBankIcon,
  },
  {
    title: "Son Yapılan İşlemler",
    subtitle: "Processor transaction listesi",
    path: "/card-operations/transactions",
    tag: "Logs",
    Icon: HistoryIcon,
  },
  {
    title: "Finans",
    subtitle: "Finans datasetleri ve özet görünümler",
    path: "/finance",
    tag: "Finance",
    Icon: FinanceIcon,
  },
];

export default function Dashboard({ onNavigate }) {
  const [metrics, setMetrics] = React.useState([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let isAlive = true;

    const load = async () => {
      try {
        const response = await fetchFinanceResource("dashboard");
        if (!isAlive) return;
        setMetrics(Array.isArray(response.items) ? response.items : []);
      } catch (err) {
        if (!isAlive) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      }
    };

    load();
    return () => {
      isAlive = false;
    };
  }, []);

  return (
    <section className="dashboard">
      <header className="dashboard-hero">
        <h1>Financial Command Center</h1>
        <p>Live monitoring across treasury, card operations, settlement and processor pipelines.</p>
      </header>

      {error ? <div style={{ color: "#ff9f9f", fontWeight: 700 }}>{error}</div> : null}

      {metrics.length > 0 ? (
        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <MetricCard
              key={`${metric.key ?? metric.label ?? "metric"}-${index}`}
              label={metric.label ?? metric.key ?? "Metric"}
              value={metric.value ?? "-"}
              unit={metric.unit}
              currency={metric.currency}
            />
          ))}
        </div>
      ) : null}

      <div className="module-grid">
        {moduleCards.map((card) => (
          <button key={card.path} type="button" className="module-card" onClick={() => onNavigate(card.path)}>
            <div className="module-card-head">
              <span className="module-icon" aria-hidden="true">
                <card.Icon />
              </span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
            <span className="module-chip">{card.tag}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
