// vpos.crypto.js
import crypto from "crypto";

export function generateHash({ orderId, amount, terminalId, storeKey }) {
  const hashStr = orderId + amount + terminalId + storeKey;
  return crypto
    .createHash("sha256")
    .update(hashStr)
    .digest("base64");
}
