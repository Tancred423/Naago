import {
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const setups = mysqlTable("setups", {
  id: int("id").primaryKey().autoincrement(),
  guildId: varchar("guild_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  channelId: varchar("channel_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  uniqueSetup: uniqueIndex("unique_setup").on(table.guildId, table.type),
  guildIdx: index("idx_guild").on(table.guildId),
  typeIdx: index("idx_type").on(table.type),
}));

export type Setup = typeof setups.$inferSelect;
export type NewSetup = typeof setups.$inferInsert;
