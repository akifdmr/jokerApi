import mongoose from "mongoose";

const CardLimitCheckSchema = new mongoose.Schema(
  {
    card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
    maxAuthorizedAmount: { type: Number, required: true },
    currency: { type: String, required: true },
    success: { type: Boolean, required: true },
    finalAuthorizationId: { type: String, default: null },
  },
  { timestamps: true }
);

export const CardLimitCheckModel =
  (mongoose.models.CardLimitCheck as mongoose.Model<any>) ||
  mongoose.model("CardLimitCheck", CardLimitCheckSchema);

