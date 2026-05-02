import { initTRPC, TRPCError } from "@trpc/server";
import { jwtVerify } from "jose";
import { parse } from "cookie";
import superjson from "superjson";
import type { VercelRequest } from "@vercel/node";

const COOKIE_NAME = "hecs_session";
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");

export interface UserPayload {
  userId: number;
  openId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  memberTier: string;
}

export interface Context {
  user: UserPayload | null;
}

export async function createContext(req: VercelRequest): Promise<Context> {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];

  if (!token) return { user: null };

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      user: {
        userId: payload.userId as number,
        openId: payload.openId as string,
        name: (payload.name as string) || null,
        email: (payload.email as string) || null,
        avatarUrl: (payload.avatarUrl as string) || null,
        role: (payload.role as string) || "user",
        memberTier: (payload.memberTier as string) || "regular",
      },
    };
  } catch {
    return { user: null };
  }
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please login" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});
