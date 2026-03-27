import { moovCreateAccessToken, moovRequest } from "./moovClient.js";

export async function createMoovToken(scope?: string) {
  return moovCreateAccessToken(scope);
}

export async function createMoovAccount(input: { accessToken: string; account: Record<string, unknown> }) {
  return moovRequest("POST", "/accounts", input.accessToken, input.account);
}

export async function createMoovTransfer(input: {
  accessToken: string;
  accountId: string;
  transfer: Record<string, unknown>;
  idempotencyKey?: string;
}) {
  return moovRequest(
    "POST",
    `/accounts/${encodeURIComponent(input.accountId)}/transfers`,
    input.accessToken,
    input.transfer,
    input.idempotencyKey
  );
}

