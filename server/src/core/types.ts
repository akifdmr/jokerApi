// src/core/types.ts

export interface CoreCard {
  id?: number;            // DB primary key (opsiyonel)
  pan: string;            // 16 haneli kart numarası
  expMonth: number;       // 1-12
  expYear: number;        // 4 haneli (2029 gibi)
  cvv: string;            // 3-4 hane
  balance: number;        // Karttan çekmeyi planladığın balance
}

export type CoreStatus = "approved" | "declined" | "error" | "timeout";

export interface CoreAuthorizeResponse {
  status: CoreStatus;
  authorizationId?: string | null; // provider’ın döndürdüğü auth ID
  raw?: any;
}

export interface Authorizer {
  authorize(amount: number, card: CoreCard): Promise<CoreAuthorizeResponse>;
  voidAuthorization?(authorizationId: string): Promise<void>;
}

export interface AttemptResult {
  attempt: number;
  amountTried: number;
  status: CoreStatus;
  authorizationId: string | null;
  success: boolean;
  raw?: any;
}

export interface LimitCheckResult {
  success: boolean;
  maxAuthorizedAmount: number;
  attempts: AttemptResult[];
  finalAuthorizationId: string | null; // en son, yaşayan auth
}
