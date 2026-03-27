import React from "react";
import "./CardOperations.css";
import { getProcessorFromQuery } from "./cardOps/processorQuery";

const operations = [
  {
    path: "/card-operations/bin-check",
    title: "Card BIN Check",
    subtitle: "Issuer/brand/risk footprint",
  },
  {
    path: "/card-operations/balance-check",
    title: "Balance Check",
    subtitle: "Pre-validate card capability",
  },
  {
    path: "/card-operations/smart-balance-checker",
    title: "Smart Balance Checker",
    subtitle: "2500 USD start, 5s interval, adaptive probing with live logs",
  },
  {
    path: "/card-operations/provision",
    title: "Provision",
    subtitle: "Auth hold with NMI processor",
  },
  {
    path: "/card-operations/provision-completion",
    title: "Provision Completion",
    subtitle: "Capture authorized amount",
  },
  {
    path: "/card-operations/cancel",
    title: "Cancel / Void",
    subtitle: "Release or void provision",
  },
  {
    path: "/card-operations/transactions",
    title: "Transaction List",
    subtitle: "View latest processor records",
  },
];

export default function CardOperations({ onNavigate }) {
  const processor = getProcessorFromQuery("");
  const suffix = processor ? `?processor=${encodeURIComponent(processor)}` : "";

  return (
    <section className="card-ops-home">
      <header>
        <h2>Card Operations</h2>
        <p>Processor-select workflow (US Bank / Vakifbank VPOS) with transactionId tracking</p>
      </header>

      <div className="card-ops-grid">
        {operations.map((item) => (
          <button
            key={item.path}
            type="button"
            className="card-ops-tile"
            onClick={() => onNavigate(`${item.path}${suffix}`)}
          >
            <h3>{item.title}</h3>
            <p>{item.subtitle}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
