import express, { Request, Response } from "express";
import { AirlineListController } from "../controllers/AirlineListController.ts";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
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

export default router;
