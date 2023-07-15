import express, { Request, Response, query } from "express";
import { CheckStatusResponse } from "../types";
import { iExecController } from "../controllers/iExecController.ts";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const dealId = req.query.dealId;
  if (!dealId || typeof dealId !== "string") {
    res.status(400).json({ error: "Missing parameters" });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");
  const iexec = await iExecController.getInstance();
  try {
    const obs = await iexec.getDealObservable(dealId);
    if (!obs) {
      res.status(500).json({ error: "No deal observable" });
      return;
    }
    const unsubscribe = obs.subscribe({
      next: (dealState: any) => {
        const { tasksCount, completedTasksCount } = dealState;
        res.write(`data: ${JSON.stringify({ tasksCount, completedTasksCount })}\n\n`);
      },
      complete: () => unsubscribe,
      error: (e: any) => {
        console.warn("CAUGHT ERROR:", e);
        unsubscribe();
      },
    });
    req.on("close", unsubscribe);
  } catch (e: any) {
    console.warn("CAUGHT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
