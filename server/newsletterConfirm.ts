import { SignJWT, jwtVerify } from "jose";

const PURPOSE = "newsletter_confirm" as const;

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");
}

export async function signNewsletterConfirmToken(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyNewsletterConfirmToken(
  token: string,
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE || typeof payload.email !== "string") return null;
    return { email: payload.email.trim().toLowerCase() };
  } catch {
    return null;
  }
}

/** Build absolute confirm URL for logging / preview. */
export function buildConfirmUrl(token: string, origin?: string): string {
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const base =
    origin ||
    vercel ||
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    "https://howeverycountryswears.com";
  return `${base.replace(/\/$/, "")}/subscribe/confirmed?token=${encodeURIComponent(token)}`;
}

export function isPreviewEnv(): boolean {
  // Vercel: production | preview | development. Also allow local (unset).
  return process.env.VERCEL_ENV !== "production";
}
