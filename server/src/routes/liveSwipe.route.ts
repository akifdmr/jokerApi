// src/routes/liveSwipe.route.ts
import { Router } from "express";
import { getLiveSwipe } from "../devices/liveSwipeStore.js";

const router = Router();

router.get("/live-swipe", (req, res) => {
  res.json(getLiveSwipe());
});

export default router;
