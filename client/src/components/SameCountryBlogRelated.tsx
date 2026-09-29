import { Link } from "wouter";
import { useMemo } from "react";
import {
  getBlogIndexPath,
  getBlogPostPath,
  getBlogPostsForLocale,
} from "@/lib/blog";
import type { Locale } from "@/lib/i18n";

type Props = {
  countrySlug: string;
  locale: Locale | string;
  /** Cap related posts (country hubs ~3, phrase pages ≤2–3). */
  max?: number;
  /**
   * EN-first module (same pattern as CountryHubRelated).
   * Pass false on zh-tw to hide the whole block.
   */
  enabled?: boolean;
};

/**
 * Auto-list published blog posts whose frontmatter countries / countryLinks
 * match the given country slug. Renders null when empty.
 */
export default function SameCountryBlogRelated({
  countrySlug,
  locale,
  max = 3,
  enabled = true,
}: Props) {
  const posts = useMemo(() => {
    if (!enabled || !countrySlug) return [];
    const slug = countrySlug.trim().toLowerCase();
    if (!slug) return [];
    return getBlogPostsForLocale(locale, {
      includeDrafts: false,
      country: slug,
    })
      .slice()
      .sort(
        (a, b) =>
          String(b.date).localeCompare(String(a.date)) ||
          a.slug.localeCompare(b.slug),
      )
      .slice(0, Math.max(1, max));
  }, [countrySlug, locale, max, enabled]);

  if (!enabled || posts.length === 0) return null;

  const isEs = locale === "es";
  const heading = isEs ? "También te puede interesar:" : "You may also be interested in:";
  const viewAllLabel = isEs ? "Ver más en el blog →" : "More on the blog →";
  const indexHref = getBlogIndexPath(locale as Locale, countrySlug);

  return (
    <section
      className="py-10 border-t border-gray-200"
      aria-label={heading}
      data-same-country-blog={countrySlug}
    >
      <div className="container">
        <div className="max-w-4xl mx-auto">
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
