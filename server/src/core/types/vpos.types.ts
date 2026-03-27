// vpos/types.ts
export interface CardInfo {
  pan: string;
  expiry: string; // YYMM
  cvv: string;
}

export interface VposResult {
  success: boolean;
  responseCode: string;
  message: string;
  authCode?: string;
  referenceNo?: string;
  raw: string;
}
