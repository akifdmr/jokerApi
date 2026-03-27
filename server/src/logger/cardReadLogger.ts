
import crypto from "crypto";
import { CardReadLog } from "../core/db/models/CardReadLog.js"

interface LogInput {
  provider: string;
  devicePath: string;
  rawBuffer: Buffer;
}

export async function logCardRead({
  provider,
  devicePath,
  rawBuffer
}: LogInput) {

  const rawBase64 = rawBuffer.toString("base64");

  const rawHash = crypto
    .createHash("sha256")
    .update(rawBuffer)
    .digest("hex");

  return CardReadLog.create({
    provider,
    devicePath,
    rawBase64,
    rawHash,
    byteLength: rawBuffer.length,
    readAt: new Date()
  });
}
