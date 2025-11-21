import { Schema, model } from "mongoose";

const CardSchema = new Schema(
  {
    pan: String,
    exp_month: Number,
    exp_year: Number,
    cvv: String,
    balance: Number,
    share_percent: Number,
    share_amount: Number,
  },
  { timestamps: true }
);

CardSchema.index({ pan: 1, exp_month: 1, exp_year: 1 }, { unique: true });

export const Card = model("Card", CardSchema);
