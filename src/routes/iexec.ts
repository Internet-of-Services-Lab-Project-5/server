import express, { Request, Response } from "express";
import { GramineClient, SconeClient, DealStatus } from "../clients/IExecClient.ts";

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
        const statusKey = await iexec.order(body);
        if (statusKey) res.status(200).json({ statusKey });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post("/checkStatus", async (req: Request, res: Response) => {
    const statusKey = req.body.statusKey;
    if (!statusKey || typeof statusKey !== "string") {
        res.status(400).json({ error: "Missing parameters" });
        return;
    }
    const status = DealStatus.getInstance();
    if (status.status[statusKey]) {
        res.status(200).json(status.status[statusKey]);
    } else {
        res.status(404).json({ tasksCount: 0, tasksDone: 0, error: "Not found" });
    }
});

router.post("/saveStatus", async (req: Request, res: Response) => {
    const { statusKey, tasksCount, tasksDone, apiKey } = req.body;
    if (apiKey !== process.env.STATUS_API_KEY) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (!statusKey || tasksCount === undefined || tasksDone === undefined) {
        res.status(400).json({ error: "Missing parameters" });
        return;
    }
    const status = DealStatus.getInstance();
    status.status[statusKey].tasksCount = tasksCount;
    status.status[statusKey].tasksDone = tasksDone;
    console.log(status.status);
    res.status(200).send();
});

router.post("/fetchResults", async (req: Request, res: Response) => {
    const { statusKey } = req.body;
    const status = DealStatus.getInstance();
    if (!statusKey || !status.status[statusKey] || !status.status[statusKey].dealId) {
        res.status(400).json({ error: "No status found" });
        return;
    }

    const iexec = await GramineClient.getInstance();
    const results = (await iexec.getResult(status.status[statusKey].dealId)) || [];
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
