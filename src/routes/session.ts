import express, { Request, Response } from "express";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const user = process.env.USERNAME;
    const password = process.env.PASSWORD;

    if (user !== req.body.user || password !== req.body.password) {
      res.status(401).json({ error: "Invalid user name or password." });
      return;
    }
    res.status(200).json({ loggedIn: true });
  } catch (e: any) {
    console.warn("CAUGHT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
