import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";

const PURPOSE_MAGIC = "magic_login" as const;

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");
}

/** Stable openId for email-auth users (fits varchar(64)). */
export function emailOpenId(email: string): string {
  const hash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 40);
  return `email_${hash}`;
}

export function googleOpenId(sub: string): string {
  return `google_${sub}`.slice(0, 64);
}

export async function signMagicLoginToken(input: {
  email: string;
  marketingConsent: boolean;
  returnTo?: string;
}): Promise<string> {
  return new SignJWT({
    email: input.email.trim().toLowerCase(),
    purpose: PURPOSE_MAGIC,
    marketingConsent: Boolean(input.marketingConsent),
    returnTo: input.returnTo || "/",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(getSecret());
}

export async function verifyMagicLoginToken(token: string): Promise<{
  email: string;
  marketingConsent: boolean;
  returnTo: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE_MAGIC || typeof payload.email !== "string") return null;
    return {
      email: payload.email.trim().toLowerCase(),
      marketingConsent: Boolean(payload.marketingConsent),
      returnTo: typeof payload.returnTo === "string" ? payload.returnTo : "/",
    };
  } catch {
    return null;
  }
}
