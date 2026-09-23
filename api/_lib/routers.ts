import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./trpc.js";
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
  setUserEmail, userHasPackUnlock, listUserPackUnlocks, insertPackUnlock, devGrantPackUnlock,
} from "./db.js";
import { TRPCError } from "@trpc/server";
import {
  RECUR_PRODUCTS,
  UNLOCK_ID_EN_SPHERE,
  EXPERIMENT_ID_EN_SPHERE,
  VARIANT_ID_PRICE_699,
  SCHEME_A_PRICE,
  resolveEnSphereProductId,
  packCopy,
} from "../../shared/schemeAConfig.js";
import { recurConfigured, recurMode, recurProductReady } from "./recur.js";

export const appRouter = router({
  // ========== AUTH ==========
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      return ctx.user;
    }),
    logout: publicProcedure.mutation(() => {
      return { success: true } as const;
    }),
  }),

  // ========== PROFILE ==========
  profile: router({
    updateDisplayName: protectedProcedure
      .input(z.object({ displayName: z.string().min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserDisplayName(ctx.user.userId, input.displayName);
        return { success: true };
      }),
  }),

  // ========== BOOK CODE REDEMPTION ==========
  bookCode: router({
    redeem: protectedProcedure
      .input(z.object({ code: z.string().min(1).max(32) }))
      .mutation(async ({ ctx, input }) => {
        const success = await redeemBookCode(input.code.trim().toUpperCase(), ctx.user.userId);
        if (!success) {
          return { success: false, message: "Invalid or already used book code." };
        }
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { success: true, message: "Book code redeemed! Welcome to Level 2.", newBadges };
      }),
    generate: adminProcedure
      .input(z.object({ count: z.number().min(1).max(100) }))
      .mutation(async ({ input }) => {
        const codes: string[] = [];
        for (let i = 0; i < input.count; i++) {
          codes.push(crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase());
        }
        await createBookCodes(codes);
        return { codes };
      }),
  }),

  // ========== POINTS SYSTEM ==========
  points: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      return getUserPoints(ctx.user.userId);
    }),
    claimDaily: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await claimDailyLoginBonus(ctx.user.userId);
      if (result.claimed) {
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { ...result, newBadges };
      }
      return { ...result, newBadges: [] };
    }),
    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
      .query(async ({ input }) => {
        return getPointsLeaderboard(input?.limit || 20);
      }),
  }),

  // ========== RATING SYSTEM ==========
  rating: router({
    rate: protectedProcedure
      .input(z.object({
        countrySlug: z.string().min(1),
        cardNumber: z.number().min(1).max(20),
        value: z.number().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertRating(ctx.user.userId, input.countrySlug, input.cardNumber, input.value);
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { success: true, newBadges };
      }),
    getForCountry: publicProcedure
      .input(z.object({
        countrySlug: z.string().min(1),
        cardNumbers: z.array(z.number()),
      }))
      .query(async ({ input }) => {
        return getCardRatings(input.countrySlug, input.cardNumbers);
      }),
    myRatings: protectedProcedure
      .input(z.object({ countrySlug: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return getUserRatings(ctx.user.userId, input.countrySlug);
      }),
  }),

  // ========== BADGE SYSTEM ==========
  badges: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      return getUserBadges(ctx.user.userId);
    }),
    check: protectedProcedure.mutation(async ({ ctx }) => {
      const newBadges = await checkAndAwardBadges(ctx.user.userId);
      return { newBadges };
    }),
  }),

  // ========== TRACKING ==========
  tracking: router({
    visitCountry: protectedProcedure
      .input(z.object({ countrySlug: z.string().min(1) }))
      .mutation(async ({ ctx }) => {
        await incrementCountriesVisited(ctx.user.userId);
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { newBadges };
      }),
    listenPhrase: protectedProcedure
      .input(z.object({ countrySlug: z.string().min(1), cardNumber: z.number() }))
      .mutation(async ({ ctx }) => {
        await incrementPhrasesListened(ctx.user.userId);
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { newBadges };
      }),
  }),

  // ========== SUBMISSIONS ==========
  submission: router({
    create: protectedProcedure
      .input(z.object({
        countryName: z.string().min(1).max(100),
        countryFlag: z.string().max(10).default("🏳️"),
        phrase: z.string().min(1).max(500),
        ipa: z.string().max(500).optional(),
        literal: z.string().max(500).optional(),
        feelsLike: z.string().max(2000).optional(),
        phraseType: z.string().max(100).optional(),
        langCode: z.string().max(10).optional(),
        riskLevel: z.number().min(1).max(5).default(2),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createSubmission({
          userId: ctx.user.userId,
          ...input,
        });
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { id, message: "Submission created! It will be reviewed by our team.", newBadges };
      }),
    list: publicProcedure
      .input(z.object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        userId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const rawInput = input || { limit: 20, offset: 0 };
        let statusFilter = rawInput.status;
        const userIdFilter = rawInput.userId;
        // Non-admin users can only see approved submissions (unless viewing their own)
        if (!ctx.user || ctx.user.role !== "admin") {
          if (!userIdFilter || (ctx.user && userIdFilter !== ctx.user.userId)) {
            statusFilter = "approved";
          }
        }
        const result = await getSubmissions({
          status: statusFilter,
          userId: userIdFilter,
          limit: rawInput.limit,
          offset: rawInput.offset,
        });
        let userVotes: Record<number, number> = {};
        if (ctx.user && result.items.length > 0) {
          userVotes = await getUserVotes(ctx.user.userId, result.items.map(s => s.id));
        }
        return { ...result, userVotes };
      }),
    moderate: adminProcedure
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

  // ========== VOTES ==========
  vote: router({
    cast: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        value: z.number().refine(v => v === 1 || v === -1, "Vote must be 1 or -1"),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertVote(ctx.user.userId, input.submissionId, input.value);
        return { success: true };
      }),
  }),

  // ========== DASHBOARD ==========
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getUserDashboardStats(ctx.user.userId);
    }),
    mySubmissions: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const opts = input || { limit: 20, offset: 0 };
        return getSubmissions({ userId: ctx.user.userId, ...opts });
      }),
    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
      .query(async ({ input }) => {
        return getTopContributors(input?.limit || 10);
      }),
  }),

  // ========== REVIEWS ==========
  review: router({
    create: protectedProcedure
      .input(z.object({
        countrySlug: z.string().min(1),
        cardNumber: z.number().min(1).max(20),
        content: z.string().min(1).max(2000),
        rating: z.number().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const authorName = ctx.user.name || "Anonymous";
        const id = await createReview({
          userId: ctx.user.userId,
          countrySlug: input.countrySlug,
          cardNumber: input.cardNumber,
          content: input.content,
          rating: input.rating,
          authorName,
        });
        // Also upsert the star rating
        await upsertRating(ctx.user.userId, input.countrySlug, input.cardNumber, input.rating);
        const newBadges = await checkAndAwardBadges(ctx.user.userId);
        return { id, newBadges };
      }),
    getForCard: publicProcedure
      .input(z.object({
        countrySlug: z.string().min(1),
        cardNumber: z.number().min(1).max(20),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return getReviewsForCard(input.countrySlug, input.cardNumber, input.limit, input.offset);
      }),
    summaryForCountry: publicProcedure
      .input(z.object({ countrySlug: z.string().min(1) }))
      .query(async ({ input }) => {
        return getReviewSummaryForCountry(input.countrySlug);
      }),
  }),

  // ========== COUNTRY AMBASSADORS ==========
  ambassador: router({
    list: publicProcedure.query(async () => {
      return getCountryAmbassadors();
    }),
    getForCountry: publicProcedure
      .input(z.object({ countrySlug: z.string().min(1) }))
      .query(async ({ input }) => {
        return getAmbassadorForCountry(input.countrySlug);
      }),
  }),

  // ========== SCHEME A — Recur pack unlock ==========
  unlock: router({
    /** Current user unlock state for EN sphere (and bookBuyer shortcut). */
    myStatus: publicProcedure.query(async ({ ctx }) => {
      const product = RECUR_PRODUCTS.en_sphere;
      const configured = recurConfigured();
      const productReady = recurProductReady();
      const mode = recurMode();
      if (!ctx.user) {
        return {
          authenticated: false,
          hasPackEnSphere: false,
          isBookBuyer: false,
          canPlayEnSphereAudio: false,
          configured,
          productReady,
          mode,
          price: SCHEME_A_PRICE,
          unlockId: UNLOCK_ID_EN_SPHERE,
          experimentId: EXPERIMENT_ID_EN_SPHERE,
          variantId: VARIANT_ID_PRICE_699,
        };
      }
      const isBookBuyer = ctx.user.memberTier === "bookBuyer" || ctx.user.role === "admin";
      const hasPack = await userHasPackUnlock(ctx.user.userId, UNLOCK_ID_EN_SPHERE);
      return {
        authenticated: true,
        hasPackEnSphere: hasPack,
        isBookBuyer,
        canPlayEnSphereAudio: hasPack || isBookBuyer,
        configured,
        productReady,
        mode,
        price: SCHEME_A_PRICE,
        unlockId: UNLOCK_ID_EN_SPHERE,
        experimentId: EXPERIMENT_ID_EN_SPHERE,
        variantId: VARIANT_ID_PRICE_699,
        productSlug: product.slug,
      };
    }),

    listMine: protectedProcedure.query(async ({ ctx }) => {
      return listUserPackUnlocks(ctx.user.userId);
    }),

    /**
     * Create Recur Hosted Checkout session (ONE_TIME / PAYMENT).
     * externalCustomerId = openId (iron rule). Requires login.
     */
    createCheckout: protectedProcedure
      .input(z.object({
        pack: z.literal("en_sphere").optional().default("en_sphere"),
        email: z.string().email().max(320),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!recurConfigured()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: packCopy("en").paymentNotConfigured,
          });
        }
        const productId = resolveEnSphereProductId(process.env.RECUR_PRODUCT_ID_EN_SPHERE);
        if (!productId || productId === "REPLACE_ME_HECS_EN_SPHERE") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: packCopy("en").paymentNotConfigured,
          });
        }

        const already = await userHasPackUnlock(ctx.user.userId, UNLOCK_ID_EN_SPHERE);
        if (already && recurMode() === "live") {
          throw new TRPCError({ code: "BAD_REQUEST", message: packCopy("en").alreadyUnlocked });
        }

        if (!ctx.user.email) {
          try { await setUserEmail(ctx.user.userId, input.email); }
          catch (e) { console.error("[unlock.createCheckout] setUserEmail best-effort failed:", e); }
        }

        const h = ctx.headers;
        const proto = (typeof h["x-forwarded-proto"] === "string" ? h["x-forwarded-proto"] : "https").split(",")[0].trim();
        const hostRaw = h["x-forwarded-host"] ?? h.host ?? "";
        const host = (Array.isArray(hostRaw) ? hostRaw[0] : hostRaw).split(",")[0].trim();
        const originHeader = typeof h.origin === "string" && /^https?:\/\//.test(h.origin) ? h.origin : "";
        const origin = originHeader || (host ? `${proto}://${host}` : "https://howeverycountryswears.com");

        const successUrl = `${origin}/unlock/success?pack=en_sphere&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${origin}/pack/en-sphere`;
        const externalId = ctx.user.openId;
        const product = RECUR_PRODUCTS.en_sphere;

        const secret = process.env.RECUR_SECRET_KEY!;
        const resp = await fetch("https://api.recur.tw/v1/checkout/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({
            productId,
            successUrl,
            cancelUrl,
            externalCustomerId: externalId,
            customerName: ctx.user.name || undefined,
            customerEmail: input.email,
            mode: product.mode,
            metadata: {
              openId: externalId,
              unlock_id: UNLOCK_ID_EN_SPHERE,
              experiment_id: EXPERIMENT_ID_EN_SPHERE,
              variant_id: VARIANT_ID_PRICE_699,
            },
          }),
        });

        if (!resp.ok) {
          const bodyText = await resp.text().catch(() => "");
          console.error(`[unlock.createCheckout] session HTTP ${resp.status}`, bodyText.slice(0, 200));
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Checkout unavailable — please try again later.",
          });
        }

        const session: any = await resp.json();
        const url = typeof session?.url === "string" ? session.url : "";
        if (!url) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Checkout session missing url" });
        }

        return {
          mode: "url" as const,
          url,
          sessionId: typeof session?.id === "string" ? session.id : null,
          value: SCHEME_A_PRICE.value,
          currency: SCHEME_A_PRICE.currency,
          unlock_id: UNLOCK_ID_EN_SPHERE,
          experiment_id: EXPERIMENT_ID_EN_SPHERE,
          variant_id: VARIANT_ID_PRICE_699,
        };
      }),

    /** Preview SSO testing only — gated by RECUR_MODE!==live && HECS_ALLOW_DEV_UNLOCK=1 */
    devGrantPackUnlock: protectedProcedure
      .input(z.object({ unlockId: z.literal("pack_en_sphere").optional().default("pack_en_sphere") }))
      .mutation(async ({ ctx, input }) => {
        if (recurMode() === "live" || process.env.HECS_ALLOW_DEV_UNLOCK !== "1") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Dev unlock disabled" });
        }
        const result = await devGrantPackUnlock(ctx.user.userId, input.unlockId);
        if (!result.ok) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Grant failed" });
        }
        return { success: true, duplicate: result.duplicate };
      }),
  }),
});

export type AppRouter = typeof appRouter;
