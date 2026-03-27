import { callNmi } from "./nmiClient.js";
import { createNmiTransaction, listNmiTransactions, updateNmiTransaction } from "./nmiLocalStore.js";
import { PaymentProcessor } from "./nmiTypes.js";
import { isNmiLiveMode, nmiConfig } from "./nmiConfig.js";
import { VakifbankVposClient } from "../../Pos/VakifbankVposClient.js";
import { VPOS_CONFIG } from "../../config/vpos.Config.js";
import { lookupBin } from "../../binlookup/binlookupService.js";

function maskPan(pan?: string) {
  if (!pan) return undefined;
  const last4 = pan.slice(-4);
  return `**** **** **** ${last4}`;
}

function toNmiExp(expMonth: string, expYear: string) {
  const mm = expMonth.padStart(2, "0");
  const yy = expYear.slice(-2);
  return `${mm}${yy}`;
}

function toVakifbankExpiry(expMonth: string, expYear: string) {
  const mm = expMonth.padStart(2, "0");
  const yy = expYear.slice(-2);
  return `${yy}${mm}`;
}

function createTransactionId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getProcessor(input?: string): PaymentProcessor {
  if (input === "vakifbank") return "vakifbank";
  if (input === "nmi") return "nmi";
  return "us-bank";
}

function vakifClient() {
  return new VakifbankVposClient({
    endpoint: VPOS_CONFIG.endpoint,
    merchantId: nmiConfig.vakifbank.merchantId,
    terminalId: nmiConfig.vakifbank.terminalId,
    storeKey: VPOS_CONFIG.storeKey,
    currencyCode: VPOS_CONFIG.currencyCode,
  });
}

async function runBalanceGateway(
  processor: PaymentProcessor,
  input: { pan: string; expMonth: string; expYear: string; cvv: string }
) {
  if (!isNmiLiveMode()) {
    return {
      response: "1",
      responsetext: `MOCK APPROVED (${processor})`,
      processor,
      terminalId:
        processor === "vakifbank"
          ? nmiConfig.vakifbank.terminalId
          : processor === "us-bank"
          ? nmiConfig.usBank.terminalId
          : "NMI-TERM",
    };
  }

  if (processor === "vakifbank") {
    const response = await vakifClient().preAuth(createTransactionId("VFK-BAL"), 1, {
      pan: input.pan,
      expiry: toVakifbankExpiry(input.expMonth, input.expYear),
      cvv: input.cvv,
    });

    return {
      response: response.success ? "1" : "0",
      responsetext: response.message,
      raw: response.raw,
      referenceNo: response.referenceNo,
      authCode: response.authCode,
      processor,
      terminalId: nmiConfig.vakifbank.terminalId,
      merchantId: nmiConfig.vakifbank.merchantId,
    };
  }

  return callNmi(
    {
      type: "validate",
      ccnumber: input.pan,
      ccexp: toNmiExp(input.expMonth, input.expYear),
      cvv: input.cvv,
    },
    {
      securityKey: processor === "us-bank" ? nmiConfig.usBank.merchantKey : nmiConfig.securityKey,
    }
  );
}

async function runProvisionGateway(
  processor: PaymentProcessor,
  transactionId: string,
  input: {
    pan: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    amount: number;
    orderId?: string;
  }
) {
  if (!isNmiLiveMode()) {
    return {
      response: "1",
      responsetext: `MOCK PROVISION APPROVED (${processor})`,
      transactionid: transactionId,
      processor,
    };
  }

  if (processor === "vakifbank") {
    const response = await vakifClient().preAuth(transactionId, input.amount, {
      pan: input.pan,
      expiry: toVakifbankExpiry(input.expMonth, input.expYear),
      cvv: input.cvv,
    });

    return {
      response: response.success ? "1" : "0",
      responsetext: response.message,
      transactionid: transactionId,
      raw: response.raw,
      referenceNo: response.referenceNo,
      authCode: response.authCode,
      processor,
      terminalId: nmiConfig.vakifbank.terminalId,
      merchantId: nmiConfig.vakifbank.merchantId,
    };
  }

  return callNmi(
    {
      type: "auth",
      amount: input.amount,
      ccnumber: input.pan,
      ccexp: toNmiExp(input.expMonth, input.expYear),
      cvv: input.cvv,
      orderid: input.orderId,
    },
    {
      securityKey: processor === "us-bank" ? nmiConfig.usBank.merchantKey : nmiConfig.securityKey,
    }
  );
}

async function runCompletionGateway(
  processor: PaymentProcessor,
  input: { transactionId: string; amount?: number }
) {
  if (!isNmiLiveMode()) {
    return {
      response: "1",
      responsetext: `MOCK COMPLETED (${processor})`,
      transactionid: input.transactionId,
      processor,
    };
  }

  if (processor === "vakifbank") {
    return {
      response: "1",
      responsetext: "Vakifbank completion accepted",
      transactionid: input.transactionId,
      raw: "vakifbank-completion-local",
      processor,
      terminalId: nmiConfig.vakifbank.terminalId,
      merchantId: nmiConfig.vakifbank.merchantId,
    };
  }

  return callNmi(
    {
      type: "capture",
      transactionid: input.transactionId,
      amount: input.amount,
    },
    {
      securityKey: processor === "us-bank" ? nmiConfig.usBank.merchantKey : nmiConfig.securityKey,
    }
  );
}

async function runCancelGateway(processor: PaymentProcessor, input: { transactionId: string }) {
  if (!isNmiLiveMode()) {
    return {
      response: "1",
      responsetext: `MOCK CANCELED (${processor})`,
      transactionid: input.transactionId,
      processor,
    };
  }

  if (processor === "vakifbank") {
    const response = await vakifClient().void(input.transactionId, 1);
    return {
      response: response.success ? "1" : "0",
      responsetext: response.message,
      transactionid: input.transactionId,
      raw: response.raw,
      processor,
      terminalId: nmiConfig.vakifbank.terminalId,
      merchantId: nmiConfig.vakifbank.merchantId,
    };
  }

  return callNmi(
    {
      type: "void",
      transactionid: input.transactionId,
    },
    {
      securityKey: processor === "us-bank" ? nmiConfig.usBank.merchantKey : nmiConfig.securityKey,
    }
  );
}

export async function binCheck(pan: string, processorInput?: string) {
  const processor = getProcessor(processorInput);
  const lookup = await lookupBin(pan);
  const clean = String(pan ?? "").replace(/\D/g, "");
  const bin = lookup.bin || clean.slice(0, 6);

  return {
    ok: true,
    operation: "bin-check",
    processor,
    bin,
    brand: lookup.scheme?.toUpperCase() ?? "UNKNOWN",
    cardType: lookup.cardType ?? "UNKNOWN",
    debit: lookup.debit ?? null,
    credit: lookup.credit ?? null,
    prepaid: lookup.prepaid ?? null,
    issuer: lookup.issuer ?? undefined,
    bank: lookup.bank ?? undefined,
    country: lookup.country ?? undefined,
    source: lookup.source,
    warning: lookup.warning,
  };
}

export async function balanceCheck(input: {
  processor?: string;
  pan: string;
  expMonth: string;
  expYear: string;
  cvv: string;
}) {
  const processor = getProcessor(input.processor);
  const response = await runBalanceGateway(processor, input);
  const transactionId = createTransactionId(
    processor === "vakifbank" ? "VFK-BAL" : processor === "nmi" ? "NMI-BAL" : "USB-BAL"
  );

  const tx = await createNmiTransaction({
    transactionId,
    processor,
    operation: "balance-check",
    status: response.response === "1" ? "approved" : "declined",
    panMasked: maskPan(input.pan),
    responseText: String(response.responsetext ?? ""),
  });

  return { ok: true, operation: "balance-check", processor, gateway: response, transaction: tx };
}

export async function provision(input: {
  processor?: string;
  pan: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  amount: number;
  currency?: string;
  orderId?: string;
}) {
  const processor = getProcessor(input.processor);
  const transactionId = createTransactionId(
    processor === "vakifbank" ? "VFK-PRV" : processor === "nmi" ? "NMI-PRV" : "USB-PRV"
  );
  const response = await runProvisionGateway(processor, transactionId, input);

  const tx = await createNmiTransaction({
    transactionId,
    processor,
    operation: "provision",
    status: response.response === "1" ? "pending" : "declined",
    amount: input.amount,
    currency: input.currency ?? "USD",
    panMasked: maskPan(input.pan),
    responseText: String(response.responsetext ?? ""),
  });

  return { ok: true, operation: "provision", processor, gateway: response, transaction: tx };
}

export async function provisionCompletion(input: {
  processor?: string;
  transactionId: string;
  amount?: number;
}) {
  const processor = getProcessor(input.processor);
  const response = await runCompletionGateway(processor, input);

  const updated = await updateNmiTransaction(input.transactionId, {
    processor,
    status: response.response === "1" ? "completed" : "declined",
    responseText: String(response.responsetext ?? ""),
  });

  return {
    ok: true,
    operation: "provision-completion",
    processor,
    gateway: response,
    transaction: updated,
  };
}

export async function cancelProvision(input: { processor?: string; transactionId: string }) {
  const processor = getProcessor(input.processor);
  const response = await runCancelGateway(processor, input);

  const updated = await updateNmiTransaction(input.transactionId, {
    processor,
    status: response.response === "1" ? "canceled" : "declined",
    responseText: String(response.responsetext ?? ""),
  });

  return {
    ok: true,
    operation: "cancel",
    processor,
    gateway: response,
    transaction: updated,
  };
}

export async function transactionList() {
  const items = await listNmiTransactions(100);
  return { ok: true, operation: "transaction-list", items };
}
