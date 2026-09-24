import { SignJWT, jwtVerify } from "jose";

const PURPOSE_CONFIRM = "newsletter_confirm" as const;
const PURPOSE_OPTIN = "optin" as const;

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");
}

export async function signNewsletterConfirmToken(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), purpose: PURPOSE_CONFIRM })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/** Footer “Subscribe to the weekly” — sets consent=true + confirmed. */
export async function signNewsletterOptInToken(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), purpose: PURPOSE_OPTIN })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyNewsletterConfirmToken(
  token: string,
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE_CONFIRM || typeof payload.email !== "string") return null;
    return { email: payload.email.trim().toLowerCase() };
  } catch {
    return null;
  }
}

export async function verifyNewsletterOptInToken(
  token: string,
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE_OPTIN || typeof payload.email !== "string") return null;
    return { email: payload.email.trim().toLowerCase() };
  } catch {
    return null;
  }
}

export function siteOrigin(origin?: string): string {
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const base =
    origin ||
    vercel ||
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    "https://howeverycountryswears.com";
  return base.replace(/\/$/, "");
}

/** Build absolute confirm URL for logging / preview. */
export function buildConfirmUrl(token: string, origin?: string): string {
  return `${siteOrigin(origin)}/subscribe/confirmed?token=${encodeURIComponent(token)}`;
}

export function buildOptInUrl(token: string, origin?: string): string {
  return `${siteOrigin(origin)}/subscribe/confirmed?token=${encodeURIComponent(token)}&variant=optin`;
}

export function isPreviewEnv(): boolean {
  return process.env.VERCEL_ENV !== "production";
}
