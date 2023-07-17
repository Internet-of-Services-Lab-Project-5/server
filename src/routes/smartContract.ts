import express, { Request, Response } from "express";
import { AirlineListController } from "../clients/SmartContractClient.ts";

const router = express.Router();

router.get("/vote", async (req: Request, res: Response) => {
  try {
    const controller = AirlineListController.getInstance();
    await controller.vote(true);
    console.log("Voted");
    res.status(200).json({ message: "OK" });
  } catch (e: any) {
    console.warn("CAUGHT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/onPropose", async (req: Request, res: Response) => {
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

//TODO: replace
router.get("/test", async (req: Request, res: Response) => {
  try {
    const controller = AirlineListController.getInstance();
    // await controller.vote(true);
    // await controller.getCandidate();
    // await controller.proposeAirline(
    //   "Something made up 2",
    //   "0x1234567898555434567856784567845678678780",
    //   "0x8446829789264896276472867367836786876437"
    // );
    // await controller.isVoting();
    // await controller.getCandidate();
    const airlines = await controller.getAirlines();
    res.status(200).json({ message: airlines });
  } catch (e: any) {
    console.warn("CAUGHT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
