import express, { Request, Response } from "express";
import { GramineClient, SconeClient } from "../clients/IExecClient.ts";
import { DealStatus } from "../State.ts";

const router = express.Router();

router.post("/initSearch", async (req: Request, res: Response) => {
  const body = req.body;
  if (!body || !body.length) {
    console.log(body);
    res.status(400).json({ error: "Missing parameters" });
    return;
  }
  const iexec = await GramineClient.getInstance();
  try {
    const dealId = await iexec.order(body);
    if (dealId) res.status(200).json({ dealId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/checkStatus", async (req: Request, res: Response) => {
  const dealId = req.body.dealId;
  if (!dealId || typeof dealId !== "string") {
    res.status(400).json({ error: "Missing parameters" });
    return;
  }
  const status = DealStatus.getInstance();
  if (status.status[dealId]) {
    res.status(200).json(status.status[dealId]);
  } else {
    res.status(200).json({ tasksCount: 0, tasksDone: 0 });
  }
});

router.post("/saveStatus", async (req: Request, res: Response) => {
  const { dealId, tasksCount, tasksDone, apiKey } = req.body;
  if (apiKey !== process.env.STATUS_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!dealId || tasksCount === undefined || tasksDone === undefined) {
    res.status(400).json({ error: "Missing parameters" });
    return;
  }
  const status = DealStatus.getInstance();
  status.status[dealId] = { tasksCount, tasksDone };
  console.log(status.status);
  res.status(200).send();
});

router.post("/fetchResults", async (req: Request, res: Response) => {
  const { dealId } = req.body;
  const iexec = await GramineClient.getInstance();
  const results = (await iexec.getResult(dealId)) || [];
  res.status(200).json({ results });
});

router.post("/updateDataset", async (req: Request, res: Response) => {
  try {
    const iexec = await SconeClient.getInstance();
    const orderHash = await iexec.updateDataset();
    if (orderHash) res.status(201).send();
  } catch (e: any) {
    console.log(e);
    res.status(500).send();
  }
});

export default router;
