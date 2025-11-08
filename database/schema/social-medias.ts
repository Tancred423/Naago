import {
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const socialMedias = mysqlTable("social_medias", {
  id: int("id").primaryKey().autoincrement(),
  characterId: varchar("character_id", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 255 }),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  characterIdx: index("idx_character").on(table.characterId),
}));

export type SocialMedia = typeof socialMedias.$inferSelect;
export type NewSocialMedia = typeof socialMedias.$inferInsert;
