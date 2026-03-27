export type NmiOperation =
  | "bin-check"
  | "balance-check"
  | "provision"
  | "provision-completion"
  | "cancel";

export type NmiTransactionStatus = "approved" | "pending" | "completed" | "canceled" | "declined";
export type PaymentProcessor = "us-bank" | "vakifbank" | "nmi";

export interface NmiTransactionRecord {
  id: string;
  transactionId: string;
  processor: PaymentProcessor;
  operation: NmiOperation;
  status: NmiTransactionStatus;
  amount?: number;
  currency?: string;
  panMasked?: string;
  responseText?: string;
  createdAt: string;
  updatedAt: string;
}
