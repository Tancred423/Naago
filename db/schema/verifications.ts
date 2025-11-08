import {
  boolean,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const verifications = mysqlTable("verifications", {
  userId: varchar("user_id", { length: 255 }).primaryKey().notNull(),
  characterId: varchar("character_id", { length: 255 }).notNull(),
  verificationCode: varchar("verification_code", { length: 255 }),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
