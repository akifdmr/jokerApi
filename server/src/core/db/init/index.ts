import { ensureCollections } from './ensureCollections.js'
import { seedProviders } from './seedProviders.js'
import { seedAdminUser } from './seedAdmin.js'
import { seedFinanceDatasets } from "./seedFinanceDatasets.js";
import mongoose from "mongoose";
import { ensureLocalFinanceStore } from "../local/financeLocalStore.js";
import { ensureMasterStore } from "../local/masterDataStore.js";
import { ensureOnrampStore } from "../local/onrampStore.js";
import { ensureBalanceCheckerStore } from "../local/balanceCheckerStore.js";
import { ensureEscVitrinStore } from "../local/escVitrinStore.js";

let mongoConnected = false;

export const initDatabase = async () => {
  console.log('🔄 Initializing database...')
  await ensureLocalFinanceStore();
  await ensureMasterStore();
  await ensureOnrampStore();
  await ensureBalanceCheckerStore();
  await ensureEscVitrinStore();

  if (mongoConnected) {
    await ensureCollections()
    await seedProviders()
    await seedAdminUser()
    await seedFinanceDatasets()
  } else {
    console.log("🗂️ Running in local file DB mode for finance datasets");
  }

  console.log('✅ Database ready')
}


const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/payment_manager";

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    mongoConnected = true;
    console.log("🔥 MongoDB connected!");
  } catch (err) {
    mongoConnected = false;
    console.warn("⚠️ MongoDB unavailable, using local file DB mode.");
    console.warn(err);
  }
}

export function isMongoConnected() {
  return mongoConnected;
}
