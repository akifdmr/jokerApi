export interface BinInfo {
  scheme: string
  type: "credit" | "debit" | "prepaid" | "unknown"
  brand: string
  bank?: string
  country?: string
  isCommercial?: boolean
}

export class CardBinChecker {
  static check(pan: string): BinInfo {
    const bin = pan.slice(0, 6)

    // ⚠️ burada external bin DB / API bağlanır
    // Şimdilik heuristic
    return {
      scheme: pan.startsWith("4") ? "visa" : "unknown",
      brand: pan.startsWith("5") ? "mastercard" : "visa",
      type: "unknown",
      country: "unknown",
      bank: "unknown"
    }
  }
}
