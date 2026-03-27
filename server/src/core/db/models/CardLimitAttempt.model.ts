// models/CardLimitCheck.model.ts
import { Schema, model, Types } from "mongoose";

export interface CardLimitCheckDocument {
  cardHash: string;        // PAN hash (asla açık PAN tutma)
  provider: string;        // vakifbank / garanti / mock
  currency: string;

  status: "RUNNING" | "COMPLETED" | "FAILED";

  minApproved?: number;    // kesin onaylanan alt limit
  maxDeclined?: number;    // kesin reddedilen üst limit
  estimatedLimit?: number;// tahmini limit

  startedAt: Date;
  finishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const CardLimitCheckSchema = new Schema<CardLimitCheckDocument>(
  {
    cardHash: {
      type: String,
      required: true,
      index: true,
    },

    provider: {
      type: String,
      required: true,
      index: true,
    },

    currency: {
      type: String,
      default: "TRY",
    },

    status: {
      type: String,
      enum: ["RUNNING", "COMPLETED", "FAILED"],
      default: "RUNNING",
      index: true,
    },

    minApproved: Number,
    maxDeclined: Number,
    estimatedLimit: Number,

    startedAt: {
      type: Date,
      default: Date.now,
    },

    finishedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const CardLimitCheck = model<CardLimitCheckDocument>(
  "CardLimitCheck",
  CardLimitCheckSchema
);
