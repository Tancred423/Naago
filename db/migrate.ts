import { load } from "@std/dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";

await load({ export: true });

const connection = await mysql.createConnection({
  host: Deno.env.get("DB_HOST")!,
  port: parseInt(Deno.env.get("DB_PORT")!, 10),
  user: Deno.env.get("DB_USER")!,
  password: Deno.env.get("DB_PASS")!,
  database: Deno.env.get("DB_DATABASE")!,
});

const db = drizzle(connection);

console.log("Running migrations...");
await migrate(db, { migrationsFolder: "./db/migrations" });
console.log("Migrations complete!");

await connection.end();
