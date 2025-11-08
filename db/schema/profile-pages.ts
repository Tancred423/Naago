import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const profilePages = mysqlTable("profile_pages", {
  userId: varchar("user_id", { length: 255 }).primaryKey().notNull(),
  profilePage: varchar("profile_page", { length: 100 }).default("profile"),
  subProfilePage: varchar("sub_profile_page", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type ProfilePage = typeof profilePages.$inferSelect;
export type NewProfilePage = typeof profilePages.$inferInsert;
