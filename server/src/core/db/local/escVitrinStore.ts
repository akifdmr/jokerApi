import { promises as fs } from "node:fs";
import path from "node:path";

export const ESC_VITRIN_ITEM_TYPES = ["tipbox", "content_widget", "iframe"] as const;
export type EscVitrinItemType = (typeof ESC_VITRIN_ITEM_TYPES)[number];

export interface EscVitrinItem {
  id: string;
  header: string;
  type: EscVitrinItemType;
  content: string; // iframe src or widget script src
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

interface EscVitrinStore {
  items: EscVitrinItem[];
}

const filePath = path.resolve(process.cwd(), "data", "esc-vitrin.json");

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

const defaultStore: EscVitrinStore = {
  items: [
    {
      id: "esc-tipbox-default",
      header: "Tip Box",
      type: "tipbox",
      content:
        "https://iwantclips.com/model/promotional_tool/view_banner_custom/1918149/25/200/500/1000/1250/2500",
      createdAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
    },
    {
      id: "esc-tipbox-1918149-100-5000",
      header: "Tip Box (100–5000)",
      type: "tipbox",
      content:
        "https://iwantclips.com/model/promotional_tool/view_banner_custom/1918149/100/250/500/1000/2500/5000",
      width: 250,
      height: 150,
      createdAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
    },
    {
      id: "esc-content-default",
      header: "Content Widget",
      type: "content_widget",
      content: "https://iwantclips.com/content_widget/widget_js/1918149",
      createdAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
    },
    {
      id: "esc-button-6210276",
      header: "Promo Button 6210276",
      type: "iframe",
      content: "https://iwantclips.com/model/promotional_tool/view_button_ext/6210276",
      width: 150,
      height: 35,
      createdAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
    },
    {
      id: "esc-button-6210258",
      header: "Promo Button 6210258",
      type: "iframe",
      content: "https://iwantclips.com/model/promotional_tool/view_button_ext/6210258",
      width: 150,
      height: 35,
      createdAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
    },
    {
      id: "esc-button-6210252",
      header: "Promo Button 6210252",
      type: "iframe",
      content: "https://iwantclips.com/model/promotional_tool/view_button_ext/6210252",
      width: 150,
      height: 35,
      createdAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
    },
    {
      id: "esc-button-6210210",
      header: "Promo Button 6210210",
      type: "iframe",
      content: "https://iwantclips.com/model/promotional_tool/view_button_ext/6210210",
      width: 150,
      height: 35,
      createdAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
    },
  ],
};

async function ensureStore() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<EscVitrinStore> {
  await ensureStore();
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as EscVitrinStore;
  if (!Array.isArray(parsed.items)) return { items: [] };
  return parsed;
}

async function writeStore(store: EscVitrinStore) {
  await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

export async function ensureEscVitrinStore() {
  await ensureStore();
  const store = await readStore();

  // Keep seeded defaults if missing.
  const byId = new Set(store.items.map((item) => item.id));
  const missing = defaultStore.items.filter((item) => !byId.has(item.id));
  if (missing.length > 0) {
    store.items.push(...missing);
    await writeStore(store);
  }
}

export async function listEscVitrinItems() {
  const store = await readStore();
  return store.items.slice().reverse();
}

export async function addEscVitrinItem(input: {
  header: string;
  type: EscVitrinItemType;
  content: string;
  width?: number;
  height?: number;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const item: EscVitrinItem = {
    id: createId("esc"),
    header: input.header,
    type: input.type,
    content: input.content,
    width: input.width,
    height: input.height,
    createdAt: now,
    updatedAt: now,
  };
  store.items.push(item);
  await writeStore(store);
  return item;
}

export async function deleteEscVitrinItem(id: string) {
  const store = await readStore();
  const before = store.items.length;
  store.items = store.items.filter((item) => item.id !== id);
  const changed = store.items.length !== before;
  if (changed) await writeStore(store);
  return changed;
}

export async function updateEscVitrinItem(
  id: string,
  patch: { header: string; type: EscVitrinItemType; content: string; width?: number; height?: number },
) {
  const store = await readStore();
  const index = store.items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const next: EscVitrinItem = {
    ...store.items[index],
    header: patch.header,
    type: patch.type,
    content: patch.content,
    width: patch.width,
    height: patch.height,
    updatedAt: now,
  };

  store.items[index] = next;
  await writeStore(store);
  return next;
}
