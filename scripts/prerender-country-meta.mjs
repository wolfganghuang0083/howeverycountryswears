#!/usr/bin/env node
/**
 * HECS — per-country static HTML shells for /country/<slug>.
 * Copies dist/index.html (the SPA shell) to dist/country/<slug>/index.html with page-specific
 * <title>, meta description, og:title/og:description/og:url, twitter:title/description and canonical,
 * so crawlers that do not run JS (and the bot-page route) see the same values the SPA sets.
 * Body is untouched: the React app still mounts in #root.
 * Data: client/src/data/country-meta.json (overrides + {name} templates), countries.json.
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

export function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const fill = (tpl, name) => String(tpl).split("{name}").join(name);

export function countryMeta(meta, slug, name) {
  const o = (meta.overrides && meta.overrides[slug]) || {};
  return {
    title: o.title || fill(meta.defaults.title, name),
    description: o.description || fill(meta.defaults.description, name),
  };
}

function replaceTag(html, re, replacement, label, slug) {
  if (!re.test(html)) throw new Error(`[country-meta] ${slug}: shell has no ${label} tag`);
  return html.replace(re, replacement);
}

export function renderCountryShell(shell, { slug, title, description }) {
  const t = escapeAttr(title);
  const d = escapeAttr(description);
  const url = `${SITE}/country/${slug}`;
  let html = shell;
  html = replaceTag(html, /<title>[^<]*<\/title>/i, `<title>${t}</title>`, "title", slug);
  const metaRe = (attr, key) =>
    new RegExp(`<meta\\s+${attr}="${key.replace(/[.:]/g, "\\$&")}"\\s+content="[^"]*"\\s*\\/?>`, "i");
  html = replaceTag(html, metaRe("name", "description"), `<meta name="description" content="${d}" />`, "description", slug);
  html = replaceTag(html, metaRe("property", "og:title"), `<meta property="og:title" content="${t}" />`, "og:title", slug);
  html = replaceTag(html, metaRe("property", "og:description"), `<meta property="og:description" content="${d}" />`, "og:description", slug);
  html = replaceTag(html, metaRe("property", "og:url"), `<meta property="og:url" content="${url}" />`, "og:url", slug);
  html = replaceTag(html, metaRe("name", "twitter:title"), `<meta name="twitter:title" content="${t}" />`, "twitter:title", slug);
  html = replaceTag(html, metaRe("name", "twitter:description"), `<meta name="twitter:description" content="${d}" />`, "twitter:description", slug);
  html = replaceTag(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${url}" />`, "canonical", slug);
  return html;
}

function main() {
  const shellPath = path.join(DIST, "index.html");
  if (!fs.existsSync(shellPath)) throw new Error(`Missing ${shellPath} — run vite build first`);
  const shell = fs.readFileSync(shellPath, "utf8");
  const meta = JSON.parse(fs.readFileSync(path.join(DATA, "country-meta.json"), "utf8"));
  const { countries } = JSON.parse(fs.readFileSync(path.join(DATA, "countries.json"), "utf8"));
  const known = new Set(countries.map((c) => c.slug));
  for (const k of Object.keys(meta.overrides || {})) {
    if (!known.has(k)) throw new Error(`[country-meta] override for unknown slug: ${k}`);
  }
  let n = 0;
  for (const c of countries) {
    if (!/^[a-z0-9-]+$/.test(c.slug)) throw new Error(`[country-meta] bad slug: ${c.slug}`);
    const html = renderCountryShell(shell, { slug: c.slug, ...countryMeta(meta, c.slug, c.name) });
    const dir = path.join(DIST, "country", c.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    n++;
  }
  console.log(`OK country meta html=${n} overrides=${Object.keys(meta.overrides || {}).length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
