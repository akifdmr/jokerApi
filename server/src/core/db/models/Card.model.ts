import { Schema, model } from "mongoose";

const CardSchema = new Schema(
  {
    panHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    expMonth: Number,
    expYear: Number,

    cvvHash: String,

    lastKnownBalance: {
      type: Number,
      default: 0
    },

    safetyMarginPercent: {
      type: Number,
      default: 20
    }
  },
  { timestamps: true }
);

export const CardModel = model("Card", CardSchema);
