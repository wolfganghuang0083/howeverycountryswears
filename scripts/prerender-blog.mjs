#!/usr/bin/env node
/**
 * HECS Blog B1 — MDX → manifest JSON + static HTML (body + BlogPosting JSON-LD).
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
const SITE = "https://howeverycountryswears.com";

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

/** Minimal YAML frontmatter parser for locked v0.2 shape. */
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

  const inline = (t) => {
    t = escapeHtml(t);
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return t;
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
      out.push(`<h${level}>${inline(text)}</h${level}>`);
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
      const countryLinks = Array.isArray(data.countryLinks)
        ? data.countryLinks
        : [];
      posts.push({
        slug,
        title: data.title,
        description,
        pill: data.pill || "",
        date: data.date || "",
        lang: data.lang || "en",
        draft,
        countryLinks,
        faq,
        html,
      });
    } catch (e) {
      errors.push({ file, reason: String(e.message || e) });
    }
  }
  if (errors.length) {
    console.error(JSON.stringify(errors, null, 2));
    throw new Error(`Failed to parse ${errors.length} MDX file(s)`);
  }
  // newest first for index
  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.slug.localeCompare(b.slug));
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
    url: `${SITE}/blog/${post.slug}/`,
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
  // Keep html for CSR render; faq rendered from structured data in React
  const payload = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    pill: p.pill,
    date: p.date,
    lang: p.lang,
    draft: p.draft,
    countryLinks: p.countryLinks,
    faq: p.faq,
    html: p.html,
  }));
  fs.writeFileSync(MANIFEST, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`wrote ${MANIFEST} (${payload.length} posts)`);
}

function injectIntoShell(shellHtml, { title, description, canonical, jsonLd, bodyInner }) {
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
  // Drafts: noindex on Preview-safe static HTML (still renderable)
  const robots =
    '<meta name="robots" content="noindex,nofollow" />\n';
  if (!/name="robots"/.test(html)) {
    html = html.replace(/<\/head>/i, `${robots}</head>`);
  }
  const ldTag = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n`;
  html = html.replace(/<\/head>/i, `${ldTag}</head>`);

  // Put crawlable body inside #root so View Source / non-JS crawlers see content.
  // React will replace #root on hydrate.
  const rootInner =
    `<div id="blog-ssg" data-blog-prerender="true">\n${bodyInner}\n</div>`;
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
    html = html.replace(
      /<body([^>]*)>/i,
      `<body$1>\n${rootInner}\n`,
    );
  }
  return html;
}

function articleBodyHtml(post) {
  const draftBanner = post.draft
    ? `<p class="blog-draft-banner" style="background:#fff3cd;border:1px solid #ffc107;padding:.5rem .75rem;border-radius:4px">Draft — Preview only; not Production Publish</p>`
    : "";
  const faqHtml =
    post.faq.length > 0
      ? `<section aria-label="FAQ"><h2>FAQ</h2>${post.faq
          .map(
            (f) =>
              `<div><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`,
          )
          .join("\n")}</section>`
      : "";
  const links =
    post.countryLinks.length > 0
      ? `<nav aria-label="Related countries"><h2>Related countries</h2><ul>${post.countryLinks
          .map((l) => `<li><a href="${escapeHtml(l)}">${escapeHtml(l)}</a></li>`)
          .join("")}</ul></nav>`
      : "";
  return (
    `<article class="blog-post">` +
    draftBanner +
    `<p class="pill"><span>${escapeHtml(post.pill)}</span></p>` +
    `<h1>${escapeHtml(post.title)}</h1>` +
    `<p><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time></p>` +
    `<p class="lede">${escapeHtml(post.description)}</p>` +
    post.html +
    faqHtml +
    links +
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

  for (const post of posts) {
    const dir = path.join(DIST, "blog", post.slug);
    fs.mkdirSync(dir, { recursive: true });
    const html = injectIntoShell(shell, {
      title: `${post.title} · HECS Blog`,
      description: post.description,
      canonical: `${SITE}/blog/${post.slug}/`,
      jsonLd: blogPostingLd(post),
      bodyInner: articleBodyHtml(post),
    });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    console.log(`wrote dist/blog/${post.slug}/index.html`);
  }

  const listItems = posts
    .map(
      (p) =>
        `<li><a href="/blog/${escapeHtml(p.slug)}/"><strong>${escapeHtml(p.title)}</strong></a> ` +
        `<span>${escapeHtml(p.pill || "")}</span> ` +
        `<time datetime="${escapeHtml(p.date)}">${escapeHtml(p.date)}</time>` +
        (p.draft ? ` <em>(draft)</em>` : "") +
        `<br/><span>${escapeHtml(p.description || "")}</span></li>`,
    )
    .join("\n");

  const indexBody =
    `<section class="blog-index">` +
    `<h1>HECS Blog</h1>` +
    `<p>Essays on recognition, risk labeling, and global profanity culture. Draft posts may appear on Preview.</p>` +
    `<ul>\n${listItems}\n</ul>` +
    `</section>`;

  const indexLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "How Every Country Swears — Blog",
    url: `${SITE}/blog/`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE}/blog/${p.slug}/`,
    })),
  };

  const indexHtml = injectIntoShell(shell, {
    title: "Blog · How Every Country Swears",
    description:
      "Essays on recognition, risk labeling, and global profanity culture from How Every Country Swears.",
    canonical: `${SITE}/blog/`,
    jsonLd: indexLd,
    bodyInner: indexBody,
  });
  fs.writeFileSync(path.join(DIST, "blog", "index.html"), indexHtml, "utf8");
  console.log("wrote dist/blog/index.html");
  console.log(`OK blog html posts=${posts.length}`);
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
