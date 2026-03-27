// src/core/db.ts
import mongoose, { Schema, model } from "mongoose";

// ----------------------------------------------------
// 🔗 MongoDB Connection (Atlas)
// ----------------------------------------------------
const uri = process.env.MONGODB_URI;
const cert = process.env.MONGODB_X509_CERT;
if (!uri || !cert) {
  console.error("❌ MongoDB URI or X509 cert path not set in .env");
  process.exit(1);
}
const MONGO_URI = uri.replace("<CERT_PATH>",cert.replace(/\\/g, "/") // Windows paths için düzeltme
);
export async function connectDB() {
  try {
    await mongoose.connect(uri, {  tls: true, tlsCertificateKeyFile: cert});
    console.log("🔥 MongoDB connected!");
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  }
}

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

// PROVIDER SCHEMA
const ProviderSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },

    api_url: { type: String, required: true },
    api_key: { type: String, required: true },
    api_secret: { type: String, required: true },

    is_active: { type: Boolean, default: true },

    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Provider = model("Provider", ProviderSchema);


const ProcessTypeSchema = new Schema(
  {
    type: { type: String, required: true, unique: true }, // balanceCheck, binCheck vs
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ProcessType = model("ProcessType", ProcessTypeSchema);


const ProviderProcessSchema = new Schema(
  {
    provider_id: { type: Schema.Types.ObjectId, ref: "Provider", required: true },
    process_type_id: { type: Schema.Types.ObjectId, ref: "ProcessType", required: true },

    is_default: { type: Boolean, default: false }, // örn. balanceCheck default = MX
  },
  { timestamps: true }
);

ProviderProcessSchema.index(
  { provider_id: 1, process_type_id: 1 },
  { unique: true }
);

export const ProviderProcess = model("ProviderProcess", ProviderProcessSchema);


export async function insertProvider(
  name: string,
  apiUrl: string,
  apiKey: string,
  apiSecret: string,
  description = ""
) {
  const provider = await Provider.create({
    name,
    api_url: apiUrl,
    api_key: apiKey,
    api_secret: apiSecret,
    description,
  });

  return provider._id.toString();
}


export async function updateProvider(providerId: string, data: any) {
  return await Provider.findByIdAndUpdate(providerId, data, { new: true });
}


export async function deleteProvider(providerId: string) {
  await Provider.findByIdAndDelete(providerId);
}

export async function insertProcessType(type: string, description = "") {
  const processType = await ProcessType.create({ type, description });
  return processType._id.toString();
}


