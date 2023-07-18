import express, { Request, Response } from "express";
import { SmartContractClient } from "../clients/SmartContractClient.ts";

const router = express.Router();

router.get("/candidate", async (req: Request, res: Response) => {
    try {
        const client = SmartContractClient.getInstance();
        const candidate = await client.getCandidate();
        res.status(200).json({ candidate });
    } catch (e: any) {
        console.warn("CAUGHT ERROR:", e);
        res.status(500).json({ error: e.message });
    }
});

router.get("/airlines", async (req: Request, res: Response) => {
    try {
        const client = SmartContractClient.getInstance();
        const airlines = await client.getAirlines();
        res.status(200).json({ airlines });
    } catch (e: any) {
        console.warn("CAUGHT ERROR:", e);
        res.status(500).json({ error: e.message });
    }
});

router.get("/isVoting", async (req: Request, res: Response) => {
    try {
        const client = SmartContractClient.getInstance();
        const isVoting = await client.isVoting();
        res.status(200).json({ isVoting });
    } catch (e: any) {
        console.warn("CAUGHT ERROR:", e);
        res.status(500).json({ error: e.message });
    }
});

router.post("/propose", async (req: Request, res: Response) => {
    const { name, ethAddress, iExecAddress } = req.body;
    if (!name || !ethAddress || !iExecAddress) {
        res.status(400).json({ error: "Missing parameters" });
        return;
    }
    try {
        const client = SmartContractClient.getInstance();
        await client.proposeAirline(name, ethAddress, iExecAddress);
        res.status(200).json({ message: "OK" });
    } catch (e: any) {
        console.warn("CAUGHT ERROR:", e);
        res.status(500).json({ error: e.message });
    }
});

router.post("/vote", async (req: Request, res: Response) => {
    const { vote } = req.body;
    if (vote === undefined) {
        res.status(400).json({ error: "Missing parameters" });
        return;
    }
    try {
        const client = SmartContractClient.getInstance();
        await client.vote(vote);
        console.log("Voted", vote);
        res.status(200).json({ message: "OK" });
    } catch (e: any) {
        console.warn("CAUGHT ERROR:", e);
        res.status(500).json({ error: e.message });
    }
});

router.get("/onProposed", async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");
    const client = SmartContractClient.getInstance();
    try {
        client.onPropose((data) => {
            res.write(`data: ${data}\n\n`);
        });
    } catch (e: any) {
        console.warn("CAUGHT ERROR:", e);
        res.status(500).json({ error: e.message });
    }
});

router.get("/onRejected", async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");
    const client = SmartContractClient.getInstance();
    try {
        client.onRejected((data) => {
            res.write(`data: ${data}\n\n`);
        });
    } catch (e: any) {
        console.warn("CAUGHT ERROR:", e);
        res.status(500).json({ error: e.message });
    }
});

router.get("/onAdded", async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");
    const client = SmartContractClient.getInstance();
    try {
        client.onAdded((data) => {
            res.write(`data: ${data}\n\n`);
        });
    } catch (e: any) {
        console.warn("CAUGHT ERROR:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
