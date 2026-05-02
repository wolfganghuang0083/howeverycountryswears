import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./trpc";
import {
  getUserByOpenId, getUserById, updateUserDisplayName, updateUserTier,
  upsertRating, getCardRatings, getUserRatings,
  redeemBookCode, createBookCodes,
  createSubmission, getSubmissions, getSubmissionById, updateSubmissionStatus,
  upsertVote, getUserVotes,
  claimDailyLoginBonus, getUserPoints, getPointsLeaderboard,
  getUserDashboardStats, getTopContributors,
  getUserBadges, checkAndAwardBadges,
  getCountryAmbassadors, getAmbassadorForCountry,
  incrementCountriesVisited, incrementPhrasesListened,
  createReview, getReviewsForCard, getReviewSummaryForCountry,
} from "./db";

export const appRouter = router({
  // ========== AUTH ==========
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      return { user: ctx.user };
    }),
    logout: protectedProcedure.mutation(() => {
      return { success: true };
    }),
  }),

  // ========== USER PROFILE ==========
  user: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.userId);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        memberTier: user.memberTier,
        points: user.points,
        countriesVisited: user.countriesVisited,
        phrasesListened: user.phrasesListened,
        createdAt: user.createdAt,
      };
    }),
    updateDisplayName: protectedProcedure
      .input(z.object({ displayName: z.string().min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserDisplayName(ctx.user.userId, input.displayName);
        return { success: true };
      }),
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      return getUserDashboardStats(ctx.user.userId);
    }),
    badges: protectedProcedure.query(async ({ ctx }) => {
      return getUserBadges(ctx.user.userId);
    }),
  }),

  // ========== RATINGS ==========
  ratings: router({
    rate: protectedProcedure
      .input(z.object({
        countrySlug: z.string(),
        cardNumber: z.number().int().positive(),
        value: z.number().int().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertRating(ctx.user.userId, input.countrySlug, input.cardNumber, input.value);
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { success: true, newBadges };
      }),
    getForCountry: publicProcedure
      .input(z.object({
        countrySlug: z.string(),
        cardNumbers: z.array(z.number()),
      }))
      .query(async ({ input }) => {
        return getCardRatings(input.countrySlug, input.cardNumbers);
      }),
    getUserRatings: protectedProcedure
      .input(z.object({ countrySlug: z.string() }))
      .query(async ({ ctx, input }) => {
        return getUserRatings(ctx.user.userId, input.countrySlug);
      }),
  }),

  // ========== BOOK CODES ==========
  bookCode: router({
    redeem: protectedProcedure
      .input(z.object({ code: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const success = await redeemBookCode(input.code, ctx.user.userId);
        if (!success) {
          return { success: false, message: "Invalid or already used code" };
        }
        return { success: true, message: "Book code redeemed! You now have access to all content." };
      }),
    generate: adminProcedure
      .input(z.object({ count: z.number().int().min(1).max(100) }))
      .mutation(async ({ input }) => {
        const codes: string[] = [];
        for (let i = 0; i < input.count; i++) {
          codes.push(crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase());
        }
        await createBookCodes(codes);
        return { codes };
      }),
  }),

  // ========== SUBMISSIONS (UGC) ==========
  submissions: router({
    create: protectedProcedure
      .input(z.object({
        countryName: z.string().min(1),
        countryFlag: z.string().default("🏳️"),
        phrase: z.string().min(1).max(500),
        ipa: z.string().max(500).optional(),
        literal: z.string().max(500).optional(),
        feelsLike: z.string().optional(),
        phraseType: z.string().optional(),
        langCode: z.string().max(10).optional(),
        riskLevel: z.number().int().min(1).max(5).default(2),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createSubmission({
          userId: ctx.user.userId,
          ...input,
        });
        return { id };
      }),
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        userId: z.number().optional(),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return getSubmissions(input);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getSubmissionById(input.id);
      }),
    vote: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        value: z.number().int().min(-1).max(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertVote(ctx.user.userId, input.submissionId, input.value);
        return { success: true };
      }),
    getUserVotes: protectedProcedure
      .input(z.object({ submissionIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        return getUserVotes(ctx.user.userId, input.submissionIds);
      }),
    // Admin
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected"]),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateSubmissionStatus(input.id, input.status, input.rejectionReason);
        return { success: true };
      }),
  }),

  // ========== POINTS ==========
  points: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserPoints(ctx.user.userId);
    }),
    claimDaily: protectedProcedure.mutation(async ({ ctx }) => {
      return claimDailyLoginBonus(ctx.user.userId);
    }),
    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        return getPointsLeaderboard(input.limit);
      }),
  }),

  // ========== TRACKING ==========
  tracking: router({
    countryVisited: protectedProcedure
      .input(z.object({ countrySlug: z.string() }))
      .mutation(async ({ ctx }) => {
        await incrementCountriesVisited(ctx.user.userId);
        return { success: true };
      }),
    phraseListened: protectedProcedure
      .input(z.object({ countrySlug: z.string(), cardNumber: z.number() }))
      .mutation(async ({ ctx }) => {
        await incrementPhrasesListened(ctx.user.userId);
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { success: true, newBadges };
      }),
  }),

  // ========== COMMUNITY ==========
  community: router({
    topContributors: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
      .query(async ({ input }) => {
        return getTopContributors(input.limit);
      }),
    ambassadors: publicProcedure.query(async () => {
      return getCountryAmbassadors();
    }),
    ambassadorForCountry: publicProcedure
      .input(z.object({ countrySlug: z.string() }))
      .query(async ({ input }) => {
        return getAmbassadorForCountry(input.countrySlug);
      }),
  }),

  // ========== REVIEWS ==========
  reviews: router({
    create: protectedProcedure
      .input(z.object({
        countrySlug: z.string(),
        cardNumber: z.number().int().positive(),
        content: z.string().min(1).max(2000),
        rating: z.number().int().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createReview({
          userId: ctx.user.userId,
          countrySlug: input.countrySlug,
          cardNumber: input.cardNumber,
          content: input.content,
          rating: input.rating,
          authorName: ctx.user.name,
        });
        return { id };
      }),
    getForCard: publicProcedure
      .input(z.object({
        countrySlug: z.string(),
        cardNumber: z.number().int().positive(),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return getReviewsForCard(input.countrySlug, input.cardNumber, input.limit, input.offset);
      }),
    summaryForCountry: publicProcedure
      .input(z.object({ countrySlug: z.string() }))
      .query(async ({ input }) => {
        return getReviewSummaryForCountry(input.countrySlug);
      }),
  }),
});

export type AppRouter = typeof appRouter;
