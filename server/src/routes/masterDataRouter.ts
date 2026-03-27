import { Router } from "express";
import {
  ACCOUNT_TYPES,
  ACCOUNT_OWNERSHIPS,
  TOPUP_STATUSES,
  addAccount,
  addBank,
  addCard,
  addCardTemplate,
  addPerson,
  addTopup,
  addTopupNote,
  createSystemUser,
  listMasterData,
} from "../core/db/local/masterDataStore.js";

export const masterDataRouter = Router();

masterDataRouter.get("/master/constants", (_req, res) => {
  res.json({
    ok: true,
    accountTypes: ACCOUNT_TYPES,
    accountOwnerships: ACCOUNT_OWNERSHIPS,
    topupStatuses: TOPUP_STATUSES,
  });
});

masterDataRouter.get("/master/all", async (_req, res) => {
  const data = await listMasterData();
  res.json({ ok: true, ...data });
});

masterDataRouter.post("/master/banks", async (req, res) => {
  const { name, swift, country } = req.body;
  if (!name) return res.status(400).json({ ok: false, error: "name is required" });
  const record = await addBank({ name: String(name), swift: swift ? String(swift) : undefined, country: country ? String(country) : undefined });
  res.json({ ok: true, item: record });
});

masterDataRouter.post("/master/people", async (req, res) => {
  const { firstName, lastName, phone, address, city, state, zip, isSystem, username, password } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ ok: false, error: "firstName and lastName are required" });
  const record = await addPerson({
    firstName: String(firstName),
    lastName: String(lastName),
    phone: phone ? String(phone) : undefined,
    address: address ? String(address) : undefined,
    city: city ? String(city) : undefined,
    state: state ? String(state) : undefined,
    zip: zip ? String(zip) : undefined,
  });

  let systemUser: unknown = null;
  if (Boolean(isSystem)) {
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "username and password are required when isSystem is true" });
    }
    systemUser = await createSystemUser({
      personId: record.id,
      username: String(username),
      password: String(password),
    });
  }

  res.json({ ok: true, item: record, systemUser });
});

masterDataRouter.post("/master/card-templates", async (req, res) => {
  const { templateName, bankId, address, city, state, zip } = req.body;
  if (!templateName || !bankId || !address || !city || !state || !zip) {
    return res.status(400).json({ ok: false, error: "templateName, bankId, address, city, state, zip are required" });
  }

  const record = await addCardTemplate({
    templateName: String(templateName),
    bankId: String(bankId),
    address: String(address),
    city: String(city),
    state: String(state),
    zip: String(zip),
  });

  res.json({ ok: true, item: record });
});

masterDataRouter.post("/master/cards", async (req, res) => {
  const { cardNumber, expiryMonth, expiryYear, cvv, address, city, state, zip, holderPersonId, bankId } = req.body;
  if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !address || !city || !state || !zip || !holderPersonId || !bankId) {
    return res.status(400).json({ ok: false, error: "missing required card fields" });
  }

  const record = await addCard({
    cardNumber: String(cardNumber),
    expiryMonth: String(expiryMonth),
    expiryYear: String(expiryYear),
    cvv: String(cvv),
    address: String(address),
    city: String(city),
    state: String(state),
    zip: String(zip),
    holderPersonId: String(holderPersonId),
    bankId: String(bankId),
  });

  res.json({ ok: true, item: record });
});

masterDataRouter.post("/master/accounts", async (req, res) => {
  const {
    bankId,
    accountOwnership,
    accountType,
    balance,
    companyName,
    firstName,
    lastName,
    address,
    contactInfo,
  } = req.body;
  if (!bankId || !accountOwnership || !accountType || balance === undefined) {
    return res.status(400).json({
      ok: false,
      error: "bankId, accountOwnership, accountType, balance are required",
    });
  }

  const ownership = String(accountOwnership) as (typeof ACCOUNT_OWNERSHIPS)[number];
  if (!ACCOUNT_OWNERSHIPS.includes(ownership)) {
    return res.status(400).json({ ok: false, error: "invalid accountOwnership" });
  }

  if (!ACCOUNT_TYPES.includes(String(accountType) as (typeof ACCOUNT_TYPES)[number])) {
    return res.status(400).json({ ok: false, error: "invalid accountType" });
  }

  if (ownership === "business") {
    if (!companyName || !address || !contactInfo) {
      return res.status(400).json({ ok: false, error: "companyName, address, contactInfo are required for business accounts" });
    }
  } else {
    if (!firstName || !lastName || !address || !contactInfo) {
      return res.status(400).json({ ok: false, error: "firstName, lastName, address, contactInfo are required for personal accounts" });
    }
  }

  const record = await addAccount({
    bankId: String(bankId),
    accountOwnership: ownership,
    accountType: String(accountType) as (typeof ACCOUNT_TYPES)[number],
    balance: Number(balance),
    companyName: ownership === "business" ? String(companyName) : undefined,
    firstName: ownership === "personal" ? String(firstName) : undefined,
    lastName: ownership === "personal" ? String(lastName) : undefined,
    address: String(address),
    contactInfo: String(contactInfo),
  });

  res.json({ ok: true, item: record });
});

masterDataRouter.post("/master/topups", async (req, res) => {
  const { cardId, accountId, loadedAmount, totalAmount, status, commissionRate } = req.body;
  if (!cardId || !accountId || loadedAmount === undefined || totalAmount === undefined || !status || commissionRate === undefined) {
    return res.status(400).json({ ok: false, error: "cardId, accountId, loadedAmount, totalAmount, status, commissionRate are required" });
  }

  if (!TOPUP_STATUSES.includes(String(status) as (typeof TOPUP_STATUSES)[number])) {
    return res.status(400).json({ ok: false, error: "invalid topup status" });
  }

  const record = await addTopup({
    cardId: String(cardId),
    accountId: String(accountId),
    loadedAmount: Number(loadedAmount),
    totalAmount: Number(totalAmount),
    status: String(status) as (typeof TOPUP_STATUSES)[number],
    commissionRate: Number(commissionRate),
  });

  res.json({ ok: true, item: record });
});

masterDataRouter.post("/master/topups/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  if (!note) return res.status(400).json({ ok: false, error: "note is required" });

  const updated = await addTopupNote(String(id), String(note));
  if (!updated) return res.status(404).json({ ok: false, error: "topup not found" });
  res.json({ ok: true, item: updated });
});
