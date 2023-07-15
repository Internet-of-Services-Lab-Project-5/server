import express, { Request, Response } from "express";
import { InitSearchResponse } from "../types";
import { iExecController } from "../controllers/iExecController.ts";

const router = express.Router();

router.post("/", async (req: Request, res: Response<InitSearchResponse>) => {
  const body = req.body;
  console.log("Body", body);
  if (!body.firstname || !body.lastname || !body.birthdate) {
    res.status(400).json({ error: "Missing parameters" });
    return;
  }
  const { firstname, lastname, birthdate } = body;
  const iexec = await iExecController.getInstance();
  try {
    const dealId = await iexec.order(firstname, lastname, birthdate);
    if (dealId) res.status(200).json({ dealId });
  } catch (e: any) {
    console.warn("CAUGHT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
