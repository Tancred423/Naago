import {
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const topicData = mysqlTable("topic_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("idx_date").on(table.date),
}));

export const noticeData = mysqlTable("notice_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  tag: varchar("tag", { length: 255 }),
  date: timestamp("date").notNull(),
  link: text("link"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("idx_date").on(table.date),
}));

export const maintenanceData = mysqlTable("maintenance_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  tag: varchar("tag", { length: 255 }),
  date: timestamp("date").notNull(),
  link: text("link"),
  details: text("details"),
  mFrom: timestamp("m_from"),
  mTo: timestamp("m_to"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("idx_date").on(table.date),
  maintenancePeriodIdx: index("idx_maintenance_period").on(
    table.mFrom,
    table.mTo,
  ),
}));

export const updateData = mysqlTable("update_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("idx_date").on(table.date),
}));

export const statusData = mysqlTable("status_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  tag: varchar("tag", { length: 255 }),
  date: timestamp("date").notNull(),
  link: text("link"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("idx_date").on(table.date),
}));

export type TopicData = typeof topicData.$inferSelect;
export type NewTopicData = typeof topicData.$inferInsert;

export type NoticeData = typeof noticeData.$inferSelect;
export type NewNoticeData = typeof noticeData.$inferInsert;

export type MaintenanceData = typeof maintenanceData.$inferSelect;
export type NewMaintenanceData = typeof maintenanceData.$inferInsert;

export type UpdateData = typeof updateData.$inferSelect;
export type NewUpdateData = typeof updateData.$inferInsert;

export type StatusData = typeof statusData.$inferSelect;
export type NewStatusData = typeof statusData.$inferInsert;
