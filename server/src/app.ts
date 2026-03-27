import express from "express";
import { balanceRouter } from "./routes/balanceRouter.js";
import { msrRouter } from "./routes/msrRouter.js";
import { setupSwagger } from "./swagger.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import liveSwipeRouter  from "./routes/liveSwipe.route.js";
import vposRouter  from "./routes/vPosRouter.js";
import { financeRouter } from "./routes/financeRouter.js";
import { nmiRouter } from "./routes/nmiRouter.js";
import { masterDataRouter } from "./routes/masterDataRouter.js";
import { onrampRouter } from "./routes/onrampRouter.js";
import { authRouter } from "./routes/authRouter.js";
import { balanceCheckerRouter } from "./routes/balanceCheckerRouter.js";
import { escVitrinRouter } from "./routes/escVitrinRouter.js";
import { braintreeRouter } from "./routes/braintreeRouter.js";
import { fraudRouter } from "./routes/fraudRouter.js";
import { merchantRouter } from "./routes/merchantRouter.js";
import { mxRouter } from "./routes/mxRouter.js";
import { moovRouter } from "./routes/moovRouter.js";
import { sepaRouter } from "./routes/sepaRouter.js";
import { whopRouter } from "./routes/whopRouter.js";



const app = express();

const corsOrigin = process.env.CORS_ORIGIN?.trim();
const allowedOrigins = corsOrigin
  ? corsOrigin.split(",").map((item) => item.trim()).filter(Boolean)
  : [];
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "payment-manager-api" });
});


app.use("/api", liveSwipeRouter);
app.use("/api", msrRouter);
app.use("/api", vposRouter);
app.use("/api", financeRouter);
app.use("/api", nmiRouter);
app.use("/api", masterDataRouter);
app.use("/api", onrampRouter);
app.use("/api", authRouter);
app.use("/api", balanceCheckerRouter);
app.use("/api", escVitrinRouter);
app.use("/api", braintreeRouter);
app.use("/api", merchantRouter);
app.use(authMiddleware);
app.use("/api", fraudRouter);
app.use("/api", mxRouter);
app.use("/api", moovRouter);
app.use("/api", whopRouter);
app.use("/api", sepaRouter);
app.use("/api", balanceRouter);

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Route not found"
  });
});

export default app;
