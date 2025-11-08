import { mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const characterData = mysqlTable("character_data", {
  characterId: varchar("character_id", { length: 255 }).primaryKey().notNull(),
  latestUpdate: timestamp("latest_update"),
  jsonString: text("json_string"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type CharacterData = typeof characterData.$inferSelect;
export type NewCharacterData = typeof characterData.$inferInsert;
