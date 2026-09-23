import posts from "@/data/blog-posts.json";
import { buildLocalePath, type Locale } from "@/lib/i18n";

export type BlogFaq = { q: string; a: string };
export type BlogTranslation = { lang: string; slug: string };

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
