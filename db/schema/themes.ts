import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const themes = mysqlTable("themes", {
  userId: varchar("user_id", { length: 255 }).primaryKey().notNull(),
  theme: varchar("theme", { length: 100 }).default("dark"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;
