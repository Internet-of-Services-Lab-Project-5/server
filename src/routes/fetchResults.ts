import express, { Request, Response, NextFunction } from "express";
import { FetchResultsResponse } from "../types";
import { iExecController } from "../controllers/iExecController.ts";

const router = express.Router();

router.post("/", async (req: Request, res: Response<FetchResultsResponse>, next: NextFunction) => {
  const { dealId } = req.body;
  const iexec = await iExecController.getInstance();
  const results = (await iexec.getResult(dealId)) || [];
  res.status(200).json({ results });
  next();
});

export default router;
