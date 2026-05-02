import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignJWT, jwtVerify } from "jose";
import { serialize, parse } from "cookie";
import { upsertUser } from "../_lib/db";

const COOKIE_NAME = "hecs_session";
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

function getBaseUrl(req: VercelRequest): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "howeverycountryswears.com";
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url!, getBaseUrl(req));
  const pathParts = url.pathname.replace("/api/auth/", "").split("/");
  const action = pathParts[0];

  try {
    switch (action) {
      case "login":
        return handleLogin(req, res);
      case "callback":
        return handleCallback(req, res);
      case "me":
        return handleMe(req, res);
      case "logout":
        return handleLogout(req, res);
      default:
        return res.status(404).json({ error: "Not found" });
    }
  } catch (error) {
    console.error("[Auth Error]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function handleLogin(req: VercelRequest, res: VercelResponse) {
  const baseUrl = getBaseUrl(req);
  const url = new URL(req.url!, baseUrl);
  const returnTo = url.searchParams.get("returnTo") || "/";
  
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64url");
  const redirectUri = `${baseUrl}/api/auth/callback`;
  
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);

  return res.redirect(302, githubAuthUrl.toString());
}

async function handleCallback(req: VercelRequest, res: VercelResponse) {
  const baseUrl = getBaseUrl(req);
  const url = new URL(req.url!, baseUrl);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  if (!code) {
    return res.redirect(302, "/?error=no_code");
  }

  // Parse returnTo from state
  let returnTo = "/";
  if (stateParam) {
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, "base64url").toString());
      returnTo = stateData.returnTo || "/";
    } catch {}
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return res.redirect(302, "/?error=token_failed");
  }

  // Get user profile from GitHub
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const githubUser = await userRes.json();

  // Get primary email
  let email: string | null = githubUser.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const emails = await emailsRes.json();
    const primary = emails.find((e: any) => e.primary) || emails[0];
    email = primary?.email || null;
  }

  // Upsert user in database
  const dbUser = await upsertUser({
    openId: `github_${githubUser.id}`,
    name: githubUser.login,
    email,
    avatarUrl: githubUser.avatar_url,
    loginMethod: "github",
  });

  // Create JWT session token
  const token = await new SignJWT({
    userId: dbUser.id,
    openId: dbUser.openId,
    name: dbUser.name,
    email: dbUser.email,
    avatarUrl: dbUser.avatarUrl,
    role: dbUser.role,
    memberTier: dbUser.memberTier,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  // Set cookie
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  res.setHeader("Set-Cookie", cookie);
  return res.redirect(302, returnTo);
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return res.status(200).json({ user: null });
  }

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
      },
    });
  } catch {
    // Invalid token, clear cookie
    const cookie = serialize(COOKIE_NAME, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ user: null });
  }
}

function handleLogout(req: VercelRequest, res: VercelResponse) {
  const cookie = serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ success: true });
}
