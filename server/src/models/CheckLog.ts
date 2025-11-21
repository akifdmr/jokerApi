import { Schema, model } from "mongoose";

const CheckLogSchema = new Schema(
  {
    request: {
      pan: String,
      exp: String,
      cvv: String,
      amount: Number,
    },

    response: {
      allowed: Boolean,
      balance: Number,
      message: String,
    },
  },
  { timestamps: true }
);

export const CheckLog = model("CheckLog", CheckLogSchema);
