import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Amazon Kindle ASIN B0GSGZ3ZJZ — primary book link used site-wide. */
const AMAZON =
  "https://www.amazon.com/dp/B0GSGZ3ZJZ?tag=aitoolverify-20&utm_source=website&utm_medium=cta&utm_campaign=swearbook";

/**
 * Server redirect for /go/book (email clients / no-JS).
 * Client SPA route also exists for GA4 dual-fire when JS runs.
 * Prefer client when both available; rewrite can point here.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query;
  const dest = new URL(AMAZON);
  for (const [k, v] of Object.entries(q)) {
    if (typeof v === "string" && k.startsWith("utm_")) dest.searchParams.set(k, v);
  }
  const surface = typeof q.surface === "string" ? q.surface : "";
  if (surface && !dest.searchParams.get("utm_campaign")) {
    dest.searchParams.set("utm_campaign", `go_book_${surface}`);
  }
  res.statusCode = 302;
  res.setHeader("Location", dest.toString());
  res.setHeader("Cache-Control", "no-store");
  res.end();
}
