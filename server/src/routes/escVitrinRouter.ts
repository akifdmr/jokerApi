import { Router } from "express";
import {
  ESC_VITRIN_ITEM_TYPES,
  addEscVitrinItem,
  deleteEscVitrinItem,
  listEscVitrinItems,
  updateEscVitrinItem,
} from "../core/db/local/escVitrinStore.js";

export const escVitrinRouter = Router();

escVitrinRouter.get("/esc-vitrin/items", async (_req, res) => {
  const items = await listEscVitrinItems();
  res.json({ ok: true, items, types: ESC_VITRIN_ITEM_TYPES });
});

escVitrinRouter.post("/esc-vitrin/items", async (req, res) => {
  const { header, type, content, width, height } = req.body ?? {};
  if (!header || !type || !content) {
    return res.status(400).json({ ok: false, error: "header, type, content are required" });
  }

  if (!ESC_VITRIN_ITEM_TYPES.includes(String(type) as (typeof ESC_VITRIN_ITEM_TYPES)[number])) {
    return res.status(400).json({ ok: false, error: "invalid type" });
  }

  const parsedWidth = width === undefined || width === null || width === "" ? undefined : Number(width);
  const parsedHeight = height === undefined || height === null || height === "" ? undefined : Number(height);
  if (parsedWidth !== undefined && (!Number.isFinite(parsedWidth) || parsedWidth <= 0)) {
    return res.status(400).json({ ok: false, error: "invalid width" });
  }
  if (parsedHeight !== undefined && (!Number.isFinite(parsedHeight) || parsedHeight <= 0)) {
    return res.status(400).json({ ok: false, error: "invalid height" });
  }

  const item = await addEscVitrinItem({
    header: String(header),
    type: String(type) as (typeof ESC_VITRIN_ITEM_TYPES)[number],
    content: String(content),
    width: parsedWidth,
    height: parsedHeight,
  });

  return res.json({ ok: true, item });
});

escVitrinRouter.delete("/esc-vitrin/items/:id", async (req, res) => {
  const { id } = req.params;
  const ok = await deleteEscVitrinItem(String(id));
  if (!ok) return res.status(404).json({ ok: false, error: "not found" });
  return res.json({ ok: true });
});

escVitrinRouter.put("/esc-vitrin/items/:id", async (req, res) => {
  const { id } = req.params;
  const { header, type, content, width, height } = req.body ?? {};
  if (!header || !type || !content) {
    return res.status(400).json({ ok: false, error: "header, type, content are required" });
  }

  if (!ESC_VITRIN_ITEM_TYPES.includes(String(type) as (typeof ESC_VITRIN_ITEM_TYPES)[number])) {
    return res.status(400).json({ ok: false, error: "invalid type" });
  }

  const parsedWidth = width === undefined || width === null || width === "" ? undefined : Number(width);
  const parsedHeight = height === undefined || height === null || height === "" ? undefined : Number(height);
  if (parsedWidth !== undefined && (!Number.isFinite(parsedWidth) || parsedWidth <= 0)) {
    return res.status(400).json({ ok: false, error: "invalid width" });
  }
  if (parsedHeight !== undefined && (!Number.isFinite(parsedHeight) || parsedHeight <= 0)) {
    return res.status(400).json({ ok: false, error: "invalid height" });
  }

  const item = await updateEscVitrinItem(String(id), {
    header: String(header),
    type: String(type) as (typeof ESC_VITRIN_ITEM_TYPES)[number],
    content: String(content),
    width: parsedWidth,
    height: parsedHeight,
  });

  if (!item) return res.status(404).json({ ok: false, error: "not found" });
  return res.json({ ok: true, item });
});
