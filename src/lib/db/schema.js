import {
  bigint,
  datetime,
  double,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

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
  birthday: datetime("birthday", { fsp: 3 }),
  birthdayVisibility: tinyint("birthdayVisibility").notNull().default(1),
  isAdmin: tinyint("isAdmin").notNull().default(0),
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
  discordVisibility: tinyint("discordVisibility").notNull().default(1),
  fluxerVisibility: tinyint("fluxerVisibility").notNull().default(1),
  matrixVisibility: tinyint("matrixVisibility").notNull().default(1),
  signalVisibility: tinyint("signalVisibility").notNull().default(1),
  whatsappVisibility: tinyint("whatsappVisibility").notNull().default(1),
});

export const socialInfo = mysqlTable("SocialInfo", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  unsplashHandle: varchar("unsplashHandle", { length: 191 }),
  instagramHandle: varchar("instagramHandle", { length: 191 }),
  mastodonHandle: varchar("mastodonHandle", { length: 191 }),
  pixelfedHandle: varchar("pixelfedHandle", { length: 191 }),
  blueskyHandle: varchar("blueskyHandle", { length: 191 }),
  youtubeHandle: varchar("youtubeHandle", { length: 191 }),
  twitchHandle: varchar("twitchHandle", { length: 191 }),
  unsplashVisibility: tinyint("unsplashVisibility").notNull().default(1),
  instagramVisibility: tinyint("instagramVisibility").notNull().default(1),
  mastodonVisibility: tinyint("mastodonVisibility").notNull().default(1),
  pixelfedVisibility: tinyint("pixelfedVisibility").notNull().default(1),
  blueskyVisibility: tinyint("blueskyVisibility").notNull().default(1),
  youtubeVisibility: tinyint("youtubeVisibility").notNull().default(1),
  twitchVisibility: tinyint("twitchVisibility").notNull().default(1),
});

export const events = mysqlTable("Event", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: varchar("title", { length: 191 }).notNull(),
  description: varchar("description", { length: 191 }),
  startAt: datetime("startAt", { fsp: 3 }).notNull(),
  endAt: datetime("endAt", { fsp: 3 }),
  allDay: tinyint("allDay").notNull().default(0),
  isPublic: tinyint("isPublic").notNull().default(1),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
  creatorId: varchar("creatorId", { length: 191 }).notNull(),
});

export const eventPermissions = mysqlTable("EventPermission", {
  id: varchar("id", { length: 191 }).primaryKey(),
  eventId: varchar("eventId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  canView: tinyint("canView").notNull().default(1),
  canEdit: tinyint("canEdit").notNull().default(0),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

// ── Travel ────────────────────────────────────────────────────────────────────

export const travelTrips = mysqlTable("TravelTrip", {
  id: int("ID").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  start: datetime("start").notNull(),
  end: datetime("end").notNull(),
  hasTickets: mysqlEnum("hastickets", ["1", "0"]).default("0"),
  ticketId: int("ticket", { unsigned: true }), // <-- FIXED
  ticketUrl: text("ticketUrl"),
});

export const travelEvents = mysqlTable("TravelEvent", {
  id: int("ID").primaryKey().autoincrement(),
  tripId: int("trip", { unsigned: true }).notNull(), // <-- FIXED
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  start: datetime("start").notNull(),
  end: datetime("end").notNull(),
  hasTickets: mysqlEnum("hastickets", ["1", "0"]).default("0"),
  ticketId: int("ticket", { unsigned: true }), // <-- FIXED
  ticketUrl: text("ticketUrl"),
  url: text("url"),
  image: text("image"),
  organizer: varchar("organizer", { length: 255 }),
  address: text("address"),
  latitude: double("latitude"),
  longitude: double("longitude"),
  osmId: bigint("OSMID", { mode: "number" }),
});

export const travelRelations = mysqlTable("TravelRelation", {
  id: int("ID").primaryKey().autoincrement(),
  // varchar(191) — matches User.id UUID format after migration
  userId: varchar("userid", { length: 191 }).notNull(),
  tripId: int("tripid", { unsigned: true }).notNull(), // <-- FIXED
  accommodationId: int("accommodation", { unsigned: true }), // <-- FIXED
});

export const travelAccommodations = mysqlTable("TravelAccommodation", {
  id: int("ID").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  address: text("address"),
  osmId: bigint("OSMID", { mode: "number", unsigned: true }),
  latitude: double("latitude"),
  longitude: double("longitude"),
  phone: varchar("phone", { length: 100 }),
  mail: varchar("mail", { length: 191 }),
  isHotel: tinyint("ishotel").notNull(),
});

export const travelEventTickets = mysqlTable("TravelEventTicket", {
  id: int("ID").primaryKey().autoincrement(),
  type: mysqlEnum("type", ["event", "trip", "user"]).notNull(),
  eventId: int("event", { unsigned: true }), // <-- FIXED
  tripId: int("trip", { unsigned: true }), // <-- FIXED
  // varchar(191) — matches User.id UUID format after migration
  userId: varchar("user", { length: 191 }),
  qrcode: text("qrcode"),
  image: text("image"),
});

// ── WebAuthn / Passkeys ──────────────────────────────────────────────────────

export const passkeys = mysqlTable("Passkey", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  name: varchar("name", { length: 191 }).notNull(),
  credentialId: varchar("credentialId", { length: 191 }).notNull(),
  publicKey: text("publicKey").notNull(),
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  transports: text("transports"), // JSON string of AuthenticatorTransport[]
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
  lastUsedAt: datetime("lastUsedAt", { fsp: 3 }),
});

export const webauthnChallenges = mysqlTable("WebauthnChallenge", {
  id: varchar("id", { length: 191 }).primaryKey(),
  challenge: varchar("challenge", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }), // null for login, set for registration
  expiresAt: datetime("expiresAt", { fsp: 3 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});
