// POST /api/hit — human page-view beacon (navigator.sendBeacon / fetch keepalive).
// Responds 204 immediately; the insert runs after the response and DB errors are ignored.
import { detectBot, isSearchEngine, clip, headerStr, insertHit, getWaitUntil } from "./_lib/pageHits.js";

const MAX_BODY = 2048;
const MAX_PATH = 512;

function parseBody(body) {
  if (!body) return null;
  if (typeof body === "string") {
    if (body.length > MAX_BODY) return null;
    try { return JSON.parse(body); } catch { return null; }
  }
  if (Buffer.isBuffer(body)) return parseBody(body.toString("utf8"));
  if (typeof body === "object") return body;
  return null;
}

export default async function handler(req, res) {
  res.statusCode = 204;
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.end(); return; }

  let row = null;
  try {
    const site = headerStr(req.headers["sec-fetch-site"]);
    const data = parseBody(req.body);
    const p = data && data.p;
    const r = data && data.r;
    const ua = headerStr(req.headers["user-agent"]);
    if (
      site !== "cross-site" &&
      typeof p === "string" && p.startsWith("/") && p.length <= MAX_PATH &&
      !p.startsWith("/api/") &&
      (r === undefined || typeof r === "string") &&
      !isSearchEngine(ua)
    ) {
      const bot = detectBot(ua);
      row = {
        path: p,
        ua: clip(ua, 512) || "",
        isBot: bot !== null,
        botName: bot,
        country: clip(headerStr(req.headers["x-vercel-ip-country"]), 8),
        referer: clip(r, 512),
        source: "beacon",
      };
    }
  } catch { row = null; }

  res.end();
  if (!row) return;
  const job = insertHit(row);
  const wu = getWaitUntil();
  if (wu) wu(job); else await job;
}
