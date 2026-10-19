import { Link } from "wouter";
import { useMemo } from "react";
import {
  getBlogIndexPath,
  getBlogPost,
  getBlogPostPath,
  getBlogPostsForLocale,
  getMethodPost,
  type BlogPost,
} from "@/lib/blog";
import type { Locale } from "@/lib/i18n";

type Props = {
  countrySlug: string;
  /** Country number — used to rotate the "around the map" picks per page. */
  countryNumber?: number;
  locale: Locale | string;
  /** Cap related posts (country hubs ~3, phrase pages ≤2–3). */
  max?: number;
  /**
   * EN-first module (same pattern as CountryHubRelated).
   * Pass false on zh-tw to hide the whole block.
   */
  enabled?: boolean;
  /** Country pages only: pin own Wave A guide + "around the map" list + method essay. */
  waveA?: boolean;
};

/**
 * Wave A country recognition guides (live on main, draft:false).
 * Own-country guide is pinned first on its country page; other pages get a
 * short "around the map" list + the method essay. Titles come from frontmatter.
 */
export const WAVE_A_GUIDES: { country: string; slug: string; label: string }[] = [
  { country: "united-kingdom", slug: "united-kingdom-swears-recognition-guide-3", label: "United Kingdom" },
  { country: "united-states", slug: "united-states-swears-recognition-guide-5", label: "United States" },
  { country: "australia", slug: "australia-swears-recognition-guide-2", label: "Australia" },
  { country: "germany", slug: "germany-swears-recognition-guide-2", label: "Germany" },
  { country: "netherlands", slug: "netherlands-swears-recognition-guide-4", label: "Netherlands" },
];

function livePost(slug: string): BlogPost | undefined {
  const p = getBlogPost(slug);
  if (!p || p.draft || (p.lang || "en") !== "en") return undefined;
  return p;
}

/**
 * Auto-list published blog posts whose frontmatter countries / countryLinks
 * match the given country slug, plus Wave A recognition guides (EN).
 * Renders null when empty.
 */
export default function SameCountryBlogRelated({
  countrySlug,
  countryNumber = 0,
  locale,
  max = 3,
  enabled = true,
  waveA = false,
}: Props) {
  const isEn = waveA && locale !== "es" && locale !== "zh-tw";

  const { posts, aroundTheMap, method } = useMemo(() => {
    const empty = { posts: [] as BlogPost[], aroundTheMap: [] as { post: BlogPost; label: string }[], method: undefined as BlogPost | undefined };
    if (!enabled || !countrySlug) return empty;
    const slug = countrySlug.trim().toLowerCase();
    if (!slug) return empty;
    const cap = Math.max(1, max);

    const sameCountry = getBlogPostsForLocale(locale, {
      includeDrafts: false,
      country: slug,
    })
      .slice()
      .sort(
        (a, b) =>
          String(b.date).localeCompare(String(a.date)) ||
          a.slug.localeCompare(b.slug),
      );

    // Pin this country's own Wave A guide first (EN only).
    const own = isEn ? WAVE_A_GUIDES.find((g) => g.country === slug) : undefined;
    const ownPost = own ? livePost(own.slug) : undefined;
    const ordered = ownPost
      ? [ownPost, ...sameCountry.filter((p) => p.slug !== ownPost.slug)]
      : sameCountry;
    const shown = ordered.slice(0, cap);

    if (!isEn) return { ...empty, posts: shown };

    const shownSlugs = new Set(shown.map((p) => p.slug));
    const pool = WAVE_A_GUIDES.map((g) => ({ post: livePost(g.slug), label: g.label }))
      .filter((x): x is { post: BlogPost; label: string } => !!x.post)
      .filter((x) => !shownSlugs.has(x.post.slug));
    // Rotate the starting point by country number so pages spread their links.
    const start = pool.length ? Math.abs(countryNumber) % pool.length : 0;
    const rotated = [...pool.slice(start), ...pool.slice(0, start)].slice(0, 3);

    const m = getMethodPost();
    return {
      posts: shown,
      aroundTheMap: rotated,
      method: m && !m.draft && !shownSlugs.has(m.slug) ? m : undefined,
    };
  }, [countrySlug, countryNumber, locale, max, enabled, isEn]);

  if (!enabled || (posts.length === 0 && aroundTheMap.length === 0 && !method)) return null;

  const isEs = locale === "es";
  const heading = isEs ? "También te puede interesar:" : "You may also be interested in:";
  const viewAllLabel = isEs ? "Ver más en el blog →" : "More on the blog →";
  const indexHref = getBlogIndexPath(locale as Locale, posts.length ? countrySlug : null);
  const mapHeading =
    posts.length > 0
      ? "More recognition guides from around the map"
      : "Recognition guides from around the map";

  return (
    <section
      className="py-10 border-t border-gray-200"
      aria-label={posts.length ? heading : mapHeading}
      data-same-country-blog={countrySlug}
    >
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {posts.length > 0 ? (
            <>
              <h3 className="font-display text-2xl md:text-3xl text-[#1a1a1a] mb-6 text-center">
                {heading}
              </h3>
              <div
                className={`grid grid-cols-1 gap-4 mb-6 ${
                  posts.length > 1 ? "sm:grid-cols-2" : ""
                } ${posts.length > 2 ? "lg:grid-cols-3" : ""}`}
              >
                {posts.map((post) => (
                  <Link
                    key={`${post.lang}-${post.slug}`}
                    href={getBlogPostPath(post)}
                    className="block no-underline rounded-xl border-2 border-[#1a1a1a] bg-white shadow-[3px_3px_0px_#1a1a1a] p-4 hover:bg-[#FFF0F5] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
                  >
                    {post.pill ? (
                      <span className="inline-block text-xs font-bold uppercase tracking-wide bg-[#FFE500] border border-[#1a1a1a] rounded-full px-2.5 py-0.5 text-[#1a1a1a] mb-2">
                        {post.pill}
                      </span>
                    ) : null}
                    <span className="block font-bold text-[#1a1a1a] text-base leading-snug group-hover:text-[#FF1493] transition-colors">
                      {post.title}
                    </span>
                    {post.description ? (
                      <p className="text-sm text-[#555] mt-1.5 mb-0 leading-relaxed line-clamp-2">
                        {post.description}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          {aroundTheMap.length > 0 || method ? (
            <div
              className={`rounded-xl border-2 border-[#1a1a1a] bg-[#FAFAFA] shadow-[3px_3px_0px_#1a1a1a] p-4 md:p-5 mb-6 ${
                posts.length ? "" : "max-w-2xl mx-auto"
              }`}
              data-wave-a-related
            >
              <h4 className="font-display text-lg md:text-xl text-[#1a1a1a] m-0 mb-3">
                {mapHeading}
              </h4>
              {aroundTheMap.length > 0 ? (
                <ul className="list-none p-0 m-0 space-y-3">
                  {aroundTheMap.map(({ post, label }) => (
                    <li key={post.slug} className="m-0">
                      <Link
                        href={getBlogPostPath(post)}
                        className="group flex flex-col items-start gap-1 no-underline"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-white border border-[#1a1a1a] rounded-full px-2 py-0.5 text-[#1a1a1a]">
                          {label}
                        </span>
                        <span className="text-sm font-bold text-[#1a1a1a] leading-snug group-hover:text-[#FF1493] transition-colors">
                          {post.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {method ? (
                <p className="text-sm text-[#555] m-0 mt-4 leading-snug">
                  How we read all of these:{" "}
                  <Link
                    href={getBlogPostPath(method)}
                    className="font-bold text-[#FF1493] no-underline hover:underline"
                  >
                    {method.title}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="text-center">
            <Link
              href={indexHref}
              className="inline-flex items-center text-sm font-bold text-[#FF1493] no-underline hover:underline"
            >
              {viewAllLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
