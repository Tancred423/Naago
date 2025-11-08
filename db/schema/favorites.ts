import {
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const favorites = mysqlTable("favorites", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  characterId: varchar("character_id", { length: 255 }).notNull(),
  characterName: varchar("character_name", { length: 255 }).notNull(),
  server: varchar("server", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFavorite: uniqueIndex("unique_favorite").on(
    table.userId,
    table.characterId,
  ),
  userIdx: index("idx_user").on(table.userId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
