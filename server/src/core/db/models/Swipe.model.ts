// src/modules/payments/models/Swipe.model.ts
import mongoose from "mongoose";

const SwipeSchema = new mongoose.Schema(
  {
    panMasked: String,
    exp: String,
    trackType: Number,
    raw: String,
    source: String,
    clientId: String, // 👈 ÇOK ÖNEMLİ
  },
  { timestamps: true }
);

export default mongoose.model("Swipe", SwipeSchema);
