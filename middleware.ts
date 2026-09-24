/**
 * Minimal HTML page-hit logging (human vs bot share).
 * - Runs only on extensionless, non-API paths (see matcher) with Accept: text/html.
 * - Never blocks the response: the DB write is handed to waitUntil and the
 *   middleware returns immediately (undefined = continue to the page).
 * - Errors are swallowed; short timeout. No IP is stored.
 */
import { neon } from "@neondatabase/serverless";

export const config = {
  // Exclude api, Vercel internals, assets, and anything with a file extension.
  matcher: ["/((?!api/|api$|_vercel/|assets/|.*\\..*).*)"],
};

// Specific names first; generic fallbacks last.
const BOT_PATTERNS: string[] = [
  "googlebot", "bingbot", "gptbot", "claudebot", "anthropic", "perplexitybot",
  "bytespider", "applebot", "yandex", "baiduspider", "facebookexternalhit",
  "petalbot", "mj12bot", "dotbot", "ahrefsbot", "semrushbot",
  "curl", "python", "wget", "go-http-client", "headless",
  "spider", "crawl", "bot",
];

export function detectBot(ua: string): string | null {
  const s = ua.toLowerCase();
  for (const p of BOT_PATTERNS) if (s.includes(p)) return p;
  return null;
}

const WRITE_TIMEOUT_MS = 1500;

function clip(v: string | null, n: number): string | null {
  return v ? v.slice(0, n) : null;
}

async function logHit(
  dbUrl: string,
  row: { path: string; ua: string; bot: string | null; country: string | null; referer: string | null },
): Promise<void> {
  try {
    const sql = neon(dbUrl, {
      fetchOptions: { signal: AbortSignal.timeout(WRITE_TIMEOUT_MS) },
    });
    await sql`INSERT INTO page_hits (path, user_agent, is_bot, bot_name, country, referer)
      VALUES (${row.path}, ${row.ua}, ${row.bot !== null}, ${row.bot}, ${row.country}, ${row.referer})`;
  } catch {
    /* swallow — logging must never affect serving */
  }
}

type Ctx = { waitUntil?: (p: Promise<unknown>) => void };

export default function middleware(request: Request, context?: Ctx): undefined {
  try {
    if (request.method !== "GET") return;
    const accept = request.headers.get("accept") || "";
    // Browsers send text/html; many bots send */* — accept both, skip explicit non-HTML.
    if (accept && !accept.includes("text/html") && !accept.includes("*/*")) return;
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || !context?.waitUntil) return;

    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";
    const row = {
      path: clip(url.pathname, 512) || "/",
      ua: clip(ua, 512) || "",
      bot: ua ? detectBot(ua) : "empty-ua",
      country: clip(request.headers.get("x-vercel-ip-country"), 8),
      referer: clip(request.headers.get("referer"), 512),
    };
    context.waitUntil(logHit(dbUrl, row));
  } catch {
    /* never throw */
  }
  return;
}
