import { int, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";

export const characterData = mysqlTable("character_data", {
  characterId: int("character_id").primaryKey().notNull(),
  latestUpdate: timestamp("latest_update").notNull(),
  jsonString: text("json_string").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type CharacterData = typeof characterData.$inferSelect;
export type NewCharacterData = typeof characterData.$inferInsert;
