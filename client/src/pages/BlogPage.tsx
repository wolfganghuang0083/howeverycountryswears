import Layout from "@/components/Layout";
import {
  getBlogIndexPath,
  getBlogPostPath,
  getBlogPostsForLocale,
  getPostCountries,
} from "@/lib/blog";
import { Link, useSearch } from "wouter";
import { PenLine, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export default function BlogPage() {
  const { locale, localePath } = useLocale();
  const searchString = useSearch();
  const countryFilter = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return (params.get("country") || "").trim().toLowerCase() || null;
  }, [searchString]);

  const posts = getBlogPostsForLocale(locale, {
    includeDrafts: true,
    country: countryFilter,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const title =
      locale === "es"
        ? "Blog · How Every Country Swears"
        : "Blog · How Every Country Swears";
    document.title = countryFilter
      ? `${title} · ${countryFilter}`
      : title;
  }, [locale, countryFilter]);

  const subtitle =
    locale === "es"
      ? "Reconocimiento, etiquetas de riesgo y cultura global de la blasfemia."
      : "Recognition, risk labeling, and global profanity culture.";

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FFE500]/20">
              <PenLine size={28} className="text-[#FF1493]" />
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-[#1a1a1a]">
                Blog
              </h1>
              <p className="text-[#666] mt-1">{subtitle}</p>
            </div>
          </div>

          {countryFilter ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-[#555]">
                {locale === "es" ? "Filtro de país:" : "Country filter:"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide bg-[#FFF0F5] border-2 border-[#1a1a1a] rounded-full px-3 py-1">
                {countryFilter}
                <Link
                  href={getBlogIndexPath(locale)}
                  className="ml-1 inline-flex text-[#FF1493] no-underline"
                  aria-label={locale === "es" ? "Quitar filtro" : "Clear filter"}
                >
                  <X size={14} />
                </Link>
              </span>
            </div>
          ) : null}

          {posts.length === 0 ? (
            <div className="bg-[#FAFAFA] rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] p-6 text-center text-[#666]">
              {countryFilter
                ? locale === "es"
                  ? "No hay entradas para este país."
                  : "No posts for this country filter."
                : locale === "es"
                  ? "Aún no hay entradas. Vuelve pronto."
                  : "No posts yet. Check back soon."}
            </div>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => {
                const countries = getPostCountries(post);
                const href =
                  post.lang === "es" || post.lang === "en"
                    ? getBlogPostPath(post)
                    : localePath(`/blog/${post.slug}`);
                return (
                  <li key={`${post.lang}-${post.slug}`}>
                    <Link
                      href={href}
                      className="block no-underline bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] p-5 hover:shadow-[0px_0px_0px_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {post.pill ? (
                          <span className="inline-block text-xs font-bold uppercase tracking-wide bg-[#FFE500] border border-[#1a1a1a] rounded-full px-2.5 py-0.5 text-[#1a1a1a]">
                            {post.pill}
                          </span>
                        ) : null}
                        {post.draft ? (
                          <span className="inline-block text-xs font-bold uppercase tracking-wide bg-[#fff3cd] border border-[#ffc107] rounded-full px-2.5 py-0.5 text-[#664d03]">
                            Draft
                          </span>
                        ) : null}
                        {post.date ? (
                          <time
                            dateTime={post.date}
                            className="text-xs text-[#999]"
                          >
                            {post.date}
                          </time>
                        ) : null}
                      </div>
                      <h2 className="font-display text-2xl text-[#1a1a1a] mb-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-[#555] leading-relaxed mb-3">
                        {post.description}
                      </p>
                      {countries.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {countries.map((c) => (
                            <span
                              key={c}
                              className="inline-block text-[10px] font-bold uppercase tracking-wide bg-[#FAFAFA] border border-[#ccc] rounded-full px-2 py-0.5 text-[#444]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
}
