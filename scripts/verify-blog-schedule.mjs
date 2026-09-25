#!/usr/bin/env node
/** Simulate Production vs Preview visibility for scheduled posts. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content", "blog");

function todayTokyo(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
function isPublic(post, { asOf, preview }) {
  if (preview) return true;
  if (post.draft) return false;
  return post.date <= asOf;
}
function parse(file) {
  const raw = fs.readFileSync(path.join(CONTENT, file), "utf8");
  const fm = raw.split("---")[1] || "";
  const get = (k) => (fm.match(new RegExp("^" + k + ":\\s*(.*)$", "m")) || [])[1]?.replace(/^["']|["']$/g, "").trim();
  return { file, slug: get("slug"), date: get("date"), draft: get("draft") === "true", title: get("title") };
}

const posts = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".mdx")).map(parse);
const asOfToday = todayTokyo();
const future = posts.filter((p) => !p.draft && p.date > asOfToday).sort((a, b) => a.date.localeCompare(b.date));
const sample = future.slice(0, 3);
const liveUntouched = posts.filter((p) => p.date === "2026-09-16");

console.log(JSON.stringify({
  asOfTodayTokyo: asOfToday,
  totalMdx: posts.length,
  liveDate20260916: liveUntouched.length,
  futureCount: future.length,
  sampleFuture: sample.map((p) => ({
    slug: p.slug,
    date: p.date,
    visibleProdToday: isPublic(p, { asOf: asOfToday, preview: false }),
    visibleProdOnDate: isPublic(p, { asOf: p.date, preview: false }),
    visiblePreview: isPublic(p, { asOf: asOfToday, preview: true }),
  })),
  scheduleStart: future[0]?.date,
  scheduleEnd: future.at(-1)?.date,
}, null, 2));
