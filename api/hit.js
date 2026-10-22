// POST /api/hit — human page-view beacon (navigator.sendBeacon / fetch keepalive).
// Accepts a batch {hits:[{p,r,t}]} (client queue) or the legacy single {p,r}.
// Responds 204 immediately; ONE multi-row insert runs after the response; DB errors ignored.
// (api/bot-page.js — the bot-only server route — still uses insertHit unchanged.)
import { detectBot, isSearchEngine, clip, headerStr, insertHits, clampTs, getWaitUntil } from "./_lib/pageHits.js";

const MAX_BODY = 32768;
const MAX_PATH = 512;
const MAX_HITS = 20;

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

export function buildRows(data, headers, now = Date.now()) {
  const site = headerStr(headers["sec-fetch-site"]);
  const ua = headerStr(headers["user-agent"]);
  if (!data || site === "cross-site" || isSearchEngine(ua)) return [];
  const list = Array.isArray(data.hits) ? data.hits.slice(0, MAX_HITS) : [data];
  const bot = detectBot(ua);
  const country = clip(headerStr(headers["x-vercel-ip-country"]), 8);
  const rows = [];
  for (const h of list) {
    const p = h && h.p;
    const r = h && h.r;
    if (
      typeof p === "string" && p.startsWith("/") && p.length <= MAX_PATH &&
      !p.startsWith("/api/") &&
      (r === undefined || typeof r === "string")
    ) {
      rows.push({
        ts: clampTs(h.t, now),
        path: p,
        ua: clip(ua, 512) || "",
        isBot: bot !== null,
        botName: bot,
        country,
        referer: clip(r, 512),
        source: "beacon",
      });
    }
  }
  return rows;
}

export default async function handler(req, res) {
  res.statusCode = 204;
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.end(); return; }

  let rows = [];
  try { rows = buildRows(parseBody(req.body), req.headers); } catch { rows = []; }

  res.end();
  if (rows.length === 0) return;
  const job = insertHits(rows);
  const wu = getWaitUntil();
  if (wu) wu(job); else await job;
}
