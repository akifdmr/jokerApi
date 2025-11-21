// src/core/db.ts
import mongoose, { Schema, model } from "mongoose";

// ----------------------------------------------------
// 🔗 MongoDB Connection (Atlas)
// ----------------------------------------------------
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://flushtether_db_user:uSamV3uiWCX2ZXN3@jokerdb.q1sy0gl.mongodb.net/jokerDb?retryWrites=true&w=majority";

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("🔥 MongoDB connected!");
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  }
}

// ----------------------------------------------------
// 📌 Schema Definitions
// ----------------------------------------------------

// CARD SCHEMA
const CardSchema = new Schema(
  {
    pan: { type: String, required: true },
    exp_month: { type: Number, required: true },
    exp_year: { type: Number, required: true },
    cvv: { type: String, required: true },

    balance: { type: Number, default: 0 },
    share_percent: { type: Number, default: 20 },
    share_amount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Unique constraint (pan + exp)
CardSchema.index({ pan: 1, exp_month: 1, exp_year: 1 }, { unique: true });

export const Card = model("Card", CardSchema);

// CARD LIMITS SCHEMA
const CardLimitSchema = new Schema(
  {
    card_id: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    max_limit: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    attempts: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

export const CardLimit = model("CardLimit", CardLimitSchema);

// ----------------------------------------------------
// 📌 UPSERT CARD
// ----------------------------------------------------
export async function upsertCard(
  pan: string,
  expMonth: number,
  expYear: number,
  cvv: string,
  balance: number,
  sharePercent = 20
): Promise<string> {
  const shareAmount = (balance * sharePercent) / 100;

  const card = await Card.findOneAndUpdate(
    { pan, exp_month: expMonth, exp_year: expYear },
    {
      pan,
      exp_month: expMonth,
      exp_year: expYear,
      cvv,
      balance,
      share_percent: sharePercent,
      share_amount: shareAmount,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return card._id.toString();
}

// ----------------------------------------------------
// 📌 INSERT CARD LIMIT
// ----------------------------------------------------
export async function insertCardLimit(
  cardId: string,
  maxLimit: number,
  attempts: any[],
  currency = "USD"
) {
  await CardLimit.create({
    card_id: cardId,
    max_limit: maxLimit,
    currency,
    attempts,
  });
}
