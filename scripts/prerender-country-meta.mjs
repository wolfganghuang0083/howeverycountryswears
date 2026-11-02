#!/usr/bin/env node
/**
 * HECS — static HTML for every /country/<slug> (crawlers that do not run JS + api/bot-page.js).
 *
 * Head: per-page <title>, meta description, og:title/og:description/og:url,
 *       twitter:title/twitter:description, canonical -> https://howeverycountryswears.com/country/<slug>.
 *       Source: client/src/data/country-meta.json (overrides per slug, else {name} templates).
 * Body: a crawlable summary inside #root (React replaces it on mount):
 *       culture blurb, the phrases that are public on the live page (all 10 for free countries,
 *       first 3 for book-locked ones — same rule as CountryPage/isLockedContent), friendly-fire +
 *       cultural notes (free countries only), same-country blog posts, method guides, same-region links.
 *
 * Runs AFTER `prerender-blog.mjs html`. If that step already wrote dist/country/<slug>/index.html
 * (Wave A pages from PR #60, marked data-country-ssg), that file is kept as the base: its body links
 * and JSON-LD stay, its title/description stay unless country-meta.json has an override, and the
 * phrase/region sections are appended inside its <main>.
 *
 * Usage (after vite build): node scripts/prerender-country-meta.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const DATA = path.join(ROOT, "client", "src", "data");
const SITE = "https://howeverycountryswears.com";
// Mirror of client/src/lib/data.ts (PREVIEW_COUNTRIES + isLockedContent: part >= 8 is book-locked).
const PREVIEW_COUNTRIES = ["egypt", "kenya", "mexico", "samoa"];
const GUIDE_SLUGS = ["recognition-not-permission-study-profanity", "how-to-read-hecs-country-page"];

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function unesc(s) {
  return String(s)
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const fill = (tpl, name) => String(tpl).split("{name}").join(name);
export function countryMeta(meta, slug, name) {
  const o = (meta.overrides && meta.overrides[slug]) || {};
  return {
    title: o.title || fill(meta.defaults.title, name),
    description: o.description || fill(meta.defaults.description, name),
    overridden: { title: !!o.title, description: !!o.description },
  };
}
export const isLocked = (c) =>
  !PREVIEW_COUNTRIES.includes(c.slug) && Number(c.part_id) >= 8;

function must(html, re, label, slug) {
  if (!re.test(html)) throw new Error(`[country-meta] ${slug}: shell has no ${label} tag`);
}
const metaRe = (attr, key) =>
  new RegExp(`<meta\\s+${attr}="${key.replace(/[.:]/g, "\\$&")}"\\s+content="[^"]*"\\s*\\/?>`, "i");

export function setHead(html, { slug, title, description }) {
  const t = esc(title);
  const d = esc(description);
  const url = `${SITE}/country/${slug}`;
  const swaps = [
    ["title", /<title>[^<]*<\/title>/i, `<title>${t}</title>`],
    ["description", metaRe("name", "description"), `<meta name="description" content="${d}" />`],
    ["og:title", metaRe("property", "og:title"), `<meta property="og:title" content="${t}" />`],
    ["og:description", metaRe("property", "og:description"), `<meta property="og:description" content="${d}" />`],
    ["og:url", metaRe("property", "og:url"), `<meta property="og:url" content="${url}" />`],
    ["twitter:title", metaRe("name", "twitter:title"), `<meta name="twitter:title" content="${t}" />`],
    ["twitter:description", metaRe("name", "twitter:description"), `<meta name="twitter:description" content="${d}" />`],
    ["canonical", /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${url}" />`],
  ];
  for (const [label, re, rep] of swaps) {
    must(html, re, label, slug);
    html = html.replace(re, rep);
  }
  return html;
}

function readHead(html) {
  const t = html.match(/<title>([^<]*)<\/title>/i);
  const d = html.match(metaRe("name", "description"));
  const dv = d && d[0].match(/content="([^"]*)"/);
  return { title: t ? unesc(t[1]) : "", description: dv ? unesc(dv[1]) : "" };
}

const li = (href, text, extra = "") =>
  `<li><a href="${esc(href)}">${esc(text)}</a>${extra ? ` — ${esc(extra)}` : ""}</li>`;

function phrasesSection(c) {
  const locked = isLocked(c);
  const cards = locked ? c.cards.slice(0, 3) : c.cards;
  const items = cards
    .map(
      (k) =>
        `<li><a href="/phrase/${esc(c.slug)}-${esc(k.number)}"><strong>${esc(k.phrase)}</strong></a>` +
        (k.ipa ? ` <span class="ipa">${esc(k.ipa)}</span>` : "") +
        (k.literal ? ` — “${esc(k.literal)}”` : "") +
        `<br/><span>${esc(k.type)}${k.register ? ` · ${esc(k.register)}` : ""}${k.risk ? ` · Risk: ${esc(k.risk)}` : ""}</span>` +
        (k.feels_like ? `<br/><span>${esc(k.feels_like)}</span>` : "") +
        `</li>`,
    )
    .join("\n");
  return (
    `<section aria-label="Phrases" data-country-phrases="${esc(c.slug)}">` +
    `<h2>${locked ? `Preview: 3 of 10 phrases from ${esc(c.name)}` : `10 phrases from ${esc(c.name)}`}</h2>` +
    (locked ? `<p>The other 7 are in the book. <a href="/get-the-book">Get the book</a></p>` : "") +
    `<ol>\n${items}\n</ol></section>`
  );
}

function notesSection(c) {
  if (isLocked(c)) return "";
  let s = "";
  if (c.friendly_fire_warning) {
    s += `<section aria-label="Friendly fire warning"><h2>Friendly fire warning</h2><p>${esc(c.friendly_fire_warning)}</p></section>`;
  }
  if (Array.isArray(c.cultural_notes) && c.cultural_notes.length) {
    s += `<section aria-label="Cultural notes"><h2>Cultural notes</h2><ul>${c.cultural_notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></section>`;
  }
  return s;
}

function blogSection(c, posts, skipSlugs) {
  const live = posts.filter((p) => !p.draft && (p.lang || "en") === "en");
  const same = live
    .filter((p) => (p.countries || []).includes(c.slug) && !skipSlugs.has(p.slug))
    .slice(0, 5);
  const guides = GUIDE_SLUGS.map((s) => live.find((p) => p.slug === s)).filter(
    (p) => p && !skipSlugs.has(p.slug) && !same.includes(p),
  );
  let s = "";
  if (same.length) {
    s +=
      `<section aria-label="${esc(c.name)} on the HECS Blog" data-country-blog="${esc(c.slug)}">` +
      `<h2>${esc(c.name)} on the HECS Blog</h2><ul>` +
      same.map((p) => li(`/blog/${p.slug}/`, p.title, p.description)).join("") +
      `</ul></section>`;
  }
  if (guides.length) {
    s +=
      `<section aria-label="How to read this page"><h2>How to read this page</h2><ul>` +
      guides.map((p) => li(`/blog/${p.slug}/`, p.title)).join("") +
      `</ul></section>`;
  }
  return s;
}

function regionSection(c, countries) {
  const peers = countries.filter((x) => x.region_slug === c.region_slug && x.slug !== c.slug);
  const i = countries.findIndex((x) => x.slug === c.slug);
  const prev = countries[(i - 1 + countries.length) % countries.length];
  const next = countries[(i + 1) % countries.length];
  return (
    `<nav aria-label="More countries" data-country-region="${esc(c.region_slug)}">` +
    `<h2>More from <a href="/region/${esc(c.region_slug)}">${esc(c.region)}</a></h2><ul>` +
    peers.map((x) => li(`/country/${x.slug}`, `${x.name} swear words`)).join("") +
    `</ul><p><a href="/country/${esc(prev.slug)}">← ${esc(prev.name)}</a> · ` +
    `<a href="/country/${esc(next.slug)}">${esc(next.name)} →</a> · ` +
    `<a href="/">All 100 countries</a> · <a href="/blog/">HECS Blog</a></p></nav>`
  );
}

function webPageLd(c, title, url) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url,
    inLanguage: "en",
    about: { "@type": "Place", name: c.name },
    isPartOf: { "@type": "WebSite", name: "How Every Country Swears", url: SITE },
  };
}

function main() {
  const shellPath = path.join(DIST, "index.html");
  if (!fs.existsSync(shellPath)) throw new Error(`Missing ${shellPath} — run vite build first`);
  const shell = fs.readFileSync(shellPath, "utf8");
  const meta = JSON.parse(fs.readFileSync(path.join(DATA, "country-meta.json"), "utf8"));
  const { countries } = JSON.parse(fs.readFileSync(path.join(DATA, "countries.json"), "utf8"));
  const posts = JSON.parse(fs.readFileSync(path.join(DATA, "blog-posts.json"), "utf8"));
  const known = new Set(countries.map((c) => c.slug));
  for (const k of Object.keys(meta.overrides || {})) {
    if (!known.has(k)) throw new Error(`[country-meta] override for unknown slug: ${k}`);
  }
  if (!/<div id="root"><\/div>/.test(shell)) throw new Error("[country-meta] shell has no empty #root");

  let fresh = 0;
  let merged = 0;
  for (const c of countries) {
    if (!/^[a-z0-9-]+$/.test(c.slug)) throw new Error(`[country-meta] bad slug: ${c.slug}`);
    const dir = path.join(DIST, "country", c.slug);
    const file = path.join(dir, "index.html");
    const m = countryMeta(meta, c.slug, c.name);
    const url = `${SITE}/country/${c.slug}`;
    const extra = phrasesSection(c) + notesSection(c);

    const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (existing && /data-country-ssg=/.test(existing)) {
      // Built by prerender-blog.mjs (Wave A). Keep its body/JSON-LD; only fill gaps.
      const cur = readHead(existing);
      const title = m.overridden.title ? m.title : cur.title || m.title;
      const description = m.overridden.description ? m.description : cur.description || m.description;
      const linked = new Set([...existing.matchAll(/href="\/blog\/([^"/]+)\/"/g)].map((x) => x[1]));
      let html = setHead(existing, { slug: c.slug, title, description });
      const add = extra + blogSection(c, posts, linked) + regionSection(c, countries);
      if (!/<\/main>/.test(html)) throw new Error(`[country-meta] ${c.slug}: existing page has no </main>`);
      html = html.replace(/<\/main>/, `${add}</main>`);
      fs.writeFileSync(file, html, "utf8");
      merged++;
      continue;
    }

    const body =
      `<main class="country-ssg" data-country-ssg="${esc(c.slug)}">` +
      `<h1>${esc(c.name)} Swear Words — 10 Phrases with Pronunciation</h1>` +
      `<p>${esc(c.culture || c.description || "")}</p>` +
      (c.dominant_pattern ? `<p>Dominant pattern: ${esc(c.dominant_pattern)} · Tone dependence: ${esc(c.tone_dependence || "")}</p>` : "") +
      extra +
      blogSection(c, posts, new Set()) +
      regionSection(c, countries) +
      `</main>`;
    let html = setHead(shell, { slug: c.slug, title: m.title, description: m.description });
    const ld = `<script type="application/ld+json">\n${JSON.stringify(webPageLd(c, m.title, url), null, 2).replace(/</g, "\\u003c")}\n</script>\n`;
    html = html.replace(/<\/head>/i, `${ld}</head>`);
    html = html.replace(/<div id="root"><\/div>/, `<div id="root">${body}</div>`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, html, "utf8");
    fresh++;
  }
  // dist/sitemap.xml (written by prerender-blog.mjs): add any free/preview country page that the
  // static base sitemap lacks (e.g. samoa, a PREVIEW_COUNTRIES entry). Book-locked countries stay out.
  const smPath = path.join(DIST, "sitemap.xml");
  if (fs.existsSync(smPath)) {
    let xml = fs.readFileSync(smPath, "utf8");
    const missing = countries.filter(
      (c) => !isLocked(c) && !xml.includes(`<loc>${SITE}/country/${c.slug}</loc>`),
    );
    if (missing.length) {
      const entries = missing
        .map((c) => `  <url>\n    <loc>${SITE}/country/${c.slug}</loc>\n    <priority>0.8</priority>\n  </url>`)
        .join("\n");
      xml = xml.replace(/\s*<\/urlset>\s*$/, `\n${entries}\n</urlset>\n`);
      fs.writeFileSync(smPath, xml, "utf8");
    }
    console.log(`OK sitemap country add=${missing.length}${missing.length ? ` (${missing.map((c) => c.slug).join(",")})` : ""}`);
  }
  console.log(
    `OK country html=${fresh + merged} (new=${fresh}, merged-with-wave-a=${merged}) overrides=${Object.keys(meta.overrides || {}).length}`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
