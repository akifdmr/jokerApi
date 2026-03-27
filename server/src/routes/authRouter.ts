import { Router } from "express";
import { verifySystemUser } from "../core/db/local/masterDataStore.js";

export const authRouter = Router();

authRouter.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "username and password are required" });
  }

  const user = await verifySystemUser(String(username), String(password));
  if (!user) {
    return res.status(401).json({ ok: false, error: "invalid credentials" });
  }

  return res.json({
    ok: true,
    user,
    token: `local-${user.id}`,
  });
});
