// vpos/VakifbankVposClient.ts
import crypto from "crypto";
import { CardInfo, VposResult } from "../types/vpos.types.js";
import { getAxiosTransport, http } from "../http/axiosTransport.js";

interface VakifbankConfig {
  endpoint: string;
  merchantId: string;
  terminalId: string;
  storeKey: string;
  currencyCode: string;
}

export class VakifbankVposClient {
  constructor(private readonly config: VakifbankConfig) {}

  /* ===================== PUBLIC API ===================== */

  async preAuth(
    orderId: string,
    amount: number,
    card: CardInfo
  ): Promise<VposResult> {
    return this.send({
      TransactionType: "PreAuth",
      OrderId: orderId,
      Amount: String(amount),
      ...this.cardFields(card),
    });
  }

  async sale(
    orderId: string,
    amount: number,
    card: CardInfo
  ): Promise<VposResult> {
    return this.send({
      TransactionType: "Sale",
      OrderId: orderId,
      Amount: String(amount),
      ...this.cardFields(card),
    });
  }

  async void(
    orderId: string,
    amount: number
  ): Promise<VposResult> {
    return this.send({
      TransactionType: "Void",
      OrderId: orderId,
      Amount: String(amount),
    });
  }

  async transactionList(
    startDate: string, // YYYYMMDD
    endDate: string    // YYYYMMDD
  ): Promise<string> {
    const xml = this.buildXML({
      TransactionType: "TransactionSearch",
      MerchantId: this.config.merchantId,
      TerminalId: this.config.terminalId,
      StartDate: startDate,
      EndDate: endDate,
    });

    const { data } = await http.post(this.config.endpoint, xml, {
      headers: { "Content-Type": "application/xml" },
      ...getAxiosTransport(this.config.endpoint),
    });

    return data;
  }

  /* ===================== CORE ===================== */

  private async send(fields: Record<string, string>): Promise<VposResult> {
    const hash = this.generateHash(
      fields.OrderId,
      fields.Amount
    );

    const xml = this.buildXML({
      MerchantId: this.config.merchantId,
      TerminalId: this.config.terminalId,
      CurrencyCode: this.config.currencyCode,
      HashData: hash,
      ...fields,
    });

    const { data } = await http.post(this.config.endpoint, xml, {
      headers: { "Content-Type": "application/xml" },
      timeout: 15000,
      ...getAxiosTransport(this.config.endpoint),
    });

    return this.parseResponse(data);
  }

  private cardFields(card: CardInfo) {
    return {
      Pan: card.pan,
      Expiry: card.expiry,
      Cvv: card.cvv,
    };
  }

  /* ===================== HELPERS ===================== */

  private generateHash(orderId: string, amount: string): string {
    const raw =
      orderId +
      amount +
      this.config.terminalId +
      this.config.storeKey;

    return crypto
      .createHash("sha256")
      .update(raw)
      .digest("base64");
  }

  private buildXML(payload: Record<string, string>): string {
    const body = Object.entries(payload)
      .map(([k, v]) => `<${k}>${v}</${k}>`)
      .join("");

    return `<VposRequest>${body}</VposRequest>`;
  }

  private parseResponse(xml: string): VposResult {
    const get = (tag: string) =>
      xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1];

    const code = get("ResponseCode") ?? "XX";

    return {
      success: code === "00",
      responseCode: code,
      message: get("ResponseMessage") ?? "UNKNOWN",
      authCode: get("AuthCode"),
      referenceNo: get("ReferenceNo"),
      raw: xml,
    };
  }
}
