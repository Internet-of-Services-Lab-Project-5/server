import pg from "pg";
import { DBEntry } from "../types";

const COLS = ["first_name", "last_name", "birthdate", "incident", "incident_date"] as const;

export class DatabaseClient {
    private client?: pg.Client;
    private static instance: DatabaseClient;

    constructor() {}

    static async getInstance(): Promise<DatabaseClient> {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new DatabaseClient();
            await DatabaseClient.instance.init();
        }
        return DatabaseClient.instance;
    }

    private async init() {
        this.client = new pg.Client({
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD || "mypostgress",
            database: process.env.DB_NAME || "mydatabase",
        });
        await this.client.connect();
        console.log("Database connected!");
    }

    async getRows() {
        if (!this.client) throw new Error("Client not connected.");
        const result = await this.client.query(`SELECT * FROM ${process.env.DB_TABLE}`);
        return result.rows;
    }

    async addRow(value: DBEntry) {
        if (!this.client) throw new Error("Client not connected.");
        const result = await this.client.query(
            `INSERT INTO ${process.env.DB_TABLE} (id, ${COLS.join(", ")}) VALUES ((SELECT MAX(id)+1 FROM ${
                process.env.DB_TABLE
            }), $1, $2, $3, $4, $5) RETURNING *`,
            [value.firstname, value.lastname, value.birthdate, value.incident, value.incidentDate]
        );
        return result.rows[0];
    }

    async addRows(values: DBEntry[]) {
        if (!this.client) throw new Error("Client not connected.");
        const result = await this.client.query(
            `INSERT INTO ${process.env.DB_TABLE} (id, ${COLS.join(", ")}) VALUES ${values
                .map((value) => `((SELECT MAX(id)+1 FROM ${process.env.DB_TABLE}), $1, $2, $3, $4, $5)`)
                .join(", ")}`,
            values.map((value) => [value.firstname, value.lastname, value.birthdate, value.incident, value.incidentDate])
        );
        return result;
    }

    async createTable() {
        if (!this.client) throw new Error("Client not connected.");
        const result = await this.client.query(
            `CREATE TABLE IF NOT EXISTS ${process.env.DB_TABLE} (id SERIAL PRIMARY KEY, ${COLS.join(" VARCHAR(255), ")} VARCHAR(255))`
        );
        return result;
    }

    async deleteRow(firstname: string, lastname: string, birthdate: string) {
        if (!this.client) throw new Error("Client not connected.");
        const result = await this.client.query(`DELETE FROM ${process.env.DB_TABLE} WHERE first_name = $1 AND last_name = $2 AND birthdate = $3`, [
            firstname,
            lastname,
            birthdate,
        ]);
        return result;
    }
}
