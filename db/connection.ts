import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema/index.ts";

const poolConnection = mysql.createPool({
  host: Deno.env.get("DB_HOST")!,
  port: parseInt(Deno.env.get("DB_PORT")!, 10),
  user: Deno.env.get("DB_USER")!,
  password: Deno.env.get("DB_PASS")!,
  database: Deno.env.get("DB_DATABASE")!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await poolConnection.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

export { poolConnection };
