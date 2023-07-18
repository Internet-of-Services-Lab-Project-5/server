import express, { Request, Response } from "express";
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

router.post("/many", async (req: Request, res: Response) => {
    try {
        const dbClient = await DatabaseClient.getInstance();
        const { passengers } = req.body;
        const value = await dbClient.addRows(passengers);
        res.status(200).json(value);
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

router.post("/create", async (req: Request, res: Response) => {
    try {
        const dbClient = await DatabaseClient.getInstance();
        const value = await dbClient.createTable();
        res.status(200).json(value);
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

router.delete("/", async (req: Request, res: Response) => {
    try {
        const dbClient = await DatabaseClient.getInstance();
        const { firstname, lastname, birthdate } = req.body;
        const value = await dbClient.deleteRow(firstname, lastname, birthdate);
        res.status(200).json(value);
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

export default router;
