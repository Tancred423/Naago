import { load } from "@std/dotenv";
import { defineConfig } from "drizzle-kit";

await load({ export: true });

export default defineConfig({
  schema: "./db/schema/*.ts",
  out: "./db/migrations",
  dialect: "mysql",
  dbCredentials: {
    host: Deno.env.get("DB_HOST")!,
    port: parseInt(Deno.env.get("DB_PORT")!, 10),
    user: Deno.env.get("DB_USER")!,
    password: Deno.env.get("DB_PASS")!,
    database: Deno.env.get("DB_DATABASE")!,
  },
});
