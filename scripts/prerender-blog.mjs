#!/usr/bin/env node
/**
 * HECS Blog — MDX → manifest JSON + static HTML (body + BlogPosting JSON-LD + hreflang).
 * Usage:
 *   node scripts/prerender-blog.mjs manifest
 *   node scripts/prerender-blog.mjs html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "blog");
const MANIFEST = path.join(ROOT, "client", "src", "data", "blog-posts.json");
const DIST = path.join(ROOT, "dist");

function todayTokyo(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Production deploy: only draft=false AND date≤today Tokyo. Preview/dev: all. */
function isPublicPost(post, { asOf = todayTokyo(), preview = process.env.VERCEL_ENV !== "production" } = {}) {
  if (preview) return true;
  if (post.draft) return false;
  const d = String(post.date || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= asOf;
}

const SITE = "https://howeverycountryswears.com";
const METHOD_SLUG = "recognition-not-permission-study-profanity";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unquote(s) {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return s;
}

function slugifyHeading(text) {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "section"
  );
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/** Minimal YAML frontmatter parser for locked v0.2 shape + countries/translations. */
function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) throw new Error("missing frontmatter");
  const end = raw.indexOf("\n---", 3);
  if (end < 0) throw new Error("unterminated frontmatter");
  const yaml = raw.slice(3, end).replace(/^\n/, "");
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const data = {};
  const lines = yaml.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.match(/^faq:\s*$/)) {
      data.faq = [];
      i++;
      while (i < lines.length) {
        const qm = lines[i].match(/^\s*-\s*q:\s*(.*)$/);
        if (!qm) break;
        const q = unquote(qm[1].trim());
        i++;
        let a = "";
        if (i < lines.length) {
          const am = lines[i].match(/^\s+a:\s*(.*)$/);
          if (am) {
            a = unquote(am[1].trim());
            i++;
          }
        }
        data.faq.push({ q, a });
      }
      continue;
    }
    if (line.match(/^countryLinks:\s*$/)) {
      data.countryLinks = [];
      i++;
      while (i < lines.length) {
        const lm = lines[i].match(/^\s*-\s+(\S+)\s*$/);
        if (!lm) break;
        data.countryLinks.push(lm[1]);
        i++;
      }
      continue;
    }
    if (line.match(/^countries:\s*$/)) {
      data.countries = [];
      i++;
      while (i < lines.length) {
        const lm = lines[i].match(/^\s*-\s+(\S+)\s*$/);
        if (!lm) break;
        data.countries.push(lm[1].replace(/^\/country\//, ""));
        i++;
      }
      continue;
    }
    if (line.match(/^related:\s*$/)) {
      data.related = [];
      i++;
      while (i < lines.length) {
        const lm = lines[i].match(/^\s*-\s+(\S+)\s*$/);
        if (!lm) break;
        data.related.push(unquote(lm[1].trim()));
        i++;
      }
      continue;
    }
    if (line.match(/^phraseEmbeds:\s*$/)) {
      data.phraseEmbeds = [];
      i++;
      while (i < lines.length) {
        const cm = lines[i].match(/^\s*-\s*country:\s*(.*)$/);
        if (!cm) break;
        const country = unquote(cm[1].trim()).replace(/^\/country\//, "");
        i++;
        let numbers = [];
        let number = null;
        while (i < lines.length) {
          const numsInline = lines[i].match(/^\s+numbers:\s*\[([^\]]*)\]\s*$/);
          const numsBlock = lines[i].match(/^\s+numbers:\s*$/);
          const numOne = lines[i].match(/^\s+number:\s*(.*)$/);
          if (numsInline) {
            numbers = numsInline[1]
              .split(",")
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => Number.isFinite(n));
            i++;
            continue;
          }
          if (numsBlock) {
            i++;
            while (i < lines.length) {
              const lm = lines[i].match(/^\s+-\s+(\d+)\s*$/);
              if (!lm) break;
              numbers.push(parseInt(lm[1], 10));
              i++;
            }
            continue;
          }
          if (numOne) {
            const n = parseInt(unquote(numOne[1].trim()), 10);
            if (Number.isFinite(n)) number = n;
            i++;
            continue;
          }
          break;
        }
        if (numbers.length) {
          data.phraseEmbeds.push({ country, numbers });
        } else if (number != null) {
          data.phraseEmbeds.push({ country, number });
        }
      }
      continue;
    }
    if (line.match(/^translations:\s*$/)) {
      data.translations = [];
      i++;
      while (i < lines.length) {
        const lm = lines[i].match(/^\s*-\s*lang:\s*(\S+)\s*$/);
        if (!lm) break;
        const lang = unquote(lm[1].trim());
        i++;
        let slug = "";
        if (i < lines.length) {
          const sm = lines[i].match(/^\s+slug:\s*(.*)$/);
          if (sm) {
            slug = unquote(sm[1].trim());
            i++;
          }
        }
        if (lang && slug) data.translations.push({ lang, slug });
      }
      continue;
    }
    const km = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!km) {
      i++;
      continue;
    }
    const key = km[1];
    let val = km[2].trim();
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else val = unquote(val);
    data[key] = val;
    i++;
  }
  return { data, body };
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let inTable = false;
  const usedIds = new Map();

  const inline = (t) => {
    t = escapeHtml(t);
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return t;
  };

  const headingId = (text) => {
    let id = slugifyHeading(text);
    const n = usedIds.get(id) || 0;
    usedIds.set(id, n + 1);
    if (n > 0) id = `${id}-${n + 1}`;
    return id;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("|") && line.includes("|", 1)) {
      if (!inTable) {
        out.push("<table>");
        inTable = true;
      }
      if (
        /^\|[\s:|-]+\|$/.test(line.replace(/\s/g, "")) ||
        /^\|(\s*:?-+:?\s*\|)+$/.test(line)
      ) {
        i++;
        continue;
      }
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const isHeader = !out.some((x) => x.startsWith("<tr>"));
      const cellTag = isHeader ? "th" : "td";
      out.push(
        "<tr>" +
          cells.map((c) => `<${cellTag}>${inline(c)}</${cellTag}>`).join("") +
          "</tr>",
      );
      i++;
      continue;
    } else if (inTable) {
      out.push("</table>");
      inTable = false;
    }

    if (/^#{1,6}\s+/.test(line)) {
      const level = line.match(/^(#+)/)[1].length;
      const text = line.replace(/^#+\s+/, "");
      if (level === 2 || level === 3) {
        const id = headingId(text);
        out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      } else {
        out.push(`<h${level}>${inline(text)}</h${level}>`);
      }
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      out.push("<ul>");
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        out.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push("</ul>");
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      out.push("<ol>");
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        out.push(`<li>${inline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push("</ol>");
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const paras = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !lines[i].startsWith("|") &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paras.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(paras.join(" "))}</p>`);
  }
  if (inTable) out.push("</table>");
  return out.join("\n");
}

function extractTocFromHtml(html) {
  const toc = [];
  const re = /<h([23])\s+[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    toc.push({
      level: Number(m[1]),
      id: m[2],
      text: stripTags(m[3]),
    });
  }
  return toc;
}

function deriveCountries(data) {
  if (Array.isArray(data.countries) && data.countries.length) {
    return data.countries.map((c) => String(c).replace(/^\/country\//, ""));
  }
  const links = Array.isArray(data.countryLinks) ? data.countryLinks : [];
  return links
    .map((l) => String(l).replace(/^\/country\//, ""))
    .filter(Boolean);
}

function deriveCountryLinks(countries, countryLinks) {
  if (Array.isArray(countryLinks) && countryLinks.length) return countryLinks;
  return countries.map((id) => `/country/${id}`);
}

function postPath(post) {
  const lang = post.lang || "en";
  if (lang === "es") return `/es/blog/${post.slug}`;
  return `/blog/${post.slug}`;
}

function loadPosts() {
  if (!fs.existsSync(CONTENT)) {
    throw new Error(`Missing content dir: ${CONTENT}`);
  }
  const files = fs
    .readdirSync(CONTENT)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .sort();
  const posts = [];
  const errors = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(CONTENT, file), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const slug = data.slug || file.replace(/\.mdx$/, "");
      if (!data.title) throw new Error("missing title");
      const draft = data.draft !== false;
      const description = data.description || "";
      const html = mdToHtml(body);
      const faq = Array.isArray(data.faq) ? data.faq : [];
      const countries = deriveCountries(data);
      const countryLinks = deriveCountryLinks(
        countries,
        Array.isArray(data.countryLinks) ? data.countryLinks : [],
      );
      const translations = Array.isArray(data.translations)
        ? data.translations
        : [];
      posts.push({
        slug,
        title: data.title,
        description,
        pill: data.pill || "",
        date: data.date || "",
        lang: data.lang || "en",
        draft,
        countries,
        countryLinks,
        translations,
        faq,
        faqHeading: data.faqHeading || "",
        ctaHeading: data.ctaHeading || "",
        nextHeading: data.nextHeading || "",
        relatedHeading: data.relatedHeading || "",
        related: Array.isArray(data.related) ? data.related : [],
        phraseEmbeds: Array.isArray(data.phraseEmbeds) ? data.phraseEmbeds : [],
        html,
        toc: extractTocFromHtml(html),
      });
    } catch (e) {
      errors.push({ file, reason: String(e.message || e) });
    }
  }
  if (errors.length) {
    console.error(JSON.stringify(errors, null, 2));
    throw new Error(`Failed to parse ${errors.length} MDX file(s)`);
  }
  posts.sort(
    (a, b) =>
      String(b.date).localeCompare(String(a.date)) ||
      a.slug.localeCompare(b.slug),
  );
  return posts;
}

function blogPostingLd(post) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date || undefined,
    inLanguage: post.lang || "en",
    url: `${SITE}${postPath(post)}/`,
    isAccessibleForFree: true,
    creativeWorkStatus: post.draft ? "Draft" : "Published",
  };
  if (post.faq.length) {
    jsonLd.hasPart = {
      "@type": "FAQPage",
      mainEntity: post.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
  }
  return jsonLd;
}

function writeManifest(posts) {
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  const payload = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    pill: p.pill,
    date: p.date,
    lang: p.lang,
    draft: p.draft,
    countries: p.countries,
    countryLinks: p.countryLinks,
    translations: p.translations,
    faq: p.faq,
    faqHeading: p.faqHeading || undefined,
    ctaHeading: p.ctaHeading || undefined,
    nextHeading: p.nextHeading || undefined,
    relatedHeading: p.relatedHeading || undefined,
    related: Array.isArray(p.related) && p.related.length ? p.related : undefined,
    phraseEmbeds:
      Array.isArray(p.phraseEmbeds) && p.phraseEmbeds.length
        ? p.phraseEmbeds
        : undefined,
    html: p.html,
  }));
  fs.writeFileSync(MANIFEST, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`wrote ${MANIFEST} (${payload.length} posts)`);
}

function hreflangTags(post) {
  const alts = [
    { lang: post.lang || "en", slug: post.slug },
    ...(post.translations || []),
  ];
  const seen = new Set();
  const tags = [];
  for (const t of alts) {
    if (seen.has(t.lang)) continue;
    seen.add(t.lang);
    const href = `${SITE}${postPath({ lang: t.lang, slug: t.slug })}/`;
    tags.push(
      `<link rel="alternate" hreflang="${escapeHtml(t.lang)}" href="${escapeHtml(href)}" />`,
    );
  }
  if (seen.has("en")) {
    const en = alts.find((a) => a.lang === "en") || alts[0];
    tags.push(
      `<link rel="alternate" hreflang="x-default" href="${escapeHtml(`${SITE}${postPath({ lang: en.lang, slug: en.slug })}/`)}" />`,
    );
  }
  return tags.join("\n");
}

function injectIntoShell(
  shellHtml,
  { title, description, canonical, jsonLd, bodyInner, hreflang, draft },
) {
  let html = shellHtml;
  html = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(title)}</title>`,
  );
  if (/name="description"/.test(html)) {
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    );
  } else {
    html = html.replace(
      /<\/head>/i,
      `<meta name="description" content="${escapeHtml(description)}" />\n</head>`,
    );
  }
  if (/rel="canonical"/.test(html)) {
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    );
  } else {
    html = html.replace(
      /<\/head>/i,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />\n</head>`,
    );
  }
  if (hreflang) {
    html = html.replace(/<\/head>/i, `${hreflang}\n</head>`);
  }
  // Drafts: noindex on Preview-safe static HTML (still renderable).
  // Do NOT put drafts into production sitemap logic.
  if (draft) {
    const robots = '<meta name="robots" content="noindex,nofollow" />\n';
    if (!/name="robots"/.test(html)) {
      html = html.replace(/<\/head>/i, `${robots}</head>`);
    }
  }
  const ldTag = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n`;
  html = html.replace(/<\/head>/i, `${ldTag}</head>`);

  const rootInner = `<div id="blog-ssg" data-blog-prerender="true">\n${bodyInner}\n</div>`;
  if (/<div id="root"><\/div>/.test(html)) {
    html = html.replace(
      /<div id="root"><\/div>/,
      `<div id="root">${rootInner}</div>`,
    );
  } else if (/<div id="root">[\s\S]*?<\/div>/.test(html)) {
    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>/,
      `<div id="root">${rootInner}</div>`,
    );
  } else {
    html = html.replace(/<body([^>]*)>/i, `<body$1>\n${rootInner}\n`);
  }
  return html;
}

function tocHtml(post) {
  if (!post.toc?.length) return "";
  const label = post.lang === "es" ? "En esta página" : "On this page";
  const items = post.toc
    .map(
      (t) =>
        `<li style="margin-left:${t.level === 3 ? "1rem" : "0"}"><a href="#${escapeHtml(t.id)}">${escapeHtml(t.text)}</a></li>`,
    )
    .join("\n");
  return `<nav aria-label="${escapeHtml(label)}"><h2>${escapeHtml(label)}</h2><ol>${items}</ol></nav>`;
}

function titleCaseCountry(id) {
  if (!id) return "";
  return String(id)
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getFaqHeading(post) {
  const custom = String(post.faqHeading || "").trim();
  if (custom && !/^faq$/i.test(custom)) return custom;
  const isEs = post.lang === "es";
  const countries = post.countries || [];
  const primary = countries[0] ? titleCaseCountry(countries[0]) : "";
  const pill = String(post.pill || "").toLowerCase();
  if (isEs) {
    if (pill === "scene" && primary) return `Lo que se malentiende en ${primary}`;
    if (pill === "compare") return "Comparar sin copiar — chequeos rápidos";
    if (pill === "method") return "Cómo usar este método — chequeos";
    if (pill === "pronounce") return "Oír antes de decir — chequeos";
    if (pill === "country" && primary) return `Leer el mapa de ${primary} — chequeos`;
    if (pill === "author") return "Sobre esta guía — chequeos";
    return primary
      ? `Lo que preguntan sobre ${primary}`
      : "Chequeos rápidos antes de repetir";
  }
  if (pill === "scene" && primary) {
    return `What tourists get wrong — ${primary} quick checks`;
  }
  if (pill === "compare") return "Compare without copying — quick checks";
  if (pill === "method") return "How to use this method — quick checks";
  if (pill === "pronounce") return "Hearing vs saying — quick checks";
  if (pill === "country" && primary) {
    return `Reading the ${primary} map — quick checks`;
  }
  if (pill === "author") return "About this guide — quick checks";
  if (primary) return `What readers ask about ${primary}`;
  return "What readers ask — quick checks";
}

function getCtaHeading(post) {
  const custom = String(post.ctaHeading || post.nextHeading || "").trim();
  if (custom && !/^(next\s*steps?|cta|siguiente\s*paso)$/i.test(custom)) {
    return custom;
  }
  const isEs = post.lang === "es";
  const countries = post.countries || [];
  if (isEs) {
    if (countries.length) return "Sigue con las guías de país";
    return "Por dónde seguir";
  }
  if (countries.length) {
    const labels = countries.slice(0, 2).map(titleCaseCountry).join(" & ");
    return `Open the ${labels} guide${countries.length > 1 ? "s" : ""}`;
  }
  return "Where to go next";
}

function getRelatedHeading(post) {
  const custom = String(post.relatedHeading || "").trim();
  if (custom && !/^related$/i.test(custom)) return custom;
  return post.lang === "es" ? "Sigue leyendo" : "Keep reading";
}

function countryOverlap(a, b) {
  const set = new Set((a.countries || []).map((c) => String(c).toLowerCase()));
  return (b.countries || []).filter((c) => set.has(String(c).toLowerCase())).length;
}

function relatedSort(a, b, current) {
  const ov = countryOverlap(current, b) - countryOverlap(current, a);
  if (ov !== 0) return ov;
  const pillA = a.pill && current.pill && a.pill === current.pill ? 1 : 0;
  const pillB = b.pill && current.pill && b.pill === current.pill ? 1 : 0;
  if (pillB !== pillA) return pillB - pillA;
  return (
    String(b.date).localeCompare(String(a.date)) || a.slug.localeCompare(b.slug)
  );
}

function getRelatedPosts(post, allPosts, min = 3, max = 5) {
  const lang = post.lang || "en";
  const sameLang = allPosts.filter((p) => (p.lang || "en") === lang);
  const enPool = allPosts.filter((p) => (p.lang || "en") === "en");
  const out = [];
  const seen = new Set([post.slug]);
  const bySlug = new Map(allPosts.map((p) => [p.slug, p]));

  const override = Array.isArray(post.related) ? post.related : [];
  const usedOverride = override.length > 0;
  for (const slug of override) {
    if (!slug || seen.has(slug)) continue;
    const p = bySlug.get(slug);
    if (!p) continue;
    out.push(p);
    seen.add(slug);
    if (out.length >= max) return out.slice(0, max);
  }

  const pick = (pool, need) =>
    pool
      .filter((p) => p.slug !== post.slug && !seen.has(p.slug))
      .sort((a, b) => relatedSort(a, b, post))
      .slice(0, Math.max(0, need));

  // Auto-fill: always fill toward max when no override; with override only pad up to min.
  const target = usedOverride ? Math.max(out.length, min) : max;
  for (const p of pick(sameLang, target - out.length)) {
    out.push(p);
    seen.add(p.slug);
  }
  if (out.length < min && lang !== "en") {
    for (const p of pick(enPool, min - out.length)) {
      out.push(p);
      seen.add(p.slug);
    }
  }
  if (out.length < min) {
    for (const p of pick(allPosts, min - out.length)) {
      out.push(p);
      seen.add(p.slug);
    }
  }
  return out.slice(0, max);
}

function ctaHtml(post, allPosts) {
  const countries = (post.countries || []).slice(0, 2);
  const method = allPosts.find((p) => p.slug === METHOD_SLUG);
  const isEs = post.lang === "es";
  const heading = getCtaHeading(post);
  const countryLinks = countries
    .map(
      (id) =>
        `<li><a href="/country/${escapeHtml(id)}">${escapeHtml(id)}</a></li>`,
    )
    .join("");
  const methodLink = method
    ? `<p><a href="${escapeHtml(postPath(method))}/">${isEs ? "Método: Reconocimiento ≠ permiso" : "Method: Recognition ≠ permission"}</a></p>`
    : "";
  return (
    `<aside aria-label="${escapeHtml(heading)}">` +
    `<h2>${escapeHtml(heading)}</h2>` +
    (countries.length
      ? `<nav aria-label="Countries"><ul>${countryLinks}</ul></nav>`
      : "") +
    `<p><a href="/get-the-book">${isEs ? "Conseguir el libro" : "Get the book"}</a></p>` +
    methodLink +
    `</aside>`
  );
}

function relatedHtml(post, allPosts) {
  const related = getRelatedPosts(post, allPosts);
  if (!related.length) return "";
  const heading = getRelatedHeading(post);
  const items = related
    .map((r) => {
      const href = postPath(r);
      return (
        `<li><a href="${escapeHtml(href)}/"><strong>${escapeHtml(r.title)}</strong></a>` +
        (r.pill ? ` <span>${escapeHtml(r.pill)}</span>` : "") +
        (r.date
          ? ` <time datetime="${escapeHtml(r.date)}">${escapeHtml(r.date)}</time>`
          : "") +
        (r.description
          ? `<br/><span>${escapeHtml(r.description)}</span>`
          : "") +
        `</li>`
      );
    })
    .join("\n");
  return (
    `<section aria-label="${escapeHtml(heading)}">` +
    `<h2>${escapeHtml(heading)}</h2>` +
    `<ul>\n${items}\n</ul>` +
    `</section>`
  );
}

function countryTagsHtml(post) {
  const countries = post.countries || [];
  if (!countries.length) return "";
  const indexBase = post.lang === "es" ? "/es/blog" : "/blog";
  return (
    `<nav aria-label="Country tags"><ul>` +
    countries
      .map(
        (c) =>
          `<li><a href="${indexBase}?country=${encodeURIComponent(c)}">${escapeHtml(c)}</a></li>`,
      )
      .join("") +
    `</ul></nav>`
  );
}

function langSwitchHtml(post) {
  const alts = [
    { lang: post.lang || "en", slug: post.slug, current: true },
    ...(post.translations || []),
  ];
  const seen = new Set();
  const unique = alts.filter((t) => {
    if (seen.has(t.lang)) return false;
    seen.add(t.lang);
    return true;
  });
  if (unique.length < 2) return "";
  const links = unique
    .map((t) => {
      const href = postPath({ lang: t.lang, slug: t.slug });
      if (t.slug === post.slug && t.lang === (post.lang || "en")) {
        return `<strong>${escapeHtml(t.lang)}</strong>`;
      }
      return `<a href="${escapeHtml(href)}/">${escapeHtml(t.lang)}</a>`;
    })
    .join(" · ");
  return `<nav aria-label="Language">${links}</nav>`;
}

function articleBodyHtml(post, allPosts) {
  const draftBanner = post.draft
    ? `<p class="blog-draft-banner" style="background:#fff3cd;border:1px solid #ffc107;padding:.5rem .75rem;border-radius:4px">Draft — Preview only; not Production Publish</p>`
    : "";
  const faqHeading = getFaqHeading(post);
  const faqHtml =
    post.faq.length > 0
      ? `<section aria-label="${escapeHtml(faqHeading)}"><h2>${escapeHtml(faqHeading)}</h2>${post.faq
          .map(
            (f) =>
              `<div><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`,
          )
          .join("\n")}</section>`
      : "";
  return (
    `<article class="blog-post">` +
    draftBanner +
    langSwitchHtml(post) +
    `<p class="pill"><span>${escapeHtml(post.pill)}</span></p>` +
    countryTagsHtml(post) +
    `<h1>${escapeHtml(post.title)}</h1>` +
    `<p><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time></p>` +
    `<p class="lede">${escapeHtml(post.description)}</p>` +
    tocHtml(post) +
    post.html +
    faqHtml +
    ctaHtml(post, allPosts) +
    relatedHtml(post, allPosts) +
    `</article>`
  );
}

function writeHtml(posts) {
  const shellPath = path.join(DIST, "index.html");
  if (!fs.existsSync(shellPath)) {
    throw new Error(`Missing ${shellPath} — run vite build first`);
  }
  const shell = fs.readFileSync(shellPath, "utf8");
  fs.mkdirSync(path.join(DIST, "blog"), { recursive: true });
  fs.mkdirSync(path.join(DIST, "es", "blog"), { recursive: true });

  for (const post of posts) {
    if (!isPublicPost(post)) continue; // Production: no HTML for drafts / future dates
    const rel = postPath(post).replace(/^\//, "");
    const dir = path.join(DIST, ...rel.split("/"));
    fs.mkdirSync(dir, { recursive: true });
    const html = injectIntoShell(shell, {
      title: `${post.title} · HECS Blog`,
      description: post.description,
      canonical: `${SITE}${postPath(post)}/`,
      jsonLd: blogPostingLd(post),
      bodyInner: articleBodyHtml(post, posts),
      hreflang: hreflangTags(post),
      draft: post.draft,
    });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    console.log(`wrote dist/${rel}/index.html`);
  }

  // EN / ES indexes — published posts only in static shell (no draft badges / Preview copy)
  const published = posts.filter((p) => isPublicPost(p));
  writeIndexHtml(shell, published.filter((p) => (p.lang || "en") === "en"), {
    dir: path.join(DIST, "blog"),
    pathPrefix: "/blog",
    canonical: `${SITE}/blog/`,
    lang: "en",
  });
  writeIndexHtml(shell, published.filter((p) => p.lang === "es"), {
    dir: path.join(DIST, "es", "blog"),
    pathPrefix: "/es/blog",
    canonical: `${SITE}/es/blog/`,
    lang: "es",
  });
  console.log(`OK blog html posts=${posts.length}`);
}

function writeIndexHtml(shell, posts, { dir, pathPrefix, canonical, lang }) {
  fs.mkdirSync(dir, { recursive: true });
  const listItems = posts
    .map((p) => {
      const tags = (p.countries || [])
        .map((c) => `<span class="tag">${escapeHtml(c)}</span>`)
        .join(" ");
      return (
        `<li><a href="${pathPrefix}/${escapeHtml(p.slug)}/"><strong>${escapeHtml(p.title)}</strong></a> ` +
        `<span>${escapeHtml(p.pill || "")}</span> ` +
        `<time datetime="${escapeHtml(p.date)}">${escapeHtml(p.date)}</time>` +
        (p.draft ? ` <em>(draft)</em>` : "") +
        (tags ? ` ${tags}` : "") +
        `<br/><span>${escapeHtml(p.description || "")}</span></li>`
      );
    })
    .join("\n");

  const indexBody =
    `<section class="blog-index">` +
    `<h1>HECS Blog</h1>` +
    `<p>${
      lang === "es"
        ? "Ensayos sobre reconocimiento, etiquetas de riesgo y cultura global de la blasfemia."
        : "Essays on recognition, risk labeling, and global profanity culture."
    }</p>` +
    `<ul>\n${listItems}\n</ul>` +
    `</section>`;

  const indexLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "How Every Country Swears — Blog",
    url: canonical,
    inLanguage: lang,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE}${postPath(p)}/`,
    })),
  };

  const indexHtml = injectIntoShell(shell, {
    title: "Blog · How Every Country Swears",
    description:
      lang === "es"
        ? "Ensayos sobre reconocimiento, etiquetas de riesgo y cultura global de la blasfemia."
        : "Essays on recognition, risk labeling, and global profanity culture from How Every Country Swears.",
    canonical,
    jsonLd: indexLd,
    bodyInner: indexBody,
    hreflang: "",
    draft: false, // production blog index is public; posts already draft:false
  });
  fs.writeFileSync(path.join(dir, "index.html"), indexHtml, "utf8");
  console.log(`wrote ${path.relative(ROOT, path.join(dir, "index.html"))}`);
}

const mode = process.argv[2] || "all";
const posts = loadPosts();
if (mode === "manifest" || mode === "all") writeManifest(posts);
if (mode === "html" || mode === "all") {
  if (mode === "all" && !fs.existsSync(path.join(DIST, "index.html"))) {
    console.log("skip html: dist/index.html not present yet");
  } else {
    writeHtml(posts);
  }
}
