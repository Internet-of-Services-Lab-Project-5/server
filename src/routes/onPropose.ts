import express, { Request, Response } from "express";
import { AirlineListController } from "../controllers/AirlineListController.ts";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");
  const controller = AirlineListController.getInstance();
  try {
    controller.onPropose((data) => {
      res.write(`data: ${data}\n\n`);
    });
  } catch (e: any) {
    console.warn("CAUGHT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
