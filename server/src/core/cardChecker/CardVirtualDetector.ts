export class CardVirtualDetector {
  static detect(pan: string, binInfo?: { type?: string }) {
    const virtualBins = [
      "483312", "537805", "556371", "476134"
    ]

    if (virtualBins.includes(pan.slice(0, 6))) {
      return { virtual: true, confidence: "high" }
    }

    if (binInfo?.type === "prepaid") {
      return { virtual: true, confidence: "medium" }
    }

    return { virtual: false, confidence: "low" }
  }
}
