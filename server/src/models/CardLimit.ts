import { Schema, model } from "mongoose";

const CardLimitSchema = new Schema(
  {
    card_id: { type: Schema.Types.ObjectId, ref: "Card" },
    max_limit: Number,
    currency: String,
    attempts: Array,
  },
  { timestamps: true }
);

export const CardLimit = model("CardLimit", CardLimitSchema);
