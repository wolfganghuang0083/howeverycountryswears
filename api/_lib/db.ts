import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  users, submissions, votes, bookCodes,
  ratings, userBadges, countryAmbassadors, pointsHistory, reviews,
  newsletterSubscribers,
  type InsertSubmission, type InsertReview
} from "./schema.js";

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");
  const client = neon(databaseUrl);
  return drizzle(client);
}

// ========== USER HELPERS ==========
export async function upsertUser(user: {
  openId: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  loginMethod?: string;
  emailVerifiedAt?: Date | null;
}): Promise<typeof users.$inferSelect> {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

  if (existing.length > 0) {
    const nextVerified =
      user.emailVerifiedAt !== undefined
        ? (user.emailVerifiedAt ?? existing[0].emailVerifiedAt)
        : existing[0].emailVerifiedAt;
    // Never clear a prior verification
    const emailVerifiedAt =
      existing[0].emailVerifiedAt && nextVerified
        ? (existing[0].emailVerifiedAt <= nextVerified ? existing[0].emailVerifiedAt : nextVerified)
        : (existing[0].emailVerifiedAt ?? nextVerified ?? null);
    await db.update(users).set({
      name: user.name ?? existing[0].name,
      email: user.email ?? existing[0].email,
      avatarUrl: user.avatarUrl ?? existing[0].avatarUrl,
      loginMethod: user.loginMethod ?? existing[0].loginMethod,
      emailVerifiedAt,
      lastSignedIn: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, existing[0].id));
    const [updated] = await db.select().from(users).where(eq(users.id, existing[0].id)).limit(1);
    return updated;
  } else {
    const [newUser] = await db.insert(users).values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      avatarUrl: user.avatarUrl ?? null,
      loginMethod: user.loginMethod ?? "email",
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      lastSignedIn: new Date(),
    }).returning();
    return newUser;
  }
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserTier(userId: number, tier: "regular" | "bookBuyer") {
  const db = getDb();
  await db.update(users).set({ memberTier: tier, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserDisplayName(userId: number, displayName: string) {
  const db = getDb();
  await db.update(users).set({ displayName, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ========== POINTS SYSTEM ==========
export async function addPoints(userId: number, amount: number, reason: "daily_login" | "rate_card" | "submit_ugc" | "ugc_five_star" | "ugc_weekly_rank", referenceId?: number) {
  const db = getDb();
  await db.insert(pointsHistory).values({ userId, amount, reason, referenceId: referenceId ?? null });
  await db.update(users).set({ 
    points: sql`${users.points} + ${amount}`,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

export async function claimDailyLoginBonus(userId: number) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { claimed: false, reason: "User not found" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (user.lastDailyBonus && user.lastDailyBonus >= today) {
    return { claimed: false, reason: "Already claimed today" };
  }

  await addPoints(userId, 1, "daily_login");
  await db.update(users).set({ lastDailyBonus: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
  return { claimed: true, newPoints: user.points + 1 };
}

export async function getUserPoints(userId: number) {
  const db = getDb();
  const [user] = await db.select({ points: users.points }).from(users).where(eq(users.id, userId)).limit(1);
  const history = await db.select().from(pointsHistory).where(eq(pointsHistory.userId, userId)).orderBy(desc(pointsHistory.createdAt)).limit(20);
  return { total: user?.points ?? 0, history };
}

export async function getPointsLeaderboard(limit: number = 20) {
  const db = getDb();
  return db.select({
    id: users.id,
    name: users.name,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    points: users.points,
  }).from(users).orderBy(desc(users.points)).limit(limit);
}

// ========== RATING SYSTEM ==========
export async function upsertRating(userId: number, countrySlug: string, cardNumber: number, value: number) {
  const db = getDb();
  const existing = await db.select().from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.countrySlug, countrySlug), eq(ratings.cardNumber, cardNumber)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(ratings).set({ value, updatedAt: new Date() }).where(eq(ratings.id, existing[0].id));
  } else {
    await db.insert(ratings).values({ userId, countrySlug, cardNumber, value });
    await addPoints(userId, 2, "rate_card");
  }
}

export async function getCardRatings(countrySlug: string, cardNumbers: number[]) {
  if (cardNumbers.length === 0) return {};
  const db = getDb();
  const results = await db.select({
    cardNumber: ratings.cardNumber,
    avgRating: sql<number>`AVG(${ratings.value})::float`,
    count: sql<number>`COUNT(*)::int`,
  }).from(ratings)
    .where(eq(ratings.countrySlug, countrySlug))
    .groupBy(ratings.cardNumber);

  const map: Record<number, { avg: number; total: number }> = {};
  for (const r of results) {
    map[r.cardNumber] = { avg: Number(r.avgRating), total: r.count };
  }
  return map;
}

export async function getUserRatings(userId: number, countrySlug: string) {
  const db = getDb();
  const results = await db.select().from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.countrySlug, countrySlug)));
  const map: Record<number, number> = {};
  for (const r of results) {
    map[r.cardNumber] = r.value;
  }
  return map;
}

// ========== BOOK CODE ==========
export async function redeemBookCode(code: string, userId: number): Promise<boolean> {
  const db = getDb();
  const [bookCode] = await db.select().from(bookCodes)
    .where(and(eq(bookCodes.code, code), eq(bookCodes.isUsed, false)))
    .limit(1);

  if (!bookCode) return false;

  await db.update(bookCodes).set({ isUsed: true, usedByUserId: userId, usedAt: new Date() }).where(eq(bookCodes.id, bookCode.id));
  await updateUserTier(userId, "bookBuyer");
  return true;
}

export async function createBookCodes(codes: string[]) {
  const db = getDb();
  await db.insert(bookCodes).values(codes.map(code => ({ code })));
}

// ========== SUBMISSIONS ==========
export async function createSubmission(data: Omit<InsertSubmission, "id" | "createdAt" | "updatedAt" | "status" | "voteCount">) {
  const db = getDb();
  const [result] = await db.insert(submissions).values(data).returning({ id: submissions.id });
  await addPoints(data.userId, 10, "submit_ugc", result.id);
  return result.id;
}

export async function getSubmissions(opts: { status?: string; userId?: number; limit: number; offset: number }) {
  const db = getDb();
  let query = db.select().from(submissions).orderBy(desc(submissions.createdAt)).limit(opts.limit).offset(opts.offset);
  
  const conditions = [];
  if (opts.status) conditions.push(eq(submissions.status, opts.status as any));
  if (opts.userId) conditions.push(eq(submissions.userId, opts.userId));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const items = await query;
  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)::int` }).from(submissions);
  return { items, total };
}

export async function getSubmissionById(id: number) {
  const db = getDb();
  const [result] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  return result;
}

export async function updateSubmissionStatus(id: number, status: "approved" | "rejected", rejectionReason?: string) {
  const db = getDb();
  await db.update(submissions).set({ status, rejectionReason: rejectionReason ?? null, updatedAt: new Date() }).where(eq(submissions.id, id));
}

// ========== VOTES ==========
export async function upsertVote(userId: number, submissionId: number, value: number) {
  const db = getDb();
  const existing = await db.select().from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.submissionId, submissionId)))
    .limit(1);

  if (existing.length > 0) {
    const diff = value - existing[0].value;
    await db.update(votes).set({ value }).where(eq(votes.id, existing[0].id));
    await db.update(submissions).set({ voteCount: sql`${submissions.voteCount} + ${diff}` }).where(eq(submissions.id, submissionId));
  } else {
    await db.insert(votes).values({ userId, submissionId, value });
    await db.update(submissions).set({ voteCount: sql`${submissions.voteCount} + ${value}` }).where(eq(submissions.id, submissionId));
  }
}

export async function getUserVotes(userId: number, submissionIds: number[]) {
  if (submissionIds.length === 0) return {};
  const db = getDb();
  const results = await db.select().from(votes)
    .where(eq(votes.userId, userId));
  const map: Record<number, number> = {};
  for (const v of results) {
    if (submissionIds.includes(v.submissionId)) {
      map[v.submissionId] = v.value;
    }
  }
  return map;
}

// ========== DASHBOARD ==========
export async function getUserDashboardStats(userId: number) {
  const db = getDb();
  const [user] = await db.select({
    points: users.points,
    countriesVisited: users.countriesVisited,
    phrasesListened: users.phrasesListened,
  }).from(users).where(eq(users.id, userId)).limit(1);
  const [totalResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(submissions).where(eq(submissions.userId, userId));
  const [approvedResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(submissions).where(and(eq(submissions.userId, userId), eq(submissions.status, "approved")));
  const [pendingResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(submissions).where(and(eq(submissions.userId, userId), eq(submissions.status, "pending")));
  const [rejectedResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(submissions).where(and(eq(submissions.userId, userId), eq(submissions.status, "rejected")));
  const [votesResult] = await db.select({
    total: sql<number>`COALESCE(SUM(${submissions.voteCount}), 0)::int`,
  }).from(submissions).where(eq(submissions.userId, userId));
  return {
    totalSubmissions: totalResult.count,
    approvedCount: approvedResult.count,
    pendingCount: pendingResult.count,
    rejectedCount: rejectedResult.count,
    totalVotesReceived: Number(votesResult.total) || 0,
    points: user?.points || 0,
    countriesVisited: user?.countriesVisited || 0,
    phrasesListened: user?.phrasesListened || 0,
  };
}

export async function getTopContributors(limit: number = 10) {
  const db = getDb();
  return db.select({
    id: users.id,
    name: users.name,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    points: users.points,
    memberTier: users.memberTier,
  }).from(users).orderBy(desc(users.points)).limit(limit);
}

// ========== BADGES ==========
export async function getUserBadges(userId: number) {
  const db = getDb();
  return db.select().from(userBadges).where(eq(userBadges.userId, userId));
}

export async function checkAndAwardBadges(userId: number) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return [];

  const existingBadges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const hasBadge = (type: string) => existingBadges.some(b => b.badgeType === type);
  const newBadges: string[] = [];

  if (!hasBadge("explorer") && user.countriesVisited >= 10) {
    await db.insert(userBadges).values({ userId, badgeType: "explorer" });
    newBadges.push("explorer");
  }
  if (!hasBadge("polyglot") && user.phrasesListened >= 50) {
    await db.insert(userBadges).values({ userId, badgeType: "polyglot" });
    newBadges.push("polyglot");
  }
  if (!hasBadge("bookOwner") && user.memberTier === "bookBuyer") {
    await db.insert(userBadges).values({ userId, badgeType: "bookOwner" });
    newBadges.push("bookOwner");
  }
  if (!hasBadge("swearMaster") && user.points >= 500) {
    await db.insert(userBadges).values({ userId, badgeType: "swearMaster" });
    newBadges.push("swearMaster");
  }

  return newBadges;
}

// ========== TRACKING ==========
export async function incrementCountriesVisited(userId: number) {
  const db = getDb();
  await db.update(users).set({
    countriesVisited: sql`${users.countriesVisited} + 1`,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

export async function incrementPhrasesListened(userId: number) {
  const db = getDb();
  await db.update(users).set({
    phrasesListened: sql`${users.phrasesListened} + 1`,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

// ========== AMBASSADORS ==========
export async function getCountryAmbassadors() {
  const db = getDb();
  return db.select().from(countryAmbassadors);
}

export async function getAmbassadorForCountry(countrySlug: string) {
  const db = getDb();
  const [result] = await db.select().from(countryAmbassadors).where(eq(countryAmbassadors.countrySlug, countrySlug)).limit(1);
  return result ?? null;
}

// ========== REVIEWS ==========
export async function createReview(data: Omit<InsertReview, "id" | "createdAt" | "updatedAt">) {
  const db = getDb();
  const [result] = await db.insert(reviews).values(data).returning({ id: reviews.id });
  return result.id;
}

export async function getReviewsForCard(countrySlug: string, cardNumber: number, limit: number = 20, offset: number = 0) {
  const db = getDb();
  const items = await db.select().from(reviews)
    .where(and(eq(reviews.countrySlug, countrySlug), eq(reviews.cardNumber, cardNumber)))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)::int` }).from(reviews)
    .where(and(eq(reviews.countrySlug, countrySlug), eq(reviews.cardNumber, cardNumber)));
  return { items, total };
}

export async function getReviewSummaryForCountry(countrySlug: string) {
  const db = getDb();
  const results = await db.select({
    cardNumber: reviews.cardNumber,
    count: sql<number>`COUNT(*)::int`,
    avgRating: sql<number>`AVG(${reviews.rating})::float`,
  }).from(reviews)
    .where(eq(reviews.countrySlug, countrySlug))
    .groupBy(reviews.cardNumber);
  return results;
}

// ========== NEWSLETTER (CRM Preview — no email send) ==========
export async function upsertNewsletterSubscriber(input: {
  email: string;
  country?: string | null;
  locale: string;
  sourcePath: string;
  marketingConsent?: boolean;
}): Promise<{
  ok: true;
  status: "pending" | "confirmed" | "unsubscribed";
  marketingConsent: boolean;
  issueConfirm: boolean;
}> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const wantConsent = Boolean(input.marketingConsent);
  const existing = await db.select().from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];

    // Unsubscribed: only re-engage if checkbox checked; otherwise leave untouched
    if (row.status === "unsubscribed") {
      if (!wantConsent) {
        return {
          ok: true,
          status: "unsubscribed",
          marketingConsent: row.marketingConsent,
          issueConfirm: false,
        };
      }
      await db.update(newsletterSubscribers).set({
        country: input.country ?? row.country,
        locale: input.locale,
        sourcePath: input.sourcePath,
        status: "pending",
        marketingConsent: true,
        updatedAt: new Date(),
      }).where(eq(newsletterSubscribers.id, row.id));
      return { ok: true, status: "pending", marketingConsent: true, issueConfirm: true };
    }

    // Never flip true → false via this form
    const nextConsent = row.marketingConsent || wantConsent;
    const flippedToConsent = !row.marketingConsent && wantConsent;
    // Keep confirmed; otherwise stay/reset pending
    const nextStatus = row.status === "confirmed" ? "confirmed" : "pending";

    await db.update(newsletterSubscribers).set({
      country: input.country ?? row.country,
      locale: input.locale,
      sourcePath: input.sourcePath,
      status: nextStatus,
      marketingConsent: nextConsent,
      updatedAt: new Date(),
    }).where(eq(newsletterSubscribers.id, row.id));

    const issueConfirm =
      wantConsent &&
      nextStatus !== "confirmed" &&
      (flippedToConsent || nextConsent);
    // Issue confirm when opting in and not already confirmed
    const shouldConfirm = wantConsent && nextStatus !== "confirmed";

    return {
      ok: true,
      status: nextStatus,
      marketingConsent: nextConsent,
      issueConfirm: shouldConfirm,
    };
  }

  const [row] = await db.insert(newsletterSubscribers).values({
    email,
    country: input.country ?? null,
    locale: input.locale,
    sourcePath: input.sourcePath,
    status: "pending",
    marketingConsent: wantConsent,
  }).returning({
    status: newsletterSubscribers.status,
    marketingConsent: newsletterSubscribers.marketingConsent,
  });
  return {
    ok: true,
    status: row.status,
    marketingConsent: row.marketingConsent,
    issueConfirm: wantConsent,
  };
}

export type NewsletterStatus = "pending" | "confirmed" | "unsubscribed";

export async function listNewsletterSubscribers(opts: {
  status?: NewsletterStatus;
  /** Sendable = marketing_consent=true AND status=confirmed */
  sendable?: boolean;
  limit: number;
  offset: number;
}) {
  const db = getDb();
  const conditions = [];
  if (opts.status) conditions.push(eq(newsletterSubscribers.status, opts.status));
  if (opts.sendable) {
    conditions.push(eq(newsletterSubscribers.marketingConsent, true));
    conditions.push(eq(newsletterSubscribers.status, "confirmed"));
  }

  let query = db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      country: newsletterSubscribers.country,
      locale: newsletterSubscribers.locale,
      sourcePath: newsletterSubscribers.sourcePath,
      status: newsletterSubscribers.status,
      marketingConsent: newsletterSubscribers.marketingConsent,
      createdAt: newsletterSubscribers.createdAt,
    })
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query;
}

export async function countNewsletterSubscribers(opts: {
  status?: NewsletterStatus;
  sendable?: boolean;
} = {}) {
  const db = getDb();
  const conditions = [];
  if (opts.status) conditions.push(eq(newsletterSubscribers.status, opts.status));
  if (opts.sendable) {
    conditions.push(eq(newsletterSubscribers.marketingConsent, true));
    conditions.push(eq(newsletterSubscribers.status, "confirmed"));
  }

  let query = db.select({ total: sql<number>`COUNT(*)::int` }).from(newsletterSubscribers);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  const [{ total }] = await query;
  return total;
}

/** Only pending → unsubscribed. Returns false if missing or not pending. */
export async function setNewsletterUnsubscribed(id: number): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .limit(1);
  if (!row || row.status !== "pending") return false;
  await db
    .update(newsletterSubscribers)
    .set({ status: "unsubscribed", updatedAt: new Date() })
    .where(eq(newsletterSubscribers.id, id));
  return true;
}

/** pending → confirmed only. Never touches unsubscribed. Returns status or null if not found. */
export async function confirmNewsletterByEmail(email: string): Promise<{
  ok: true;
  status: "pending" | "confirmed" | "unsubscribed";
  alreadyConfirmed: boolean;
} | { ok: false; reason: "not_found" | "unsubscribed" }> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalized))
    .limit(1);
  if (!row) return { ok: false, reason: "not_found" };
  if (row.status === "unsubscribed") return { ok: false, reason: "unsubscribed" };
  if (row.status === "confirmed") {
    return { ok: true, status: "confirmed", alreadyConfirmed: true };
  }
  await db
    .update(newsletterSubscribers)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(newsletterSubscribers.id, row.id));
  return { ok: true, status: "confirmed", alreadyConfirmed: false };
}

/** Opt-in JWT from unlocked email footer: marketing_consent=true + status=confirmed.
 *  Never leaves unsubscribed stuck — re-engages to confirmed+consent.
 */
export async function confirmOptInByEmail(email: string): Promise<{
  ok: true;
  status: "confirmed";
  alreadyConfirmed: boolean;
} | { ok: false; reason: "not_found" }> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({
      id: newsletterSubscribers.id,
      status: newsletterSubscribers.status,
      marketingConsent: newsletterSubscribers.marketingConsent,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalized))
    .limit(1);
  if (!row) return { ok: false, reason: "not_found" };
  const already =
    row.status === "confirmed" && row.marketingConsent === true;
  await db
    .update(newsletterSubscribers)
    .set({
      status: "confirmed",
      marketingConsent: true,
      updatedAt: new Date(),
    })
    .where(eq(newsletterSubscribers.id, row.id));
  return { ok: true, status: "confirmed", alreadyConfirmed: already };
}
