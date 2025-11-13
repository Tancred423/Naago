import { index, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const topicData = mysqlTable("topic_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  date: timestamp("date").notNull(),
  banner: text("banner").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_topic_date").on(table.date),
}));

export const noticeData = mysqlTable("notice_data", {
  id: int("id").primaryKey().autoincrement(),
  tag: varchar("tag", { length: 255 }),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_notice_date").on(table.date),
}));

export const maintenanceData = mysqlTable("maintenance_data", {
  id: int("id").primaryKey().autoincrement(),
  tag: varchar("tag", { length: 255 }),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_maintenance_date").on(table.date),
  maintenancePeriodIdx: index("idx_maintenance_period").on(
    table.startDate,
    table.endDate,
  ),
}));

export const updateData = mysqlTable("update_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_update_date").on(table.date),
}));

export const statusData = mysqlTable("status_data", {
  id: int("id").primaryKey().autoincrement(),
  tag: varchar("tag", { length: 255 }),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_status_date").on(table.date),
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
