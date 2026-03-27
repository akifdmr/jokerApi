// routes/vpos.router.ts
import { Router, Request, Response } from "express";
import { VakifbankVposClient } from "../core/Pos/VakifbankVposClient.js";

const router = Router();

/* ===================== CLIENT ===================== */

const vposClient = new VakifbankVposClient({
  endpoint: process.env.VPOS_ENDPOINT!,
  merchantId: process.env.VPOS_MERCHANT_ID!,
  terminalId: process.env.VPOS_TERMINAL_ID!,
  storeKey: process.env.VPOS_STORE_KEY!,
  currencyCode: "949", // TRY
});

/* ===================== HELPERS ===================== */

function ok(res: Response, data: unknown) {
  return res.json({ success: true, data });
}

function fail(res: Response, error: unknown) {
  console.error("VPOS ERROR:", error);
  return res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : "VPOS_ERROR",
  });
}

/**
 * @swagger
 * tags:
 *   name: VPOS
 *   description: VakıfBank vPOS işlemleri
 */

/* ===================== ROUTES ===================== */

/**
 * @swagger
 * /vpos/preauth:
 *   post:
 *     summary: PreAuth (Provizyon)
 *     tags: [VPOS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount, card]
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: ORD-1001
 *               amount:
 *                 type: number
 *                 example: 10000
 *               card:
 *                 type: object
 *                 required: [pan, expiry, cvv]
 *                 properties:
 *                   pan:
 *                     type: string
 *                     example: "4111111111111111"
 *                   expiry:
 *                     type: string
 *                     example: "2607"
 *                   cvv:
 *                     type: string
 *                     example: "123"
 *     responses:
 *       200:
 *         description: Provizyon sonucu
 */
router.post("/preauth", async (req: Request, res: Response) => {
  try {
    const { orderId, amount, card } = req.body;
    const result = await vposClient.preAuth(orderId, amount, card);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

/**
 * @swagger
 * /vpos/sale:
 *   post:
 *     summary: Sale (Satış)
 *     tags: [VPOS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount, card]
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               card:
 *                 $ref: '#/components/schemas/CardInfo'
 *     responses:
 *       200:
 *         description: Satış sonucu
 */
router.post("/sale", async (req: Request, res: Response) => {
  try {
    const { orderId, amount, card } = req.body;
    const result = await vposClient.sale(orderId, amount, card);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

/**
 * @swagger
 * /vpos/void:
 *   post:
 *     summary: Void (İptal)
 *     tags: [VPOS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount]
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: İptal sonucu
 */
router.post("/void", async (req: Request, res: Response) => {
  try {
    const { orderId, amount } = req.body;
    const result = await vposClient.void(orderId, amount);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

/**
 * @swagger
 * /vpos/transactions:
 *   get:
 *     summary: İşlem listesi
 *     tags: [VPOS]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           example: "20260101"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           example: "20260131"
 *     responses:
 *       200:
 *         description: İşlem listesi
 */
router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };

    const result = await vposClient.transactionList(startDate, endDate);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

export default router;
