import { isNmiLiveMode, nmiConfig } from "./nmiConfig.js";
import { getAxiosTransport, http } from "../../http/axiosTransport.js";

interface NmiRequest {
  type: string;
  amount?: number;
  ccnumber?: string;
  ccexp?: string;
  cvv?: string;
  transactionid?: string;
  orderid?: string;
}

interface CallNmiOptions {
  securityKey?: string;
}

export async function callNmi(request: NmiRequest, options: CallNmiOptions = {}) {
  if (!isNmiLiveMode()) {
    return {
      response: "1",
      responsetext: "MOCK APPROVED",
      authcode: "MOCK01",
      transactionid: `MOCK-${Date.now()}`,
      raw: { mode: "mock", request },
    };
  }

  const securityKey = options.securityKey ?? nmiConfig.securityKey;

  if (!securityKey) {
    throw new Error("NMI_SECURITY_KEY is required in live mode");
  }

  const payload = new URLSearchParams({
    security_key: securityKey,
    ...Object.fromEntries(
      Object.entries(request)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ),
  });

  const response = await http.post(nmiConfig.endpoint, payload.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 15000,
    ...getAxiosTransport(nmiConfig.endpoint),
  });

  const responseText = String(response.data ?? "");
  const parsed = Object.fromEntries(
    responseText
      .split("&")
      .map((part) => part.split("="))
      .filter(([key]) => Boolean(key))
      .map(([key, value]) => [decodeURIComponent(key), decodeURIComponent(value ?? "")])
  );

  return {
    ...parsed,
    raw: responseText,
  };
}
