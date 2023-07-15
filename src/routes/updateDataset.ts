import express, { Request, Response, query } from "express";
import { iExecController } from "../controllers/iExecController.ts";
import { UpdateDatasetResponse } from "../types";
import { DatabaseController } from "../controllers/DatabaseController.ts";

const router = express.Router();

router.post("/", async (req: Request, res: Response<UpdateDatasetResponse>) => {
    try {
        const iexec = await iExecController.getInstance();
        const orderHash = await iexec.updateDataset();
        if (orderHash) res.status(201).send();
      } catch (e: any) {
        console.log(e);
        res.status(500).send();
      }
    });

export default router;
    