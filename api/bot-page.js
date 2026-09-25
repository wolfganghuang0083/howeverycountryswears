// Serves HTML to non-search-engine bot UAs (routed here by vercel.json `has: user-agent`)
// and logs the hit. The response must be byte-identical to what the static route serves:
//   filesystem (dist/<path>/index.html, dist/index.html for "/") -> SPA fallback (dist/index.html)
//   -> platform 404 for blog paths. Logging runs after the response and never fails the page.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NOT_FOUND_HTML } from "./_lib/notFoundTemplate.js";
import { detectBot, isSearchEngine, clip, headerStr, insertHit, getWaitUntil } from "./_lib/pageHits.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST_CANDIDATES = [path.join(process.cwd(), "dist"), path.join(HERE, "..", "dist")];
// Mirror of the SPA-fallback rewrite in vercel.json (paths NOT matching fall through to 404).
const SPA_FALLBACK_RE = /^\/((?!api\/|(?:es|zh-tw)\/blog(?:\/|$)|blog(?:\/|$)).*)$/;

async function readFirst(rel) {
  for (const base of DIST_CANDIDATES) {
    const full = path.join(base, rel);
    if (!full.startsWith(base + path.sep)) continue;
    try { return await readFile(full); } catch { /* next */ }
  }
  return null;
}

async function resolveHtml(rawPath) {
  let p = "/";
  try { p = decodeURIComponent(rawPath || "/"); } catch { return null; }
  if (!p.startsWith("/")) p = "/" + p;
  if (p.includes("\0") || p.split("/").includes("..")) return null;
  const rel = p.replace(/^\/+|\/+$/g, "");
  if (rel) {
    const dirIndex = await readFirst(path.posix.join(rel, "index.html"));
    if (dirIndex) return dirIndex;
  } else {
    return readFirst("index.html");
  }
  if (SPA_FALLBACK_RE.test(p)) return readFirst("index.html");
  return null; // -> 404 like the platform
}

export default async function handler(req, res) {
  const q = req.query || {};
  const rawPath = typeof q.__hecs_path === "string" ? q.__hecs_path : "/";
  let body = null;
  try { body = await resolveHtml(rawPath); } catch { body = null; }

  if (body) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("Content-Length", String(body.length));
    res.end(req.method === "HEAD" ? undefined : body);
  } else {
    const id = headerStr(req.headers["x-vercel-id"]);
    // Platform 404 is content-negotiated: HTML page when Accept has text/html, else plain text.
    const wantsHtml = headerStr(req.headers["accept"]).includes("text/html");
    const txt = wantsHtml
      ? Buffer.from(NOT_FOUND_HTML.split("__HECS_VERCEL_ID__").join(id), "utf8")
      : Buffer.from(`The page could not be found\n\nNOT_FOUND\n\n${id}\n`, "utf8");
    res.statusCode = 404;
    res.setHeader("Content-Type", wantsHtml ? "text/html; charset=utf-8" : "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("X-Vercel-Error", "NOT_FOUND");
    res.setHeader("Content-Length", String(txt.length));
    res.end(req.method === "HEAD" ? undefined : txt);
  }

  // ---- logging (after the response; never throws) ----
  try {
    const ua = headerStr(req.headers["user-agent"]);
    if (isSearchEngine(ua)) return; // defense in depth: search engines are never logged
    let p = "/";
    try { p = decodeURIComponent(rawPath || "/"); } catch { p = rawPath || "/"; }
    if (!p.startsWith("/")) p = "/" + p;
    const row = {
      path: p.slice(0, 512),
      ua: clip(ua, 512) || "",
      isBot: true,
      botName: detectBot(ua) || "other",
      country: clip(headerStr(req.headers["x-vercel-ip-country"]), 8),
      referer: clip(headerStr(req.headers["referer"]), 512),
      source: "server",
    };
    // Preview-only test hook to simulate DB failure (unreachable host => timeout path).
    const failUrl =
      process.env.VERCEL_ENV !== "production" && q.__hecs_dbfail === "1"
        ? "postgresql://probe:probe@10.255.255.1/neondb"
        : undefined;
    const job = insertHit(row, failUrl);
    const wu = getWaitUntil();
    if (wu) wu(job); else await job;
  } catch { /* ignore */ }
}
