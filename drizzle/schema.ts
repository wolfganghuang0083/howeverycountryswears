import { pgTable, serial, text, varchar, integer, boolean, timestamp, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";

// ========== ENUMS ==========
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const memberTierEnum = pgEnum("member_tier", ["regular", "bookBuyer"]);
export const submissionStatusEnum = pgEnum("submission_status", ["pending", "approved", "rejected"]);
export const badgeTypeEnum = pgEnum("badge_type", [
  "explorer",
  "polyglot",
  "bookOwner",
  "swearMaster",
  "ambassador",
]);
export const pointsReasonEnum = pgEnum("points_reason", [
  "daily_login",
  "rate_card",
  "submit_ugc",
  "ugc_five_star",
  "ugc_weekly_rank",
]);

// ========== USERS ==========
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatar_url"),
  loginMethod: varchar("login_method", { length: 64 }),
  /** Set when email is verified (Google email_verified, or magic-link click). Null = unverified. */
  emailVerifiedAt: timestamp("email_verified_at"),
  role: roleEnum("role").default("user").notNull(),
  memberTier: memberTierEnum("member_tier").default("regular").notNull(),
  displayName: varchar("display_name", { length: 100 }),
  points: integer("points").default(0).notNull(),
  lastDailyBonus: timestamp("last_daily_bonus"),
  countriesVisited: integer("countries_visited").default(0).notNull(),
  phrasesListened: integer("phrases_listened").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ========== BOOK CODES ==========
export const bookCodes = pgTable("book_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedByUserId: integer("used_by_user_id"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BookCode = typeof bookCodes.$inferSelect;

// ========== SUBMISSIONS ==========
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countryName: varchar("country_name", { length: 100 }).notNull(),
  countryFlag: varchar("country_flag", { length: 10 }).default("🏳️").notNull(),
  phrase: varchar("phrase", { length: 500 }).notNull(),
  ipa: varchar("ipa", { length: 500 }),
  literal: varchar("literal", { length: 500 }),
  feelsLike: text("feels_like"),
  phraseType: varchar("phrase_type", { length: 100 }),
  langCode: varchar("lang_code", { length: 10 }),
  riskLevel: integer("risk_level").default(2).notNull(),
  status: submissionStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  voteCount: integer("vote_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

// ========== VOTES ==========
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  submissionId: integer("submission_id").notNull(),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("votes_user_submission_idx").on(table.userId, table.submissionId),
]);
export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

// ========== RATINGS ==========
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countrySlug: varchar("country_slug", { length: 100 }).notNull(),
  cardNumber: integer("card_number").notNull(),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("ratings_user_country_card_idx").on(table.userId, table.countrySlug, table.cardNumber),
]);
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

// ========== USER BADGES ==========
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeType: badgeTypeEnum("badge_type").notNull(),
  countrySlug: varchar("country_slug", { length: 100 }),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});
export type UserBadge = typeof userBadges.$inferSelect;

// ========== COUNTRY AMBASSADORS ==========
export const countryAmbassadors = pgTable("country_ambassadors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countrySlug: varchar("country_slug", { length: 100 }).notNull().unique(),
  countryName: varchar("country_name", { length: 100 }).notNull(),
  countryFlag: varchar("country_flag", { length: 10 }).default("🏳️").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});
export type CountryAmbassador = typeof countryAmbassadors.$inferSelect;

// ========== POINTS HISTORY ==========
export const pointsHistory = pgTable("points_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  reason: pointsReasonEnum("reason").notNull(),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type PointsHistory = typeof pointsHistory.$inferSelect;

// ========== REVIEWS ==========
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countrySlug: varchar("country_slug", { length: 100 }).notNull(),
  cardNumber: integer("card_number").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  authorName: varchar("author_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ========== NEWSLETTER SUBSCRIBERS (CRM Preview) ==========
export const newsletterStatusEnum = pgEnum("newsletter_status", ["pending", "confirmed", "unsubscribed"]);
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  country: varchar("country", { length: 100 }),
  locale: varchar("locale", { length: 16 }).default("en").notNull(),
  sourcePath: varchar("source_path", { length: 512 }).notNull(),
  status: newsletterStatusEnum("status").default("pending").notNull(),
  marketingConsent: boolean("marketing_consent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// ========== PAGE HITS (HTML request logging, human vs bot; no IP) ==========
export const pageHits = pgTable(
  "page_hits",
  {
    id: serial("id").primaryKey(),
    ts: timestamp("ts", { withTimezone: true }).defaultNow().notNull(),
    path: text("path").notNull(),
    userAgent: text("user_agent"),
    isBot: boolean("is_bot").default(false).notNull(),
    botName: text("bot_name"),
    country: text("country"),
    referer: text("referer"),
    source: text("source"), // 'beacon' | 'server'
  },
  (t) => [index("page_hits_ts_idx").on(t.ts)],
);
