import React from "react";
import "./Finance.css";
import { FinanceIcon, HistoryIcon, CardIcon, UsBankIcon, EscIcon } from "../components/Icons.jsx";

const tiles = [
  { path: "/dashboard", title: "Finans Özet", subtitle: "Dashboard metrikleri", Icon: FinanceIcon },
  { path: "/transactions", title: "Card Topups", subtitle: "Topup listesi ve notlar", Icon: HistoryIcon },
  { path: "/crypto-onramp", title: "Crypto Onramp", subtitle: "Card / ACH / SEPA ile alım", Icon: CardIcon },
  { path: "/whop", title: "Whop", subtitle: "Company app / products / payments", Icon: CardIcon },
  { path: "/fraud", title: "Fraud", subtitle: "Kural profilleri + event log", Icon: UsBankIcon },
  { path: "/partners", title: "Bankalar", subtitle: "Swift / ülke / master kayıt", Icon: UsBankIcon },
  { path: "/esc-vitrin", title: "ESC Vitrin", subtitle: "ESC vitrin listesi", Icon: EscIcon },
];

export default function Finance({ onNavigate }) {
  return (
    <section className="finance-page">
      <header className="finance-hero">
        <h2>Finans</h2>
        <p>Özet metrikler ve finans modüllerine hızlı erişim.</p>
      </header>

      <div className="finance-grid">
        {tiles.map((t) => (
          <button key={t.path} type="button" className="finance-tile" onClick={() => onNavigate(t.path)}>
            <div className="finance-tile-head">
              <span className="finance-icon" aria-hidden="true">
                <t.Icon />
              </span>
              <div>
                <div className="finance-title">{t.title}</div>
                <div className="finance-sub">{t.subtitle}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
