import { load } from "@std/dotenv";
import mysql from "mysql2/promise";
import * as log from "@std/log";
import { createHash } from "node:crypto";

await load({ export: true });

const connection = await mysql.createConnection({
  host: Deno.env.get("DB_HOST")!,
  port: parseInt(Deno.env.get("DB_PORT")!, 10),
  user: Deno.env.get("DB_USER")!,
  password: Deno.env.get("DB_PASS")!,
  database: Deno.env.get("DB_DATABASE")!,
  multipleStatements: true,
});

const migrationsFolder = "./src/database/migrations";

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

interface DbMigration {
  id: number;
  hash: string;
  created_at: number;
}

async function ensureMigrationsTable(): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hash VARCHAR(255) NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<number>> {
  const [rows] = await connection.query("SELECT created_at FROM __drizzle_migrations");
  return new Set((rows as DbMigration[]).map((r) => r.created_at));
}

function hashSql(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();

  const journalPath = `${migrationsFolder}/meta/_journal.json`;
  const journalContent = await Deno.readTextFile(journalPath);
  const journal: Journal = JSON.parse(journalContent);

  const appliedMigrations = await getAppliedMigrations();

  log.info(`Found ${journal.entries.length} migrations in journal, ${appliedMigrations.size} already applied`);

  for (const entry of journal.entries) {
    if (appliedMigrations.has(entry.when)) {
      continue;
    }

    const sqlPath = `${migrationsFolder}/${entry.tag}.sql`;
    let sql: string;
    try {
      sql = await Deno.readTextFile(sqlPath);
    } catch {
      log.error(`Migration file not found: ${sqlPath}`);
      throw new Error(`Migration file not found: ${sqlPath}`);
    }

    log.info(`Applying migration: ${entry.tag}`);

    const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter((s) => s.length > 0);

    try {
      for (const statement of statements) {
        await connection.query(statement);
      }

      const hash = hashSql(sql);
      await connection.query(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
        [hash, entry.when],
      );

      log.info(`Migration ${entry.tag} applied successfully`);
    } catch (error) {
      log.error(`Failed to apply migration ${entry.tag}: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}

log.info("Running migrations...");
await runMigrations();
log.info("Migrations complete!");

await connection.end();
