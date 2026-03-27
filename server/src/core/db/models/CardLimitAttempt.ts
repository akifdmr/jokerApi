// models/CardLimitAttempt.model.ts
import { Schema, model, Types } from "mongoose";

export interface CardLimitAttemptDocument {
  limitCheck: Types.ObjectId;

  amount: number;              // denenilen tutar (kuruş)
  currency: string;            // TRY, USD vs
  success: boolean;            // onaylandı mı
  responseCode?: string;       // banka response code
  responseMessage?: string;    // banka mesajı

  authCode?: string;           // provizyon kodu
  referenceNo?: string;        // bank reference

  attemptType: "PREAUTH" | "SALE"; // deneme tipi
  provider: string;            // vakifbank / garanti / akbank

  createdAt: Date;
  updatedAt: Date;
}

const CardLimitAttemptSchema = new Schema<CardLimitAttemptDocument>(
  {
    limitCheck: {
      type: Types.ObjectId,
      ref: "CardLimitCheck",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      index: true,
    },

    currency: {
      type: String,
      default: "TRY",
    },

    success: {
      type: Boolean,
      required: true,
      index: true,
    },

    responseCode: {
      type: String,
    },

    responseMessage: {
      type: String,
    },

    authCode: {
      type: String,
      index: true,
    },

    referenceNo: {
      type: String,
    },

    attemptType: {
      type: String,
      enum: ["PREAUTH", "SALE"],
      required: true,
      index: true,
    },

    provider: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const CardLimitAttempt = model<CardLimitAttemptDocument>(
  "CardLimitAttempt",
  CardLimitAttemptSchema
);
