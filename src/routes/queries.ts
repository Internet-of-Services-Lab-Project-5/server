import express, { Request, Response, NextFunction } from "express";
import { DatabaseClient } from "../clients/DatabaseClient.ts";

const router = express.Router();

router.get("/", async (_: Request, res: Response) => {
  try {
    const dbClient = await DatabaseClient.getInstance();
    const rows = await dbClient.getRows();
    res.status(200).json(rows);
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const dbClient = await DatabaseClient.getInstance();
    const { firstname, lastname, birthdate, incident, incidentDate } = req.body;
    const row = { firstname, lastname, birthdate, incident, incidentDate };
    const value = await dbClient.addRow(row);
    res.status(200).json(value);
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

// router.delete("/", async (req: Request, res: Response) => {
//   const { first_name, last_name, birthdate } = req.body;
//   pool.query(
//     "DELETE FROM " +
//       table.name +
//       " WHERE " +
//       table.first_name +
//       " = $1 AND " +
//       table.last_name +
//       " = $2 AND " +
//       table.birthdate +
//       " = $3",
//     [first_name, last_name, birthdate],
//     (error, _) => {
//       if (error) {
//         throw error;
//       }
//       res.status(200).send(`User deleted`);
//     }
//   );
// });

export default router;
