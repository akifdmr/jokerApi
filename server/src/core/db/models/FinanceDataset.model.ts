import { Schema, model } from "mongoose";

export const FINANCE_RESOURCES = [
  "dashboard",
  "assets",
  "customers",
  "partners",
  "accounts",
  "transactions",
] as const;

export type FinanceResource = (typeof FINANCE_RESOURCES)[number];

const FinanceDatasetSchema = new Schema(
  {
    resource: {
      type: String,
      enum: FINANCE_RESOURCES,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const FinanceDatasetModel = model("FinanceDataset", FinanceDatasetSchema);
