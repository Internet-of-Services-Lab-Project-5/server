import pg from "pg";
import { DBEntry } from "../types";

const TABLE = "mytable" as const;
const COLS = ["first_name", "last_name", "birthdate", "incident", "incident_date"] as const;
const FILENAME = "../dataset.csv";

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
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "mypostgress",
      database: "mydatabase",
    });
    await this.client.connect();
    console.log("Database connected!");
  }

  async getRows() {
    //TODO: type of rows?
    if (!this.client) throw new Error("Client not connected.");
    const result = await this.client.query(`SELECT * FROM ${TABLE}`);
    return result.rows;
  }

  async addRow(value: DBEntry) {
    if (!this.client) throw new Error("Client not connected.");
    const result = await this.client.query(
      `INSERT INTO ${TABLE} (id, ${COLS.join(
        ", "
      )}) VALUES ((SELECT MAX(id)+1 FROM ${TABLE}), $1, $2, $3, $4, $5) RETURNING *`,
      [value.firstname, value.lastname, value.birthdate, value.incident, value.incidentDate]
    );
    return result.rows[0];
  }
}
