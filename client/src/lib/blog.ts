import posts from "@/data/blog-posts.json";
import { buildLocalePath, type Locale } from "@/lib/i18n";

export type BlogFaq = { q: string; a: string };
export type BlogTranslation = { lang: string; slug: string };

/** Flat phrase embed after normalize (one card each). Cap ≤3. */
export type BlogPhraseEmbed = { country: string; number: number };

/** Raw frontmatter shapes before normalize. */
export type BlogPhraseEmbedRaw =
  | { country: string; numbers: number[] }
  | { country: string; number: number };

export const MAX_BLOG_PHRASE_EMBEDS = 3;

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  pill: string;
  date: string;
  lang: string;
  draft: boolean;
  countries: string[];
  countryLinks: string[];
  translations: BlogTranslation[];
  faq: BlogFaq[];
  /** Optional visible FAQ section title (never bare "FAQ"). */
  faqHeading?: string;
  /** Optional CTA / next-block title (never bare "Next Steps"). */
  ctaHeading?: string;
  nextHeading?: string;
  /** Optional related-reading section title. */
  relatedHeading?: string;
  /** Optional exact-order related slug override (clamped 3–5). */
  related?: string[];
  /** Frontmatter-driven PhraseCard embeds (≤3), rendered after body. */
  phraseEmbeds: BlogPhraseEmbed[];
  html: string;
};

export type TocItem = { id: string; text: string; level: 2 | 3 };

const METHOD_SLUG = "recognition-not-permission-study-profanity";

function deriveCountries(countryLinks: string[], countries?: string[]): string[] {
  if (Array.isArray(countries) && countries.length > 0) {
    return countries.map((c) => String(c).replace(/^\/country\//, "").trim()).filter(Boolean);
  }
  return (countryLinks || [])
    .map((href) => String(href).replace(/^\/country\//, "").trim())
    .filter(Boolean);
}

function deriveCountryLinks(countries: string[], countryLinks?: string[]): string[] {
  if (Array.isArray(countryLinks) && countryLinks.length > 0) {
    return countryLinks;
  }
  return countries.map((id) => `/country/${id}`);
}

function asStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}


/** Normalize phraseEmbeds: accept [{country, numbers}] or [{country, number}]; cap ≤3. */
export function normalizePhraseEmbeds(raw: unknown): BlogPhraseEmbed[] {
  if (!Array.isArray(raw)) return [];
  const out: BlogPhraseEmbed[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const country = String(obj.country || "")
      .replace(/^\/country\//, "")
      .trim();
    if (!country) continue;
    if (Array.isArray(obj.numbers)) {
      for (const n of obj.numbers) {
        const num = Number(n);
        if (!Number.isFinite(num) || num < 1) continue;
        out.push({ country, number: Math.floor(num) });
        if (out.length >= MAX_BLOG_PHRASE_EMBEDS) return out;
      }
    } else if (obj.number != null && obj.number !== "") {
      const num = Number(obj.number);
      if (!Number.isFinite(num) || num < 1) continue;
      out.push({ country, number: Math.floor(num) });
      if (out.length >= MAX_BLOG_PHRASE_EMBEDS) return out;
    }
  }
  return out.slice(0, MAX_BLOG_PHRASE_EMBEDS);
}

function normalizePost(raw: Record<string, unknown>): BlogPost {
  const countryLinks = Array.isArray(raw.countryLinks)
    ? (raw.countryLinks as string[])
    : [];
  const countries = deriveCountries(
    countryLinks,
    Array.isArray(raw.countries) ? (raw.countries as string[]) : undefined,
  );
  const links = deriveCountryLinks(countries, countryLinks);
  const translations = Array.isArray(raw.translations)
    ? (raw.translations as BlogTranslation[]).filter((t) => t?.lang && t?.slug)
    : [];
  const faqHeading = raw.faqHeading != null ? String(raw.faqHeading).trim() : "";
  const ctaHeading = raw.ctaHeading != null ? String(raw.ctaHeading).trim() : "";
  const nextHeading = raw.nextHeading != null ? String(raw.nextHeading).trim() : "";
  const relatedHeading =
    raw.relatedHeading != null ? String(raw.relatedHeading).trim() : "";
  return {
    slug: String(raw.slug || ""),
    title: String(raw.title || ""),
    description: String(raw.description || ""),
    pill: String(raw.pill || ""),
    date: String(raw.date || ""),
    lang: String(raw.lang || "en"),
    draft: Boolean(raw.draft),
    countries,
    countryLinks: links,
    translations,
    faq: Array.isArray(raw.faq) ? (raw.faq as BlogFaq[]) : [],
    faqHeading: faqHeading || undefined,
    ctaHeading: ctaHeading || undefined,
    nextHeading: nextHeading || undefined,
    relatedHeading: relatedHeading || undefined,
    related: asStringList(raw.related),
    phraseEmbeds: normalizePhraseEmbeds(raw.phraseEmbeds),
    html: String(raw.html || ""),
  };
}

const allPosts = (posts as Record<string, unknown>[]).map(normalizePost);

/** Stable slug ids from heading text (shared with prerender). */
export function slugifyHeading(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "section";
}

/** Strip tags for TOC label text. */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

/** Ensure h2/h3 in HTML have ids; return { html, toc }. */
export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const used = new Map<string, number>();
  const toc: TocItem[] = [];
  const nextHtml = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (_m, levelStr, attrs = "", inner) => {
    const level = Number(levelStr) as 2 | 3;
    const text = stripTags(inner);
    let id = slugifyHeading(text);
    const n = used.get(id) || 0;
    used.set(id, n + 1);
    if (n > 0) id = `${id}-${n + 1}`;
    toc.push({ id, text, level });
    if (/\sid\s*=/.test(attrs)) {
      return `<h${level}${attrs}>${inner}</h${level}>`;
    }
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
  return { html: nextHtml, toc };
}

export function extractToc(html: string): TocItem[] {
  return withHeadingIds(html).toc;
}

/** Preview may render drafts; production sitemap should exclude them. */
export function getAllBlogPosts(opts?: { includeDrafts?: boolean }): BlogPost[] {
  const includeDrafts = opts?.includeDrafts ?? true;
  return allPosts.filter((p) => includeDrafts || !p.draft);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function getPublishedBlogPosts(): BlogPost[] {
  return getAllBlogPosts({ includeDrafts: false });
}

/** Locale for listing: es shows es posts; other locales show en posts. */
export function getBlogPostsForLocale(
  locale: string,
  opts?: { includeDrafts?: boolean; country?: string | null },
): BlogPost[] {
  const lang = locale === "es" ? "es" : "en";
  let list = getAllBlogPosts(opts).filter((p) => (p.lang || "en") === lang);
  const country = opts?.country?.trim().toLowerCase();
  if (country) {
    list = list.filter((p) =>
      deriveCountries(p.countryLinks, p.countries).some((c) => c.toLowerCase() === country),
    );
  }
  return list;
}

/** Canonical path for a post by its content language (independent of UI chrome). */
export function getBlogPostPath(post: BlogPost | { lang?: string; slug: string }): string {
  const lang = (post.lang || "en") as Locale;
  if (lang === "es") return `/es/blog/${post.slug}`;
  if (lang === "en" || !lang) return `/blog/${post.slug}`;
  return buildLocalePath(`/blog/${post.slug}`, lang);
}

export function getBlogIndexPath(locale: Locale, country?: string | null): string {
  const base = locale === "es" ? "/es/blog" : buildLocalePath("/blog", locale);
  if (country) return `${base}?country=${encodeURIComponent(country)}`;
  return base;
}

export function getMethodPost(): BlogPost | undefined {
  return getBlogPost(METHOD_SLUG);
}

export function getPostCountries(post: BlogPost): string[] {
  return deriveCountries(post.countryLinks, post.countries);
}

export function getCtaCountries(post: BlogPost, max = 2): string[] {
  return getPostCountries(post).slice(0, max);
}

function countryOverlap(a: BlogPost, b: BlogPost): number {
  const set = new Set(getPostCountries(a).map((c) => c.toLowerCase()));
  return getPostCountries(b).filter((c) => set.has(c.toLowerCase())).length;
}

function relatedSort(a: BlogPost, b: BlogPost, current: BlogPost): number {
  const ov = countryOverlap(current, b) - countryOverlap(current, a);
  if (ov !== 0) return ov;
  const pillA = a.pill && current.pill && a.pill === current.pill ? 1 : 0;
  const pillB = b.pill && current.pill && b.pill === current.pill ? 1 : 0;
  if (pillB !== pillA) return pillB - pillA;
  return (
    String(b.date).localeCompare(String(a.date)) || a.slug.localeCompare(b.slug)
  );
}

function pickAutoRelated(
  current: BlogPost,
  pool: BlogPost[],
  need: number,
  exclude: Set<string>,
): BlogPost[] {
  const candidates = pool
    .filter((p) => p.slug !== current.slug && !exclude.has(p.slug))
    .sort((a, b) => relatedSort(a, b, current));
  return candidates.slice(0, Math.max(0, need));
}

/**
 * Related reading: 3–5 posts.
 * Override `related: [slug,…]` wins (exact order), then pad/clamp to 3–5.
 * Else: same-lang preferred → country overlap → same pill → newest date; fall back to EN.
 */
export function getRelatedPosts(
  post: BlogPost,
  opts?: { min?: number; max?: number; includeDrafts?: boolean },
): BlogPost[] {
  const min = opts?.min ?? 3;
  const max = opts?.max ?? 5;
  const all = getAllBlogPosts({ includeDrafts: opts?.includeDrafts ?? true });
  const lang = post.lang || "en";
  const sameLang = all.filter((p) => (p.lang || "en") === lang);
  const enPool = all.filter((p) => (p.lang || "en") === "en");

  const out: BlogPost[] = [];
  const seen = new Set<string>([post.slug]);

  const override = (post.related || []).map((s) => String(s).trim()).filter(Boolean);
  const usedOverride = override.length > 0;
  if (usedOverride) {
    for (const slug of override) {
      if (seen.has(slug)) continue;
      const p = getBlogPost(slug);
      if (!p) continue;
      out.push(p);
      seen.add(slug);
      if (out.length >= max) return out.slice(0, max);
    }
  }

  // Auto-fill: always fill toward max when no override; with override only pad up to min.
  const target = usedOverride ? Math.max(out.length, min) : max;
  if (out.length < target) {
    for (const p of pickAutoRelated(post, sameLang, target - out.length, seen)) {
      out.push(p);
      seen.add(p.slug);
    }
  }
  if (out.length < min && lang !== "en") {
    for (const p of pickAutoRelated(post, enPool, min - out.length, seen)) {
      out.push(p);
      seen.add(p.slug);
    }
  }
  if (out.length < min) {
    for (const p of pickAutoRelated(post, all, min - out.length, seen)) {
      out.push(p);
      seen.add(p.slug);
    }
  }

  return out.slice(0, max);
}

function titleCaseCountry(id: string): string {
  if (!id) return "";
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Visible FAQ heading — never bare "FAQ". */
export function getFaqHeading(post: BlogPost): string {
  const custom = (post.faqHeading || "").trim();
  if (custom && !/^faq$/i.test(custom)) return custom;
  const isEs = post.lang === "es";
  const countries = getPostCountries(post);
  const primary = countries[0] ? titleCaseCountry(countries[0]) : "";
  const pill = (post.pill || "").toLowerCase();

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

/** Visible CTA / next-block heading — never bare "Next Steps" / "CTA". */
export function getCtaHeading(post: BlogPost): string {
  const custom = (post.ctaHeading || post.nextHeading || "").trim();
  if (
    custom &&
    !/^(next\s*steps?|cta|siguiente\s*paso)$/i.test(custom)
  ) {
    return custom;
  }
  const isEs = post.lang === "es";
  const countries = getPostCountries(post);
  if (isEs) {
    if (countries.length) return "Sigue con las guías de país";
    return "Por dónde seguir";
  }
  if (countries.length) {
    const labels = countries
      .slice(0, 2)
      .map(titleCaseCountry)
      .join(" & ");
    return `Open the ${labels} guide${countries.length > 1 ? "s" : ""}`;
  }
  return "Where to go next";
}

/** Visible related-reading heading — never bare "Related". */
export function getRelatedHeading(post: BlogPost): string {
  const custom = (post.relatedHeading || "").trim();
  if (custom && !/^related$/i.test(custom)) return custom;
  return post.lang === "es" ? "Sigue leyendo" : "Keep reading";
}
