import { Router } from "express";
import {
  FINANCE_RESOURCES,
  FinanceDatasetModel,
} from "../core/db/models/FinanceDataset.model.js";
import { isMongoConnected } from "../core/db/init/index.js";
import { getLocalFinanceItems } from "../core/db/local/financeLocalStore.js";

const resourceSet = new Set(FINANCE_RESOURCES);

export const financeRouter = Router();

financeRouter.get("/finance/:resource", async (req, res) => {
  try {
    const { resource } = req.params;

    if (!resourceSet.has(resource as (typeof FINANCE_RESOURCES)[number])) {
      return res.status(400).json({
        ok: false,
        error: `Unsupported resource: ${resource}`,
      });
    }

    if (!isMongoConnected()) {
      const localItems = await getLocalFinanceItems(
        resource as
          | "dashboard"
          | "assets"
          | "customers"
          | "partners"
          | "accounts"
          | "transactions"
      );

      return res.json({
        ok: true,
        resource,
        source: "local-file-db",
        items: localItems,
        updatedAt: null,
      });
    }

    const dataset = await FinanceDatasetModel.findOne({ resource }).lean();

    return res.json({
      ok: true,
      resource,
      source: "mongodb",
      items: dataset?.items ?? [],
      updatedAt: dataset?.updatedAt ?? null,
    });
  } catch (error: unknown) {
    console.error("❌ finance route error", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to read finance dataset",
    });
  }
});
