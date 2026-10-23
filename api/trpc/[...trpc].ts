import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../_lib/routers.js";
import { createContext } from "../_lib/trpc.js";

// Public, user-independent read queries. When an anonymous GET batch contains ONLY these,
// let Vercel's CDN cache the response so repeat visitors/bots don't wake the database.
const CDN_CACHEABLE = new Set([
  "rating.getForCountry",
  "review.getForCard",
  "review.summaryForCountry",
  "ambassador.list",
  "ambassador.getForCountry",
  "dashboard.leaderboard",
  "submission.leaderboard",
]);
const CDN_CACHE_HEADER = "public, max-age=0, s-maxage=600, stale-while-revalidate=86400";

function isCdnCacheable(req: VercelRequest): boolean {
  if (req.method !== "GET") return false;
  if (/(?:^|;\s*)hecs_session=/.test(req.headers.cookie || "")) return false;
  const raw = typeof req.query?.path === "string" ? req.query.path : "";
  const procs = raw.split(",").filter(Boolean);
  return procs.length > 0 && procs.every((p) => CDN_CACHEABLE.has(p));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert VercelRequest to a standard Request for tRPC fetch adapter
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = `${proto}://${host}${req.url}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = JSON.stringify(req.body);
  }

  const fetchReq = new Request(url, {
    method: req.method,
    headers,
    body,
  });

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: fetchReq,
    router: appRouter,
    createContext: () => createContext(req),
  });

  // Copy response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (response.status === 200 && isCdnCacheable(req)) {
    res.setHeader("Cache-Control", CDN_CACHE_HEADER);
  }

  res.status(response.status);
  const responseBody = await response.text();
  res.send(responseBody);
}
