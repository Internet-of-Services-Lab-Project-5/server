import express, { Request, Response } from "express";
import { AirlineListController } from "../controllers/AirlineListController.ts";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
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
