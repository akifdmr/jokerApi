import { Router } from "express";
import { getWhopDefaultCompanyId, whopEnabled } from "../core/providers/whop/whopClient.js";
import {
  whopGetCompany,
  whopListCompanies,
  whopListPayments,
  whopListProducts,
} from "../core/providers/whop/whopService.js";

export const whopRouter = Router();

/**
 * @openapi
 * /api/whop/status:
 *   get:
 *     summary: Whop configuration status
 *     tags: [Whop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Status
 * /api/whop/companies:
 *   get:
 *     summary: List companies available to the configured Whop API key
 *     tags: [Whop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Companies
 * /api/whop/companies/{companyId}:
 *   get:
 *     summary: Retrieve Whop company details
 *     tags: [Whop]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Company
 * /api/whop/products:
 *   get:
 *     summary: List products for a Whop company
 *     tags: [Whop]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Products
 * /api/whop/payments:
 *   get:
 *     summary: List payments for a Whop company
 *     tags: [Whop]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payments
 */
whopRouter.get("/whop/status", (_req, res) => {
  res.json({
    ok: true,
    enabled: whopEnabled(),
    defaultCompanyId: getWhopDefaultCompanyId() ?? null,
  });
});

whopRouter.get("/whop/companies", async (req, res) => {
  try {
    const { first, after, before, direction, parentCompanyId } = req.query;
    const data = await whopListCompanies({
      first: first ? Number(first) : undefined,
      after: after ? String(after) : undefined,
      before: before ? String(before) : undefined,
      direction: direction === "asc" ? "asc" : "desc",
      parentCompanyId: parentCompanyId ? String(parentCompanyId) : undefined,
    });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

whopRouter.get("/whop/companies/:companyId", async (req, res) => {
  try {
    const data = await whopGetCompany(String(req.params.companyId));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

whopRouter.get("/whop/products", async (req, res) => {
  try {
    const { companyId, first, after, before, direction } = req.query;
    const data = await whopListProducts({
      companyId: companyId ? String(companyId) : undefined,
      first: first ? Number(first) : undefined,
      after: after ? String(after) : undefined,
      before: before ? String(before) : undefined,
      direction: direction === "asc" ? "asc" : "desc",
    });
    res.json({ ok: true, data });
  } catch (err) {
    const message = String(err);
    const status = message.includes("company_id_required") ? 400 : 502;
    res.status(status).json({ ok: false, error: message });
  }
});

whopRouter.get("/whop/payments", async (req, res) => {
  try {
    const { companyId, first, after, before, direction, status } = req.query;
    const data = await whopListPayments({
      companyId: companyId ? String(companyId) : undefined,
      first: first ? Number(first) : undefined,
      after: after ? String(after) : undefined,
      before: before ? String(before) : undefined,
      direction: direction === "asc" ? "asc" : "desc",
      status: status ? String(status) : undefined,
    });
    res.json({ ok: true, data });
  } catch (err) {
    const message = String(err);
    const responseStatus = message.includes("company_id_required") ? 400 : 502;
    res.status(responseStatus).json({ ok: false, error: message });
  }
});
