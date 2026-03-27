// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";

const PUBLIC_PATH_PREFIXES = [
  "/docs",          // swagger ui
  "/vpos",          // vpos testleri (isteğe bağlı)
  "/live-swipe",    // live data
  "/health",        // health check
  "/api/msr",       // msr socket endpoints
  "/api/finance",   // frontend finance datasets
  "/api/nmi",       // nmi operations
  "/api/master",    // local master data endpoints
  "/api/onramp",    // crypto onramp endpoints
  "/api/auth",      // login endpoints
  "/api/balance-checker", // smart balance checker
];

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (PUBLIC_PATH_PREFIXES.some(p => req.path.startsWith(p))) {
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({
      error: "Missing Authorization header",
      path: req.path,
    });
  }

  next();
}
