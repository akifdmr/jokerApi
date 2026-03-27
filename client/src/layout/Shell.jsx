import React from "react";
import "./Shell.css";

export default function Shell({ children, currentPath, onNavigate }) {
  const activePath = String(currentPath).split("?")[0];
  const navItems = [
    { path: "/dashboard", label: "Anasayfa" },
    { path: "/esc-vitrin/manage", label: "ESC Panel" },
    { path: "/card-operations", label: "Kredi Kartı İşlemleri" },
    { path: "/card-operations?processor=vakifbank", label: "Pos İşlemleri" },
    { path: "/card-operations?processor=us-bank", label: "ABD Banka İşlemleri" },
    { path: "/card-operations/transactions", label: "Son Yapılan İşlemler" },
    { path: "/finance", label: "Finans" },
    { path: "/sepa", label: "SEPA" },
    { path: "/whop", label: "Whop" },
    { path: "/crypto-onramp", label: "Onramp" },
    { path: "/fraud", label: "Fraud" },
    { path: "/partners", label: "Bankalar" },
    { path: "/customers", label: "Kişiler" },
    { path: "/assets", label: "Kartlar" },
    { path: "/accounts", label: "Hesaplar" },
    { path: "/transactions", label: "Topup" },
  ];

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">Payment Manager</div>
        <nav className="shell-nav">
          {navItems.map((item) => {
            const itemPath = String(item.path);
            const isQueryRoute = itemPath.includes("?");
            const isActive = isQueryRoute ? String(currentPath) === itemPath : activePath === itemPath;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`shell-link${isActive ? " shell-link-active" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="shell-content">{children}</main>
    </div>
  );
}
