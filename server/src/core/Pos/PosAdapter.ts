// pos/PosAdapter.ts
export interface PosChargeResult {
  success: boolean;
  responseCode: string;
  message: string;
  authCode?: string;
  referenceNo?: string;
}

export interface PosAdapter {
  preAuth(amount: number, orderId: string): Promise<PosChargeResult>;
}
