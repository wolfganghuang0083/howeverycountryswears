import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { serialize, parse } from "cookie";
import {
  upsertUser,
  upsertNewsletterSubscriber,
  getNewsletterByEmail,
  confirmOptInByEmail,
} from "../_lib/db.js";
import {
  emailOpenId,
  googleOpenId,
  signMagicLoginToken,
  verifyMagicLoginToken,
} from "../_lib/authTokens.js";
import { sendMail } from "../_lib/mail/sendMail.js";
import {
  renderMagicLinkWelcomeEmail,
  renderGoogleWelcomeEmail,
} from "../_lib/mail/templates/welcomeEmails.js";
import {
  siteOrigin,
  isPreviewEnv,
  signNewsletterOptInToken,
  buildOptInUrl,
} from "../_lib/newsletterConfirm.js";

const COOKIE_NAME = "hecs_session";
/** Short-lived OAuth pass-through for newsletter checkbox (0|1). */
const NEWSLETTER_OPTIN_COOKIE = "hecs_newsletter_optin";
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

function getBaseUrl(req: VercelRequest): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "howeverycountryswears.com";
  return `${proto}://${host}`;
}

function readNewsletterOptInCookie(req: VercelRequest): boolean | null {
  const cookies = parse(req.headers.cookie || "");
  const v = cookies[NEWSLETTER_OPTIN_COOKIE];
  if (v === "1") return true;
  if (v === "0") return false;
  return null;
}

function newsletterOptInCookie(value: "0" | "1" | "", maxAge = 3600): string {
  return serialize(NEWSLETTER_OPTIN_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: value === "" ? 0 : maxAge,
  });
}

function appendSetCookie(res: VercelResponse, cookie: string) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) {
    res.setHeader("Set-Cookie", cookie);
  } else if (Array.isArray(prev)) {
    res.setHeader("Set-Cookie", [...prev, cookie]);
  } else {
    res.setHeader("Set-Cookie", [String(prev), cookie]);
  }
}

function signupRedirect(returnTo: string, method: "google" | "email", newsletterOptedIn: boolean): string {
  const sep = returnTo.includes("?") ? "&" : "?";
  const nl = newsletterOptedIn ? "&newsletter=1" : "";
  return `${returnTo}${sep}signup=${method}${nl}`;
}


async function setSessionCookie(
  res: VercelResponse,
  dbUser: {
    id: number;
    openId: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    role: string;
    memberTier: string;
    emailVerifiedAt: Date | null;
  },
) {
  const token = await new SignJWT({
    userId: dbUser.id,
    openId: dbUser.openId,
    name: dbUser.name,
    email: dbUser.email,
    avatarUrl: dbUser.avatarUrl,
    role: dbUser.role,
    memberTier: dbUser.memberTier,
    emailVerified: Boolean(dbUser.emailVerifiedAt),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  appendSetCookie(
    res,
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }),
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url!, getBaseUrl(req));
  const pathParts = url.pathname.replace(/^\/api\/auth\/?/, "").split("/").filter(Boolean);
  const action = pathParts[0] || "";

  try {
    switch (action) {
      // Public signup entry no longer goes to GitHub — use SignupModal.
      // Admin GitHub OAuth: /api/auth/github or /api/auth/login?admin=1
      case "login":
        if (url.searchParams.get("admin") === "1") return handleGithubLogin(req, res);
        return res.redirect(302, "/?signin=1");
      case "github":
        return handleGithubLogin(req, res);
      case "callback":
        // Legacy GitHub callback path
        return handleGithubCallback(req, res);
      case "google":
        return pathParts[1] === "callback" ? handleGoogleCallback(req, res) : handleGoogleLogin(req, res);
      case "magic":
        if (pathParts[1] === "verify") return handleMagicVerify(req, res);
        if (req.method === "POST") return handleMagicStart(req, res);
        return res.status(405).json({ error: "POST required" });
      case "me":
        return handleMe(req, res);
      case "logout":
        return handleLogout(req, res);
      case "providers":
        return res.status(200).json({
          google: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
          githubAdmin: Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
        });
      case "newsletter-status":
        return handleNewsletterStatus(req, res);
      case "newsletter-optin":
        if (req.method === "POST") return handleNewsletterOptIn(req, res);
        return res.status(405).json({ error: "POST required" });
      default:
        return res.status(404).json({ error: "Not found" });
    }
  } catch (error) {
    console.error("[Auth Error]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function handleGithubLogin(req: VercelRequest, res: VercelResponse) {
  if (!GITHUB_CLIENT_ID) return res.status(503).json({ error: "GitHub OAuth not configured" });
  const baseUrl = getBaseUrl(req);
  const url = new URL(req.url!, baseUrl);
  const returnTo = url.searchParams.get("returnTo") || "/admin/newsletter";
  const state = Buffer.from(JSON.stringify({ returnTo, provider: "github" })).toString("base64url");
  const redirectUri = `${baseUrl}/api/auth/callback`;
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);
  return res.redirect(302, githubAuthUrl.toString());
}

async function handleGithubCallback(req: VercelRequest, res: VercelResponse) {
  const baseUrl = getBaseUrl(req);
  const url = new URL(req.url!, baseUrl);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  if (!code) return res.redirect(302, "/?error=no_code");

  let returnTo = "/admin/newsletter";
  if (stateParam) {
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, "base64url").toString());
      returnTo = stateData.returnTo || returnTo;
    } catch { /* ignore */ }
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.redirect(302, "/?error=token_failed");

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const githubUser = await userRes.json();
  let email: string | null = githubUser.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const emails = await emailsRes.json();
    const primary = emails.find((e: { primary?: boolean }) => e.primary) || emails[0];
    email = primary?.email || null;
  }

  const dbUser = await upsertUser({
    openId: `github_${githubUser.id}`,
    name: githubUser.login,
    email,
    avatarUrl: githubUser.avatar_url,
    loginMethod: "github",
    emailVerifiedAt: new Date(), // admin GitHub treated as verified
  });
  await setSessionCookie(res, dbUser);
  return res.redirect(302, returnTo);
}

function handleGoogleLogin(req: VercelRequest, res: VercelResponse) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: "Google OAuth not configured", comingSoon: true });
  }
  const baseUrl = getBaseUrl(req);
  const url = new URL(req.url!, baseUrl);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const marketingConsent = url.searchParams.get("marketingConsent") === "1";
  const state = Buffer.from(JSON.stringify({ returnTo, marketingConsent, provider: "google" })).toString("base64url");
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");
  // Persist opt-in for callback even if state is lost
  appendSetCookie(res, newsletterOptInCookie(marketingConsent ? "1" : "0"));
  return res.redirect(302, authUrl.toString());
}

async function handleGoogleCallback(req: VercelRequest, res: VercelResponse) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(302, "/?error=google_not_configured");
  }
  const baseUrl = getBaseUrl(req);
  const url = new URL(req.url!, baseUrl);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  if (!code) return res.redirect(302, "/?error=no_code");

  let returnTo = "/";
  let marketingConsent = false;
  let stateHadConsent = false;
  if (stateParam) {
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, "base64url").toString());
      returnTo = stateData.returnTo || "/";
      marketingConsent = Boolean(stateData.marketingConsent);
      stateHadConsent = true;
    } catch { /* ignore */ }
  }
  // Cookie fallback if OAuth state omitted consent
  if (!stateHadConsent || !marketingConsent) {
    const fromCookie = readNewsletterOptInCookie(req);
    if (fromCookie === true) marketingConsent = true;
    if (!stateHadConsent && fromCookie === false) marketingConsent = false;
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.id_token && !tokenData.access_token) {
    return res.redirect(302, "/?error=google_token_failed");
  }

  let email = "";
  let emailVerified = false;
  let name: string | null = null;
  let avatarUrl: string | null = null;
  let sub = "";

  if (tokenData.id_token) {
    // Verify via Google JWKS
    const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
    const { payload } = await jwtVerify(tokenData.id_token, JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: GOOGLE_CLIENT_ID,
    });
    email = String(payload.email || "").toLowerCase();
    emailVerified = Boolean(payload.email_verified);
    name = (payload.name as string) || null;
    avatarUrl = (payload.picture as string) || null;
    sub = String(payload.sub || "");
  } else {
    const ui = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await ui.json();
    email = String(profile.email || "").toLowerCase();
    emailVerified = Boolean(profile.email_verified);
    name = profile.name || null;
    avatarUrl = profile.picture || null;
    sub = String(profile.sub || "");
  }

  if (!email || !emailVerified || !sub) {
    return res.redirect(302, "/?error=google_email_unverified");
  }

  const dbUser = await upsertUser({
    openId: googleOpenId(sub),
    name,
    email,
    avatarUrl,
    loginMethod: "google",
    emailVerifiedAt: new Date(),
  });

  await upsertNewsletterSubscriber({
    email,
    locale: "en",
    sourcePath: returnTo || "/",
    marketingConsent,
  });
  // Google + opt-in → confirmed (email already verified)
  if (marketingConsent) {
    await confirmOptInByEmail(email);
  }

  const origin = siteOrigin(baseUrl);
  const optToken = await signNewsletterOptInToken(email);
  const optInUrl = buildOptInUrl(optToken, origin);
  const rendered = renderGoogleWelcomeEmail({ origin, name, optInUrl });
  await sendMail({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tag: "welcome_google",
  });

  await setSessionCookie(res, dbUser);
  appendSetCookie(res, newsletterOptInCookie("", 0)); // clear pass-through
  return res.redirect(302, signupRedirect(returnTo, "google", marketingConsent));
}

async function handleMagicStart(req: VercelRequest, res: VercelResponse) {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const email = String(body.email || "").trim().toLowerCase();
  const marketingConsent = Boolean(body.marketingConsent);
  const returnTo = String(body.returnTo || "/");
  const locale = String(body.locale || "en");
  const sourcePath = String(body.sourcePath || returnTo || "/");
  const country = body.country ? String(body.country) : undefined;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }

  // Write newsletter row (pending; confirm on magic click if opted in)
  await upsertNewsletterSubscriber({
    email,
    country,
    locale,
    sourcePath,
    marketingConsent,
  });

  const token = await signMagicLoginToken({ email, marketingConsent, returnTo });
  const baseUrl = getBaseUrl(req);
  const magicUrl = `${baseUrl}/api/auth/magic/verify?token=${encodeURIComponent(token)}`;
  const origin = siteOrigin(baseUrl);
  const optToken = await signNewsletterOptInToken(email);
  const optInUrl = buildOptInUrl(optToken, origin);
  const rendered = renderMagicLinkWelcomeEmail({ origin, magicUrl, optInUrl });
  const mailResult = await sendMail({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tag: "welcome_magic",
  });

  const out: Record<string, unknown> = { ok: true };
  if (isPreviewEnv()) {
    out.previewMagicUrl = `/api/auth/magic/verify?token=${encodeURIComponent(token)}`;
    out.previewEmailHtml = mailResult.previewHtml || rendered.html;
    out.previewEmailSubject = rendered.subject;
  }
  return res.status(200).json(out);
}

async function handleMagicVerify(req: VercelRequest, res: VercelResponse) {
  const baseUrl = getBaseUrl(req);
  const url = new URL(req.url!, baseUrl);
  const token = url.searchParams.get("token");
  if (!token) return res.redirect(302, "/?error=magic_missing");

  const verified = await verifyMagicLoginToken(token);
  if (!verified) return res.redirect(302, "/?error=magic_invalid");

  const dbUser = await upsertUser({
    openId: emailOpenId(verified.email),
    name: verified.email.split("@")[0],
    email: verified.email,
    loginMethod: "email",
    emailVerifiedAt: new Date(),
  });

  if (verified.marketingConsent) {
    await confirmOptInByEmail(verified.email);
  }

  await setSessionCookie(res, dbUser);
  appendSetCookie(res, newsletterOptInCookie("", 0));
  const returnTo = verified.returnTo || "/";
  return res.redirect(302, signupRedirect(returnTo, "email", Boolean(verified.marketingConsent)));
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(200).json({ user: null });

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return res.status(200).json({
      user: {
        id: payload.userId,
        openId: payload.openId,
        name: payload.name,
        email: payload.email,
        avatarUrl: payload.avatarUrl,
        role: payload.role,
        memberTier: payload.memberTier,
        emailVerified: Boolean(payload.emailVerified),
      },
    });
  } catch {
    const cookie = serialize(COOKIE_NAME, "", {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0,
    });
    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ user: null });
  }
}

function handleLogout(req: VercelRequest, res: VercelResponse) {
  const cookie = serialize(COOKIE_NAME, "", {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0,
  });
  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ success: true });
}

async function handleNewsletterStatus(req: VercelRequest, res: VercelResponse) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(200).json({ subscribed: false, authenticated: false });
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) return res.status(200).json({ subscribed: false, authenticated: true });
    const row = await getNewsletterByEmail(email);
    const subscribed = Boolean(
      row && row.marketingConsent && row.status !== "unsubscribed",
    );
    return res.status(200).json({ subscribed, authenticated: true, status: row?.status ?? null });
  } catch {
    return res.status(200).json({ subscribed: false, authenticated: false });
  }
}

async function handleNewsletterOptIn(req: VercelRequest, res: VercelResponse) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ ok: false, error: "Not signed in" });
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!email) return res.status(400).json({ ok: false, error: "No email on account" });
    await upsertNewsletterSubscriber({
      email,
      locale: "en",
      sourcePath: "/",
      marketingConsent: true,
    });
    const result = await confirmOptInByEmail(email);
    if (!result.ok) {
      return res.status(200).json({ ok: false, reason: result.reason });
    }
    return res.status(200).json({ ok: true, status: "confirmed" });
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid session" });
  }
}
