import React from "react";
import Shell from "./layout/Shell.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Assets from "./pages/Assets.jsx";
import Customers from "./pages/Customers.jsx";
import Partners from "./pages/Partners.jsx";
import Accounts from "./pages/Accounts.jsx";
import Transactions from "./pages/Transactions.jsx";
import CardOperations from "./pages/CardOperations.jsx";
import BinCheckPage from "./pages/cardOps/BinCheckPage.jsx";
import BalanceCheckPage from "./pages/cardOps/BalanceCheckPage.jsx";
import ProvisionPage from "./pages/cardOps/ProvisionPage.jsx";
import ProvisionCompletionPage from "./pages/cardOps/ProvisionCompletionPage.jsx";
import CancelPage from "./pages/cardOps/CancelPage.jsx";
import TransactionListPage from "./pages/cardOps/TransactionListPage.jsx";
import SmartBalanceCheckerPage from "./pages/cardOps/SmartBalanceCheckerPage.jsx";
import CryptoOnramp from "./pages/CryptoOnramp.jsx";
import EscVitrin from "./pages/EscVitrin.jsx";
import EscVitrinManage from "./pages/EscVitrinManage.jsx";
import FraudManager from "./pages/FraudManager.jsx";
import Finance from "./pages/Finance.jsx";
import Sepa from "./pages/Sepa.jsx";
import Whop from "./pages/Whop.jsx";

const ROUTES = {
  "/dashboard": Dashboard,
  "/assets": Assets,
  "/customers": Customers,
  "/partners": Partners,
  "/accounts": Accounts,
  "/transactions": Transactions,
  "/card-operations": CardOperations,
  "/card-operations/bin-check": BinCheckPage,
  "/card-operations/balance-check": BalanceCheckPage,
  "/card-operations/provision": ProvisionPage,
  "/card-operations/provision-completion": ProvisionCompletionPage,
  "/card-operations/cancel": CancelPage,
  "/card-operations/transactions": TransactionListPage,
  "/card-operations/smart-balance-checker": SmartBalanceCheckerPage,
  "/crypto-onramp": CryptoOnramp,
  "/fraud": FraudManager,
  "/finance": Finance,
  "/sepa": Sepa,
  "/whop": Whop,
  "/esc-vitrin": EscVitrin,
  "/esc-vitrin/manage": EscVitrinManage,
};

function normalizePath(pathname) {
  if (pathname === "/") return "/dashboard";
  return pathname;
}

export default function App() {
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [_session, setSession] = React.useState(null);
  const [path, setPath] = React.useState(() => normalizePath(window.location.pathname) + window.location.search);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("pm_session_v1");
      if (!raw) return;
      const session = JSON.parse(raw);
      if (session?.token) {
        setSession(session);
        setIsAuthed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const navigate = React.useCallback((nextPath) => {
    const [nextPathname, nextSearch = ""] = String(nextPath).split("?");
    const normalized = normalizePath(nextPathname) + (nextSearch ? `?${nextSearch}` : "");
    window.history.pushState({}, "", normalized);
    setPath(normalized);
  }, []);

  React.useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname) + window.location.search);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (!isAuthed) {
    return (
      <Login
        onAuthenticate={(session) => {
          setSession(session);
          setIsAuthed(true);
          try {
            localStorage.setItem("pm_session_v1", JSON.stringify(session));
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  const pathname = String(path).split("?")[0];
  const ActivePage = ROUTES[pathname] ?? null;

  return (
    <Shell currentPath={path} onNavigate={navigate}>
      {ActivePage ? <ActivePage onNavigate={navigate} /> : <div style={{ padding: 24 }}>404</div>}
    </Shell>
  );
}
