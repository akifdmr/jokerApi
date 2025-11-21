import axios, { AxiosRequestConfig } from "axios";
import { Authorizer, CoreCard, CoreAuthorizeResponse } from "../core/types.js";

export class wixPaymentService implements Authorizer {
  private apiKey: string;
  private gatewayUrl: string;
  private timeoutMs: number;
  private orderId: string;
  private savedPaymentMethodId: string;
  private currency: string;

  constructor(
    orderId: string,
    savedPaymentMethodId: string,
    currency = "USD",
    timeoutMs = 8000
  ) {
    this.apiKey = process.env.WIX_API_KEY || "";
    this.gatewayUrl = process.env.WIX_GATEWAY_URL || "https://www.wixapis.com/ecom/v1";
    this.timeoutMs = timeoutMs;
    this.orderId = orderId;
    this.savedPaymentMethodId = savedPaymentMethodId;
    this.currency = currency;

    if (!this.apiKey) {
      throw new Error("WIX_API_KEY is not set in environment (.env).");
    }
  }

  async authorize(amount: number, card: CoreCard): Promise<CoreAuthorizeResponse> {
    const url = `${this.gatewayUrl}/order-billing/authorize-charge-with-saved-payment-method`;

    const payload = {
      orderId: this.orderId,
      savedPaymentMethodId: this.savedPaymentMethodId,
      amount: {
        total: amount.toFixed(2),
        currency: this.currency,
      },
    };

    const cfg: AxiosRequestConfig = {
      timeout: this.timeoutMs,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    };

    try {
      const resp = await axios.post(url, payload, cfg);

      return {
        status: resp.data?.state ?? resp.data?.status ?? "error",
        authorizationId: resp.data?.id ?? null,
        raw: resp.data,
      };
    } catch (err: any) {
      return {
        status: "error",
        authorizationId: null,
        raw: err.response?.data ?? err.message ?? err,
      };
    }
  }

  async voidAuthorization(authorizationId: string): Promise<void> {
    const url = `${this.gatewayUrl}/order-billing/void-authorized-payments`;

    const payload = { authorizationId };

    const cfg: AxiosRequestConfig = {
      timeout: this.timeoutMs,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    };

    await axios.post(url, payload, cfg);
  }
}
