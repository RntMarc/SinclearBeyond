import {
  bigint,
  date,
  datetime,
  double,
  longtext,
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

export const changelogEntries = mysqlTable("ChangelogEntry", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", [
    "feature",
    "bugfix",
    "improvement",
    "maintenance",
    "security",
  ]).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const readStatuses = mysqlTable("ReadStatus", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  entityType: varchar("entityType", { length: 191 }).notNull(),
  entityId: varchar("entityId", { length: 191 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const users = mysqlTable("User", {
  id: varchar("id", { length: 191 }).primaryKey(),
  email: varchar("email", { length: 191 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 191 }).notNull(),
  displayName: varchar("displayName", { length: 191 }).notNull(),
  birthday: datetime("birthday", { fsp: 3 }),
  birthdayVisibility: tinyint("birthdayVisibility").notNull().default(1),
  emailVisibility: tinyint("emailVisibility").notNull().default(1),
  isAdmin: tinyint("isAdmin").notNull().default(0),
  discordId: varchar("discordId", { length: 191 }),
  image: longtext("image"),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const userPreferences = mysqlTable("UserPreferences", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  language: varchar("language", { length: 10 }).notNull().default("de"),
  theme: mysqlEnum("theme", ["light", "dark"]).notNull().default("dark"),
  primaryColor: varchar("primaryColor", { length: 7 })
    .notNull()
    .default("#7c3aed"),
  timezone: varchar("timezone", { length: 191 }),
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
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  start: datetime("start").notNull(),
  end: datetime("end").notNull(),
  hasTickets: mysqlEnum("hastickets", ["1", "0"]).default("0"),
  ticketId: varchar("ticket", { length: 191 }),
  ticketUrl: text("ticketUrl"),
});

export const travelEvents = mysqlTable("TravelEvent", {
  id: varchar("ID", { length: 191 }).primaryKey(),
  tripId: varchar("trip", { length: 191 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  start: datetime("start").notNull(),
  end: datetime("end").notNull(),
  hasTickets: mysqlEnum("hastickets", ["1", "0"]).default("0"),
  ticketId: varchar("ticket", { length: 191 }),
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
  id: varchar("ID", { length: 191 }).primaryKey(),
  userId: varchar("userid", { length: 191 }).notNull(),
  tripId: varchar("tripid", { length: 191 }).notNull(),
  accommodationId: varchar("accommodation", { length: 191 }),
});

export const eventRelations = mysqlTable("EventRelation", {
  id: varchar("id", { length: 191 }).primaryKey(),
  eventId: varchar("eventId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const travelAccommodations = mysqlTable("TravelAccommodation", {
  id: varchar("ID", { length: 191 }).primaryKey(),
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
  id: varchar("ID", { length: 191 }).primaryKey(),
  type: mysqlEnum("type", ["event", "trip", "user"]).notNull(),
  eventId: varchar("event", { length: 191 }),
  tripId: varchar("trip", { length: 191 }),
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

export const feedPosts = mysqlTable("FeedPosts", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  category: mysqlEnum("category", [
    "music",
    "video",
    "news",
    "other",
  ]).notNull(),
  content: text("content"), // Optional general comment/reason

  // Music specific
  artist: varchar("artist", { length: 255 }),
  title: varchar("title", { length: 255 }),
  spotifyUrl: text("spotifyUrl"),
  youtubeMusicUrl: text("youtubeMusicUrl"),
  youtubeUrl: text("youtubeUrl"),
  soundcloudUrl: text("soundcloudUrl"),

  // Video specific
  videoUrl: text("videoUrl"),
  videoPlatform: varchar("videoPlatform", { length: 100 }), // e.g. YouTube, PeerTube, Twitch

  // News specific
  newsTitle: varchar("newsTitle", { length: 255 }),
  newsSite: varchar("newsSite", { length: 255 }),
  newsUrl: text("newsUrl"),

  // Other specific
  otherTitle: varchar("otherTitle", { length: 255 }),
  otherUrl: text("otherUrl"),

  visibility: tinyint("visibility").notNull().default(1), // 1 = Alle, 2 = Enge Kontakte
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
  updatedAt: datetime("updatedAt", { fsp: 3 }).notNull(),
});

export const webauthnChallenges = mysqlTable("WebauthnChallenge", {
  id: varchar("id", { length: 191 }).primaryKey(),
  challenge: varchar("challenge", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }), // null for login, set for registration
  expiresAt: datetime("expiresAt", { fsp: 3 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

// ── Discover ──────────────────────────────────────────────────────────────────

export const discoverPlaces = mysqlTable("DiscoverPlace", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["gastronomy", "leisure"]).notNull(),
  address: text("address"),
  latitude: double("latitude"),
  longitude: double("longitude"),
  osmId: bigint("osmId", { mode: "number" }),
  osmType: varchar("osmType", { length: 1 }), // N, W, R
  phone: varchar("phone", { length: 191 }),
  website: text("website"),
  email: varchar("email", { length: 191 }),
  openingHours: text("openingHours"),
  lastUpdated: datetime("lastUpdated", { fsp: 3 }).notNull(),
  creatorId: varchar("creatorId", { length: 191 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const discoverGastronomy = mysqlTable("DiscoverGastronomy", {
  id: varchar("id", { length: 191 }).primaryKey(),
  placeId: varchar("placeId", { length: 191 }).notNull(),
  cuisine: varchar("cuisine", { length: 191 }),
});

export const discoverReviews = mysqlTable("DiscoverReview", {
  id: varchar("id", { length: 191 }).primaryKey(),
  placeId: varchar("placeId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  rating: tinyint("rating").notNull(),
  comment: text("comment"),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const discoverBookmarks = mysqlTable("DiscoverBookmark", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  placeId: varchar("placeId", { length: 191 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

// ── Feedback ──────────────────────────────────────────────────────────────────

export const feedbackSuggestions = mysqlTable("FeedbackSuggestion", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("userId", { length: 191 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", [
    "submitted",
    "planned",
    "next",
    "in_progress",
    "done",
    "cancelled",
    "rejected",
    "later",
  ])
    .notNull()
    .default("submitted"),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
  updatedAt: datetime("updatedAt", { fsp: 3 }).notNull(),
});

export const feedbackVotes = mysqlTable("FeedbackVote", {
  id: varchar("id", { length: 191 }).primaryKey(),
  suggestionId: varchar("suggestionId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptions = mysqlTable("Subscription", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  billingPeriodStart: date("billingPeriodStart").notNull(),
  billingPeriodEnd: date("billingPeriodEnd").notNull(),
  basePrice: double("basePrice").notNull(),
});

export const subscriptionRelations = mysqlTable("SubscriptionRelation", {
  id: varchar("id", { length: 191 }).primaryKey(),
  subscriptionId: varchar("subscriptionId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }),
  isUser: tinyint("isUser").notNull().default(1),
  userName: varchar("userName", { length: 255 }),
  hasPaid: tinyint("hasPaid").notNull().default(0),
});

// ── Reviews / Kritik ─────────────────────────────────────────────────────────

export const mediaItems = mysqlTable("MediaItem", {
  id: varchar("id", { length: 191 }).primaryKey(),
  type: mysqlEnum("type", ["game", "movie", "music"]).notNull(),
  format: mysqlEnum("format", ["movie", "series", "album", "song"]),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image: text("image"),
  externalId: varchar("externalId", { length: 191 }),
  releaseDate: varchar("releaseDate", { length: 100 }),
  links: longtext("links"),
  creatorId: varchar("creatorId", { length: 191 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
  updatedAt: datetime("updatedAt", { fsp: 3 }).notNull(),
});

export const mediaReviews = mysqlTable("MediaReview", {
  id: varchar("id", { length: 191 }).primaryKey(),
  itemId: varchar("itemId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  rating: tinyint("rating").notNull(),
  comment: text("comment"),
  platform: varchar("platform", { length: 191 }), // Only for games
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const seriesEpisodes = mysqlTable("SeriesEpisode", {
  id: varchar("id", { length: 191 }).primaryKey(),
  seriesId: varchar("seriesId", { length: 191 }).notNull(),
  seasonNumber: tinyint("seasonNumber").notNull(),
  episodeNumber: tinyint("episodeNumber").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  externalId: varchar("externalId", { length: 191 }),
  releaseDate: varchar("releaseDate", { length: 100 }),
});

export const episodeReviews = mysqlTable("EpisodeReview", {
  id: varchar("id", { length: 191 }).primaryKey(),
  episodeId: varchar("episodeId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  rating: tinyint("rating").notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const albumTracks = mysqlTable("AlbumTrack", {
  id: varchar("id", { length: 191 }).primaryKey(),
  albumId: varchar("albumId", { length: 191 }).notNull(),
  songId: varchar("songId", { length: 191 }).notNull(),
  trackNumber: tinyint("trackNumber"),
});

// ── Terminfinder (Polls) ─────────────────────────────────────────────────────

export const polls = mysqlTable("Poll", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  creatorId: varchar("creatorId", { length: 191 }).notNull(),
  finalizedOptionId: varchar("finalizedOptionId", { length: 191 }),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
  updatedAt: datetime("updatedAt", { fsp: 3 }).notNull(),
});

export const pollOptions = mysqlTable("PollOption", {
  id: varchar("id", { length: 191 }).primaryKey(),
  pollId: varchar("pollId", { length: 191 }).notNull(),
  startAt: datetime("startAt", { fsp: 3 }).notNull(),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const pollInvites = mysqlTable("PollInvite", {
  id: varchar("id", { length: 191 }).primaryKey(),
  pollId: varchar("pollId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  isIndispensable: tinyint("isIndispensable").notNull().default(0),
  createdAt: datetime("createdAt", { fsp: 3 }).notNull(),
});

export const pollVotes = mysqlTable("PollVote", {
  id: varchar("id", { length: 191 }).primaryKey(),
  optionId: varchar("optionId", { length: 191 }).notNull(),
  userId: varchar("userId", { length: 191 }).notNull(),
  availability: mysqlEnum("availability", ["yes", "maybe", "no"]).notNull(),
  updatedAt: datetime("updatedAt", { fsp: 3 }).notNull(),
});
