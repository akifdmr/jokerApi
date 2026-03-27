const ALLOWED = new Set(["us-bank", "vakifbank", "nmi"]);

export function getProcessorFromQuery(fallback = "us-bank") {
  try {
    const raw = new URLSearchParams(window.location.search).get("processor");
    if (!raw) return fallback;
    const value = String(raw).trim().toLowerCase();
    return ALLOWED.has(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function cardOperationsHomePath() {
  const p = getProcessorFromQuery("");
  return p ? `/card-operations?processor=${encodeURIComponent(p)}` : "/card-operations";
}
