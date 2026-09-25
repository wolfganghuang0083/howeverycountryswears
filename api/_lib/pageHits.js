// Shared helpers for page_hits logging (plain ESM JS so .js functions can import it).
// No IP is ever stored.
import { neon } from "@neondatabase/serverless";

// Search-engine crawlers are NEVER logged (their volume comes from GSC crawl stats).
// Keep in sync with the `has` lookahead in vercel.json routes.
export const SEARCH_ENGINE_RE =
  /google|bingbot|bingpreview|msnbot|adidxbot|duckduckbot|duckassistbot|yandex|baiduspider|baidu|applebot|mediapartners/i;

// Specific names first; generic fallbacks last. Keep a subset of the vercel.json bot regex.
const BOT_PATTERNS = [
  "gptbot", "chatgpt-user", "oai-searchbot", "claudebot", "claude-web", "anthropic",
  "perplexitybot", "ccbot", "bytespider", "amazonbot", "meta-externalagent",
  "facebookexternalhit", "ahrefsbot", "semrushbot", "mj12bot", "dotbot", "petalbot",
  "curl", "wget", "python", "go-http-client", "scrapy", "axios", "node-fetch", "okhttp",
  "libwww", "java/", "httpclient", "headless", "spider", "crawl", "bot",
];

export function isSearchEngine(ua) {
  return typeof ua === "string" && SEARCH_ENGINE_RE.test(ua);
}

/** Returns matched bot name, or null for a (presumed) human UA. Empty UA => "empty-ua". */
export function detectBot(ua) {
  if (!ua) return "empty-ua";
  const s = String(ua).toLowerCase();
  for (const p of BOT_PATTERNS) if (s.includes(p)) return p;
  return null;
}

export function clip(v, n) {
  return typeof v === "string" && v.length ? v.slice(0, n) : null;
}

export function headerStr(h) {
  return Array.isArray(h) ? h[0] || "" : typeof h === "string" ? h : "";
}

const WRITE_TIMEOUT_MS = 1500;

/** Insert one row; never throws; bounded by a short timeout. */
export async function insertHit(row, dbUrlOverride) {
  try {
    const dbUrl = dbUrlOverride || process.env.DATABASE_URL;
    if (!dbUrl) return false;
    const sql = neon(dbUrl, { fetchOptions: { signal: AbortSignal.timeout(WRITE_TIMEOUT_MS) } });
    await Promise.race([
      sql`INSERT INTO page_hits (path, user_agent, is_bot, bot_name, country, referer, source)
          VALUES (${row.path}, ${row.ua}, ${row.isBot}, ${row.botName}, ${row.country}, ${row.referer}, ${row.source})`,
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), WRITE_TIMEOUT_MS + 200)),
    ]);
    return true;
  } catch {
    return false; // swallow: logging must never affect serving
  }
}

/** Run a promise after the response: Vercel waitUntil if available, else the caller awaits it. */
export function getWaitUntil() {
  try {
    const ctx = globalThis[Symbol.for("@vercel/request-context")]?.get?.();
    return typeof ctx?.waitUntil === "function" ? ctx.waitUntil.bind(ctx) : null;
  } catch {
    return null;
  }
}
