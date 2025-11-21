import { Request, Response } from "express";
import * as HostingerService from "../providers/wixPaymentService.js";

export async function status(req: Request, res: Response) {
  try {
    const data = await HostingerService.checkStatus(process.env.HOSTINGER_KEY!);
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function deployProject(req: Request, res: Response) {
  try {
    const data = await HostingerService.deploy(process.env.HOSTINGER_KEY!, req.body);
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
