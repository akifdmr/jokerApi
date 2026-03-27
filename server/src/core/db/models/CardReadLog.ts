import { Schema, model, Document } from "mongoose";
import crypto from "crypto";

export interface ICardReadLog extends Document {
  provider: string;          // msr-x6
  devicePath: string;        // /dev/cu.usbserial-*
  rawBase64: string;         // ham payload
  rawHash: string;           // sha256
  byteLength: number;
  readAt: Date;
}

const CardReadLogSchema = new Schema<ICardReadLog>({
  provider: { type: String, required: true },
  devicePath: { type: String, required: true },

  rawBase64: { type: String, required: true },
  rawHash: { type: String, required: true, index: true },

  byteLength: { type: Number, required: true },
  readAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const CardReadLog = model<ICardReadLog>(
  "CardReadLog",
  CardReadLogSchema
);
