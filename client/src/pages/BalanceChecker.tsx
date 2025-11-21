import { useState, useEffect } from "react";
import axios from "axios";

export default function BalanceCheck() {
  const [pan, setPan] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [amount, setAmount] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);

  async function checkBalance() {
    try {
      const res = await axios.post("/api/check-balance", {
        pan,
        exp,
        cvv,
        amount: Number(amount),
      });

      setResult(res.data);
      fetchLogs();
    } catch (err: any) {
      setResult({ error: err.response?.data || err.message });
    }
  }


  async function fetchLogs() {
     const res = await axios.get<any[]>("/api/check-balance/logs");
     setLogs(res.data);
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-10 space-y-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">💳 Balance Check</h1>

      <div className="bg-white shadow-lg p-6 rounded-xl space-y-4">
        <input
          className="border p-2 w-full rounded"
          placeholder="Card Number (PAN)"
          value={pan}
          onChange={(e) => setPan(e.target.value)}
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="Expiry (MM/YY)"
          value={exp}
          onChange={(e) => setExp(e.target.value)}
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="Amount to Check"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button
          onClick={checkBalance}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Check Balance
        </button>

        {result && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold">📜 Logs</h2>
      <div className="bg-white shadow p-4 rounded-xl max-h-96 overflow-auto">
        {logs.map((log, i) => (
          <div key={i} className="border-b py-2 text-sm">
            <div><strong>PAN:</strong> {log.pan}</div>
            <div><strong>Amount:</strong> {log.amount}</div>
            <div><strong>Result:</strong> {log.response}</div>
            <div className="text-xs text-gray-500">{log.created_at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
