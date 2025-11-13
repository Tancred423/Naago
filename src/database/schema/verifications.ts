import { boolean, index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const verifications = mysqlTable("verifications", {
  userId: varchar("user_id", { length: 255 }).primaryKey().notNull(),
  characterId: int("character_id").notNull(),
  verificationCode: varchar("verification_code", { length: 255 }).notNull(),
  isVerified: boolean("is_verified").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  characterIdx: index("idx_verifications_character").on(table.characterId),
  statusIdx: index("idx_verifications_status").on(table.isVerified),
}));

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
