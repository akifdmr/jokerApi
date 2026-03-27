import { Router } from "express";
import {
  addSepaCompany,
  addSepaIban,
  addSepaMandate,
  listSepaCompanies,
  listSepaIbans,
  listSepaMandates,
} from "../core/db/local/sepaStore.js";

export const sepaRouter = Router();

/**
 * @openapi
 * /api/sepa/companies:
 *   get:
 *     summary: List SEPA companies
 *     tags: [SEPA]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Create SEPA company
 *     tags: [SEPA]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               cid: { type: string }
 * /api/sepa/ibans:
 *   get:
 *     summary: List SEPA IBANs
 *     tags: [SEPA]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Create SEPA IBAN
 *     tags: [SEPA]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [iban, holderName]
 *             properties:
 *               iban: { type: string }
 *               holderName: { type: string }
 *               companyId: { type: string }
 * /api/sepa/mandates:
 *   get:
 *     summary: List SEPA mandates
 *     tags: [SEPA]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Create SEPA SDD Core mandate
 *     tags: [SEPA]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [creditorCompanyId, debtorCompanyId, ibanId, amount, currency]
 *             properties:
 *               creditorCompanyId: { type: string }
 *               debtorCompanyId: { type: string }
 *               ibanId: { type: string }
 *               amount: { type: number }
 *               currency: { type: string, example: "EUR" }
 */
sepaRouter.get("/sepa/companies", async (_req, res) => {
  const items = await listSepaCompanies();
  res.json({ ok: true, items });
});

sepaRouter.post("/sepa/companies", async (req, res) => {
  const { name, cid } = req.body ?? {};
  if (!name) return res.status(400).json({ ok: false, error: "name is required" });
  const item = await addSepaCompany({ name: String(name), cid: cid ? String(cid) : undefined });
  res.json({ ok: true, item });
});

sepaRouter.get("/sepa/ibans", async (_req, res) => {
  const items = await listSepaIbans();
  res.json({ ok: true, items });
});

sepaRouter.post("/sepa/ibans", async (req, res) => {
  const { iban, holderName, companyId } = req.body ?? {};
  if (!iban || !holderName) {
    return res.status(400).json({ ok: false, error: "iban and holderName are required" });
  }
  const item = await addSepaIban({
    iban: String(iban),
    holderName: String(holderName),
    companyId: companyId ? String(companyId) : undefined,
  });
  res.json({ ok: true, item });
});

sepaRouter.get("/sepa/mandates", async (_req, res) => {
  const items = await listSepaMandates();
  res.json({ ok: true, items });
});

sepaRouter.post("/sepa/mandates", async (req, res) => {
  try {
    const { creditorCompanyId, debtorCompanyId, ibanId, amount, currency } = req.body ?? {};
    if (!creditorCompanyId || !debtorCompanyId || !ibanId || amount === undefined || !currency) {
      return res.status(400).json({ ok: false, error: "missing required fields" });
    }
    const item = await addSepaMandate({
      creditorCompanyId: String(creditorCompanyId),
      debtorCompanyId: String(debtorCompanyId),
      ibanId: String(ibanId),
      amount: Number(amount),
      currency: String(currency),
    });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: String(err) });
  }
});

