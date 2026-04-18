import { mysqlTable, varchar, datetime, tinyint } from "drizzle-orm/mysql-core";

export const otpTokens = mysqlTable("OtpToken", {
  id: varchar("id", { length: 191 }).primaryKey(),
  email: varchar("email", { length: 191 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: datetime("expiresAt", { fsp: 3 }).notNull(),
  usedAt: datetime("usedAt", { fsp: 3 }),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const users = mysqlTable("User", {
  id: varchar("id", { length: 191 }).primaryKey(),
  email: varchar("email", { length: 191 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 191 }).notNull(),
  displayName: varchar("displayName", { length: 191 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const closeFriends = mysqlTable("CloseFriend", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  friendId: varchar("friendId", { length: 191 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const contactInfo = mysqlTable("ContactInfo", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  discordHandle: varchar("discordHandle", { length: 191 }),
  fluxerHandle: varchar("fluxerHandle", { length: 191 }),
  matrixHandle: varchar("matrixHandle", { length: 191 }),
  signalNumber: varchar("signalNumber", { length: 191 }),
  whatsappNumber: varchar("whatsappNumber", { length: 191 }),
});

export const events = mysqlTable("Event", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: varchar("title", { length: 191 }).notNull(),
  description: varchar("description", { length: 191 }),
  startAt: datetime("startAt", { fsp: 3 }).notNull(),
  endAt: datetime("endAt", { fsp: 3 }),
  allDay: tinyint("allDay").notNull().default(0),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
  creatorId: varchar("creatorId", { length: 191 }).notNull(),
});
