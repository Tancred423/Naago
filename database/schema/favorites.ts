import {
  index,
  int,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const favorites = mysqlTable("favorites", {
  userId: varchar("user_id", { length: 255 }).notNull(),
  characterId: int("character_id").notNull(),
  characterName: varchar("character_name", { length: 255 }).notNull(),
  server: varchar("server", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.characterId] }),
  characterIdx: index("idx_favorites_character").on(table.characterId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
