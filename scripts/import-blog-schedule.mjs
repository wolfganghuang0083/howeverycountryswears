#!/usr/bin/env node
/**
 * Bulk-import READY blog drafts → content/blog/*.mdx with daily schedule dates.
 * - Never overwrites an existing content/blog/*.mdx
 * - Skips missing inventory numbers (documented gap #20–41)
 * - draft: false; visibility gated by date ≤ today (Asia/Tokyo) on Production
 *
 * Usage: node scripts/import-blog-schedule.mjs [--dry-run] [--source DIR] [--start YYYY-MM-DD] [--csv PATH]
 * Prefer dates from KDP CSV (suggested_date/slug). --start alone is fallback only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content", "blog");
const DEFAULT_SOURCE = "/workspace/hecs-blog-drive-upload";
const START = "2026-09-26";
const MISSING = Array.from({ length: 22 }, (_, i) => 20 + i); // 20..41

const PILL_MAP = {
  scene: "Scene",
  compare: "Compare",
  method: "Method",
  pronounce: "Pronounce",
  author: "Author",
  country: "Country",
  "country-hub": "Country",
  countryhub: "Country",
};

const PRIORITY_RE =
  /\b(uk|u\.s\.a?|usa|britain|british|england|english-speaking|australia|australian|america|american)\b/i;

function parseArgs(argv) {
  const out = { dry: false, source: DEFAULT_SOURCE, start: START };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--dry-run") out.dry = true;
    else if (argv[i] === "--source") out.source = argv[++i];
    else if (argv[i] === "--start") out.start = argv[++i];
  }
  return out;
}

function yamlQuote(s) {
  const t = String(s ?? "").replace(/\r\n/g, "\n").trim();
  if (!t) return '""';
  if (/[:#{}[\],&*?|>!%@`]/.test(t) || /^(true|false|null)$/i.test(t) || /\n/.test(t) || /"/.test(t)) {
    return `"${t.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return t;
}

function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function existingSlugs() {
  const map = new Map();
  for (const f of fs.readdirSync(CONTENT)) {
    if (!f.endsWith(".mdx")) continue;
    const raw = fs.readFileSync(path.join(CONTENT, f), "utf8");
    const m = raw.match(/^slug:\s*["']?([^\s"']+)/m);
    map.set(m ? m[1] : f.replace(/\.mdx$/, ""), f);
  }
  return map;
}

function parseSource(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const base = path.basename(filePath);
  const numM = base.match(/^(\d{3})_/);
  const num = numM ? Number(numM[1]) : null;

  let fm = {};
  let body = raw;
  if (raw.startsWith("---")) {
    const end = raw.indexOf("\n---", 3);
    if (end > 0) {
      const yaml = raw.slice(4, end).trim();
      body = raw.slice(end + 4).replace(/^\s*/, "");
      for (const line of yaml.split("\n")) {
        const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (!m) continue;
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
          v = v.slice(1, -1);
        fm[m[1]] = v;
      }
    }
  }

  const titleM = body.match(/^#\s+(.+)$/m);
  const title = (titleM ? titleM[1] : "").trim();
  const slug =
    (fm.slug || "").trim() ||
    (body.match(/\*\*Slug:\*\*\s*`([^`]+)`/) || [])[1] ||
    "";
  const pillRaw =
    (body.match(/\*\*Pill(?:ar)?:\*\*\s*(.+)$/m) || [])[1] ||
    (body.match(/\*\*Pill:\*\*\s*(.+)$/m) || [])[1] ||
    "";
  const pillKey = pillRaw.split(/[·•|]/)[0].trim().toLowerCase().replace(/\s+/g, "-");
  const pill = PILL_MAP[pillKey] || PILL_MAP[pillKey.replace(/-hub$/, "")] || "Method";

  const desc =
    (fm.meta_description || "").trim() ||
    (() => {
      const hook = body.split(/^##\s+/m)[1] || body;
      const paras = hook
        .replace(/^#[^\n]*\n/, "")
        .replace(/\*\*[^*]+\*\*:.*$/gm, "")
        .split(/\n\n+/)
        .map((p) => p.replace(/\s+/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim())
        .filter((p) => p && !p.startsWith("#") && p.length > 40);
      const t = paras[0] || title;
      return t.length > 157 ? t.slice(0, 157).replace(/\s+\S*$/, "") + "…" : t;
    })();

  // FAQ block
  const faq = [];
  const faqSec = body.match(/##\s+\d*\.?\s*GEO\s*·\s*FAQ\s*\n([\s\S]*?)(?=\n##\s+|\n---\s*\n##\s+Meta|$)/i)
    || body.match(/##\s+[^\n]*FAQ[^\n]*\n([\s\S]*?)(?=\n##\s+|\n---\s*\n##\s+Meta|$)/i);
  if (faqSec) {
    const block = faqSec[1];
    const parts = block.split(/\n(?=\*\*Q:)/i).filter(Boolean);
    for (const part of parts) {
      // Sources use **Q: …?** and **A:** answer
      const qm = part.match(/\*\*Q:\s*([\s\S]*?)\*\*/);
      const am = part.match(/\*\*A:\*\*\s*([\s\S]*?)$/) || part.match(/\*\*A:\s*([\s\S]*?)$/);
      if (!qm || !am) continue;
      const q = qm[1].replace(/\s+/g, " ").trim();
      const a = am[1].replace(/\s+/g, " ").trim();
      if (q && a) faq.push({ q, a });
    }
  }

  // countries from links
  const countries = [];
  const seen = new Set();
  for (const m of body.matchAll(/\/country\/([a-z0-9-]+)/gi)) {
    const id = m[1].toLowerCase();
    if (!seen.has(id)) {
      seen.add(id);
      countries.push(id);
    }
  }

  // Body cleanup: drop YAML-ish meta under H1, FAQ section, Meta/Word count
  let md = body;
  // Remove status/meta lines right under H1 until first ##
  {
    const hm = md.match(/^(#\s+[^\n]+)\n([\s\S]*?)(?=\n##\s+)/);
    if (hm) md = hm[1] + "\n\n" + md.slice(hm[0].length).replace(/^\n+/, "");
  }
  md = md.replace(/\n##\s+\d*\.?\s*GEO\s*·\s*FAQ\s*\n[\s\S]*?(?=\n##\s+|$)/i, "\n");
  md = md.replace(/\n##\s+[^\n]*\bFAQ\b[^\n]*\n[\s\S]*?(?=\n##\s+|$)/i, "\n");
  md = md.replace(/\n---\s*\n##\s+Meta[\s\S]*$/i, "\n");
  md = md.replace(/\n##\s+Meta\s*\(author\)[\s\S]*$/i, "\n");
  md = md.replace(/\n##\s+Word count[\s\S]*$/i, "\n");
  // Strip leading "N. " / "GEO · " from headings
  md = md.replace(/^##\s+\d+\.\s+/gm, "## ");
  md = md.replace(/^##\s+GEO\s*·\s*/gm, "## ");
  md = md.replace(/\n{3,}/g, "\n\n").trim() + "\n";

  // faq / cta / related headings from section titles if present
  const faqHeadingM = body.match(/##\s+[^\n]*FAQ[^\n]*/i);
  let faqHeading = "";
  if (faqHeadingM) {
    faqHeading = faqHeadingM[0]
      .replace(/^##\s+\d+\.\s*/, "")
      .replace(/^##\s+/, "")
      .replace(/^GEO\s*·\s*/i, "")
      .replace(/\bFAQ\b/i, "")
      .replace(/[—–-]+\s*$/, "")
      .trim();
    if (!faqHeading || /^faq$/i.test(faqHeading)) faqHeading = "";
  }

  const ctaM = body.match(/##\s+\d*\.?\s*CTA\s*\n([\s\S]*?)(?=\n##\s+|$)/i);
  let ctaHeading = "";
  if (ctaM) {
    const firstBold = ctaM[1].match(/\*\*Primary:\*\*\s*(.+)/);
    if (firstBold) ctaHeading = firstBold[1].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim().slice(0, 120);
  }

  return {
    num,
    file: base,
    title,
    slug,
    pill,
    description: desc,
    countries,
    faq,
    faqHeading,
    ctaHeading,
    md,
    priority: PRIORITY_RE.test(`${slug} ${title} ${base}`) ? 0 : 1,
  };
}

function renderMdx(post, date) {
  const lines = ["---"];
  lines.push(`title: ${yamlQuote(post.title)}`);
  lines.push(`slug: ${post.slug}`);
  lines.push(`date: ${date}`);
  lines.push(`description: ${yamlQuote(post.description)}`);
  lines.push(`pill: ${post.pill}`);
  lines.push(`lang: en`);
  lines.push(`draft: false`);
  if (post.countries.length) {
    lines.push("countryLinks:");
    for (const c of post.countries) lines.push(`  - /country/${c}`);
    lines.push("countries:");
    for (const c of post.countries) lines.push(`  - ${c}`);
  }
  if (post.faqHeading) lines.push(`faqHeading: ${yamlQuote(post.faqHeading)}`);
  if (post.ctaHeading) lines.push(`ctaHeading: ${yamlQuote(post.ctaHeading)}`);
  if (post.faq.length) {
    lines.push("faq:");
    for (const f of post.faq) {
      lines.push(`  - q: ${yamlQuote(f.q)}`);
      lines.push(`    a: ${yamlQuote(f.a)}`);
    }
  }
  lines.push("---");
  lines.push(post.md.startsWith("# ") ? post.md : `# ${post.title}\n\n${post.md}`);
  return lines.join("\n");
}

function main() {
  const opts = parseArgs(process.argv);
  if (!fs.existsSync(opts.source)) {
    console.error("source missing:", opts.source);
    process.exit(1);
  }
  const live = existingSlugs();
  const files = fs
    .readdirSync(opts.source)
    .filter((f) => /_READY\.md$/i.test(f))
    .map((f) => path.join(opts.source, f));

  const parsed = [];
  const skippedLive = [];
  const errors = [];
  for (const f of files) {
    try {
      const p = parseSource(f);
      if (!p.slug || !p.title) {
        errors.push({ file: path.basename(f), err: "missing slug/title" });
        continue;
      }
      if (live.has(p.slug)) {
        skippedLive.push({ num: p.num, slug: p.slug, file: live.get(p.slug) });
        continue;
      }
      const dest = path.join(CONTENT, `${p.slug}.mdx`);
      if (fs.existsSync(dest)) {
        skippedLive.push({ num: p.num, slug: p.slug, file: `${p.slug}.mdx` });
        continue;
      }
      parsed.push(p);
    } catch (e) {
      errors.push({ file: path.basename(f), err: String(e) });
    }
  }

  parsed.sort((a, b) => a.priority - b.priority || (a.num ?? 0) - (b.num ?? 0) || a.slug.localeCompare(b.slug));

  const schedule = [];
  parsed.forEach((p, i) => {
    const date = addDays(opts.start, i);
    schedule.push({ ...p, date });
  });

  const report = {
    start: opts.start,
    end: schedule.length ? schedule[schedule.length - 1].date : null,
    count: schedule.length,
    missingNumbers: MISSING,
    skippedLive,
    priorityFirst: schedule.filter((s) => s.priority === 0).map((s) => ({ num: s.num, slug: s.slug, date: s.date })),
    errors,
    posts: schedule.map((s) => ({ num: s.num, slug: s.slug, date: s.date, pill: s.pill, priority: s.priority })),
  };

  if (!opts.dry) {
    for (const s of schedule) {
      const dest = path.join(CONTENT, `${s.slug}.mdx`);
      fs.writeFileSync(dest, renderMdx(s, s.date), "utf8");
    }
  }

  const reportPath = path.join(ROOT, "docs", "blog-schedule-bulk-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ dry: opts.dry, written: opts.dry ? 0 : schedule.length, ...report, posts: undefined }, null, 2));
  console.log("report:", reportPath);
}

main();
