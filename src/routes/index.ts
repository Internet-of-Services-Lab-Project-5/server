import express, { Request, Response, NextFunction } from "express";
import { IndexResponse } from "../types";

const router = express.Router();

router.get(
  "/",
  async (req: Request, res: Response<IndexResponse>, next: NextFunction) => {
    res.status(200).json({
      status: "ok",
    });
    next();
  }
);

export default router;
