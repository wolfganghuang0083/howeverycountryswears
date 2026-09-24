import { TRPCError } from "@trpc/server";
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
  upsertNewsletterSubscriber,
  listNewsletterSubscribers, countNewsletterSubscribers, setNewsletterUnsubscribed,
  confirmNewsletterByEmail,
  confirmOptInByEmail,
} from "./db.js";
import {
  signNewsletterConfirmToken,
  verifyNewsletterConfirmToken,
  verifyNewsletterOptInToken,
  signNewsletterOptInToken,
  buildConfirmUrl,
  buildOptInUrl,
  siteOrigin,
  isPreviewEnv,
} from "./newsletterConfirm.js";
import { sendMail } from "./mail/sendMail.js";
import {
  renderUnlockedEmail,
  renderOptInWelcomeEmail,
} from "./mail/templates/welcomeEmails.js";

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

  // ========== NEWSLETTER (CRM Preview — no email send) ==========
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        country: z.string().max(100).optional(),
        locale: z.string().max(16).default("en"),
        sourcePath: z.string().min(1).max(512),
        marketingConsent: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const result = await upsertNewsletterSubscriber({
          email: input.email,
          country: input.country,
          locale: input.locale || "en",
          sourcePath: input.sourcePath,
          marketingConsent: input.marketingConsent,
        });
        const out: {
          ok: true;
          status: "pending" | "confirmed" | "unsubscribed";
          marketingConsent: boolean;
          previewConfirmUrl?: string;
          previewEmailHtml?: string;
          previewEmailSubject?: string;
          emailVariant?: "unlocked" | "optin_welcome";
        } = {
          ok: true,
          status: result.status,
          marketingConsent: result.marketingConsent,
        };

        const origin = siteOrigin();
        const optedIn = Boolean(input.marketingConsent && result.issueConfirm);

        if (optedIn) {
          // Combined welcome + DOI confirm (one email, no separate confirm send)
          const token = await signNewsletterConfirmToken(input.email);
          const confirmUrlAbs = buildConfirmUrl(token);
          const relativeConfirm = `/subscribe/confirmed?token=${encodeURIComponent(token)}`;
          const rendered = renderOptInWelcomeEmail({ origin, confirmUrl: confirmUrlAbs });
          const mailResult = await sendMail({
            to: input.email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            tag: "welcome_optin",
          });
          out.emailVariant = "optin_welcome";
          if (isPreviewEnv()) {
            out.previewConfirmUrl = relativeConfirm;
            out.previewEmailHtml = mailResult.previewHtml || rendered.html;
            out.previewEmailSubject = rendered.subject;
          }
          console.log("[newsletter] welcome_optin queued/sent");
        } else {
          // Service “You're unlocked” + weekly subscribe footer (JWT purpose=optin)
          const optToken = await signNewsletterOptInToken(input.email);
          const optInUrlAbs = buildOptInUrl(optToken);
          const rendered = renderUnlockedEmail({ origin, optInUrl: optInUrlAbs });
          const mailResult = await sendMail({
            to: input.email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            tag: "welcome_unlocked",
          });
          out.emailVariant = "unlocked";
          if (isPreviewEnv()) {
            out.previewEmailHtml = mailResult.previewHtml || rendered.html;
            out.previewEmailSubject = rendered.subject;
            // Also expose relative opt-in link for Preview testing
            out.previewConfirmUrl = `/subscribe/confirmed?token=${encodeURIComponent(optToken)}&variant=optin`;
          }
          console.log("[newsletter] welcome_unlocked queued/sent");
        }
        return out;
      }),

    confirm: publicProcedure
      .input(z.object({
        token: z.string().min(10).max(2048),
        /** optin = footer Subscribe to the weekly (consent+confirmed) */
        variant: z.enum(["confirm", "optin"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const asOptIn = input.variant === "optin";
        if (asOptIn) {
          const verified = await verifyNewsletterOptInToken(input.token);
          if (!verified) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid or expired opt-in link",
            });
          }
          const result = await confirmOptInByEmail(verified.email);
          if (!result.ok) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Subscription not found",
            });
          }
          return {
            ok: true as const,
            status: result.status,
            alreadyConfirmed: result.alreadyConfirmed,
            variant: "optin" as const,
          };
        }

        const verified = await verifyNewsletterConfirmToken(input.token);
        if (!verified) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired confirmation link",
          });
        }
        const result = await confirmNewsletterByEmail(verified.email);
        if (!result.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.reason === "unsubscribed"
              ? "This address is unsubscribed"
              : "Subscription not found",
          });
        }
        return {
          ok: true as const,
          status: result.status,
          alreadyConfirmed: result.alreadyConfirmed,
          variant: "confirm" as const,
        };
      }),

    list: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "confirmed", "unsubscribed"]).optional(),
        sendable: z.boolean().optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const [items, total] = await Promise.all([
          listNewsletterSubscribers({
            status: input.sendable ? undefined : input.status,
            sendable: input.sendable,
            limit: input.limit,
            offset: input.offset,
          }),
          countNewsletterSubscribers({
            status: input.sendable ? undefined : input.status,
            sendable: input.sendable,
          }),
        ]);
        return { items, total };
      }),

    exportCsv: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "confirmed", "unsubscribed"]).optional(),
        sendable: z.boolean().optional(),
      }).default({}))
      .query(async ({ input }) => {
        const status = input.sendable ? undefined : input.status;
        const sendable = input.sendable;
        const total = await countNewsletterSubscribers({ status, sendable });
        const items = await listNewsletterSubscribers({
          status,
          sendable,
          limit: Math.min(total || 200, 200),
          offset: 0,
        });
        const escape = (v: string | null | undefined) => {
          const s = v ?? "";
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        };
        const header = "id,email,country,locale,source_path,status,marketing_consent,created_at";
        const rows = items.map((r) => [
          String(r.id),
          escape(r.email),
          escape(r.country),
          escape(r.locale),
          escape(r.sourcePath),
          escape(r.status),
          r.marketingConsent ? "true" : "false",
          escape(r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? "")),
        ].join(","));
        return { csv: [header, ...rows].join("\n") };
      }),

    unsubscribe: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const ok = await setNewsletterUnsubscribed(input.id);
        if (!ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Subscriber not found or not pending",
          });
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
