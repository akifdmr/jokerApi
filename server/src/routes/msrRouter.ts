import { Router } from "express";
import { getMSRStream } from "../devices/msrStreamStore.js";
import { startMSRRuntime } from "../devices/msrRuntime.js";

export const msrRouter = Router();

/**
 * @swagger
 * /api/msr/start:
 *   post:
 *     summary: Start MSR runtime
 *     tags: [MSR]
 *     responses:
 *       200:
 *         description: MSR runtime started
 */
msrRouter.post("/msr/start", async (_req, res) => {
  await startMSRRuntime();
  res.json({ ok: true, message: "MSR runtime started" });
});

/**
 * @swagger
 * /api/msr/stream:
 *   get:
 *     summary: Live MSR swipe stream (last 20)
 *     tags: [MSR]
 *     responses:
 *       200:
 *         description: Recent MSR swipes
 */
msrRouter.get("/msr/stream", (_req, res) => {
  res.json({
    count: getMSRStream().length,
    items: getMSRStream()
  });
});
