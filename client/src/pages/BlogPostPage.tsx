import Layout from "@/components/Layout";
import {
  getBlogIndexPath,
  getBlogPost,
  getBlogPostPath,
  getCtaCountries,
  getCtaHeading,
  getFaqHeading,
  getMethodPost,
  getPostCountries,
  getRelatedHeading,
  getRelatedPosts,
  withHeadingIds,
  type BlogPost,
  type TocItem,
} from "@/lib/blog";
import { Link, useParams } from "wouter";
import { ArrowLeft, BookOpen, Compass, List } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import NotFound from "@/pages/NotFound";
import BlogPhraseEmbeds from "@/components/BlogPhraseEmbeds";
import type { Locale } from "@/lib/i18n";

const SITE = "https://howeverycountryswears.com";

function BlogToc({ toc, locale }: { toc: TocItem[]; locale: string }) {
  if (toc.length === 0) return null;
  const label = locale === "es" ? "En esta página" : "On this page";
  return (
    <nav
      aria-label={label}
      className="mb-8 rounded-xl border-2 border-[#1a1a1a] bg-[#FAFAFA] shadow-[3px_3px_0px_#1a1a1a] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <List size={18} className="text-[#FF1493]" />
        <h2 className="font-display text-lg text-[#1a1a1a] m-0">{label}</h2>
      </div>
      <ol className="list-none m-0 p-0 space-y-1.5">
        {toc.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? "pl-4" : ""}
          >
            <a
              href={`#${item.id}`}
              className="text-sm text-[#FF1493] font-medium underline-offset-2 hover:underline"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function BlogCta({ post, localePath }: { post: BlogPost; localePath: (p: string) => string }) {
  const countries = getCtaCountries(post, 2);
  const method = getMethodPost();
  const isEs = post.lang === "es";
  const heading = getCtaHeading(post);
  return (
    <aside
      aria-label={heading}
      className="mt-12 rounded-xl border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4"
    >
      <h2 className="font-display text-xl text-[#1a1a1a] m-0">{heading}</h2>
      {countries.length > 0 ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#666] mb-2 flex items-center gap-1">
            <Compass size={14} />{" "}
            {isEs ? "Guías de país" : "Country guides"}
          </p>
          <ul className="flex flex-wrap gap-2 m-0 p-0 list-none">
            {countries.map((id) => (
              <li key={id}>
                <Link
                  href={localePath(`/country/${id}`)}
                  className="inline-block text-sm font-bold no-underline bg-[#FFE500] border-2 border-[#1a1a1a] rounded-full px-3 py-1 shadow-[2px_2px_0px_#1a1a1a] hover:bg-[#FFF0F5]"
                >
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          href={localePath("/get-the-book")}
          className="inline-flex items-center gap-2 text-sm font-bold no-underline bg-[#FF1493] text-white border-2 border-[#1a1a1a] rounded-full px-4 py-2 shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1a1a1a]"
        >
          <BookOpen size={16} />
          {isEs ? "Conseguir el libro" : "Get the book"}
        </Link>
        {method ? (
          <Link
            href={getBlogPostPath(method)}
            className="inline-flex items-center gap-2 text-sm font-bold no-underline bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] rounded-full px-4 py-2 shadow-[2px_2px_0px_#1a1a1a] hover:bg-[#FAFAFA]"
          >
            {isEs ? "Método: Reconocimiento ≠ permiso" : "Method: Recognition ≠ permission"}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function BlogRelated({ post }: { post: BlogPost }) {
  const related = useMemo(() => getRelatedPosts(post), [post]);
  if (related.length === 0) return null;
  const heading = getRelatedHeading(post);
  return (
    <section
      aria-label={heading}
      className="mt-12 pt-8 border-t-2 border-[#1a1a1a]"
    >
      <h2 className="font-display text-2xl text-[#1a1a1a] mb-4">{heading}</h2>
      <ul className="m-0 p-0 list-none space-y-3">
        {related.map((r) => (
          <li key={r.slug}>
            <Link
              href={getBlogPostPath(r)}
              className="block no-underline rounded-xl border-2 border-[#1a1a1a] bg-[#FAFAFA] shadow-[2px_2px_0px_#1a1a1a] p-4 hover:bg-[#FFF0F5]"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {r.pill ? (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-[#FFE500] border border-[#1a1a1a] rounded-full px-2 py-0.5">
                    {r.pill}
                  </span>
                ) : null}
                {r.date ? (
                  <time dateTime={r.date} className="text-xs text-[#999]">
                    {r.date}
                  </time>
                ) : null}
              </div>
              <span className="font-bold text-[#1a1a1a] text-base leading-snug">
                {r.title}
              </span>
              {r.description ? (
                <p className="text-sm text-[#555] mt-1 mb-0 line-clamp-2">
                  {r.description}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LanguageSwitch({ post }: { post: BlogPost }) {
  if (!post.translations?.length) return null;
  const items: { lang: string; slug: string; current?: boolean }[] = [
    { lang: post.lang || "en", slug: post.slug, current: true },
    ...post.translations,
  ];
  // de-dupe by lang
  const seen = new Set<string>();
  const unique = items.filter((i) => {
    if (seen.has(i.lang)) return false;
    seen.add(i.lang);
    return true;
  });
  if (unique.length < 2) return null;
  return (
    <nav aria-label="Language" className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-bold uppercase tracking-wide text-[#666]">
        Lang
      </span>
      {unique.map((t) => {
        const href = getBlogPostPath({ lang: t.lang, slug: t.slug });
        const isCurrent = t.slug === post.slug && t.lang === (post.lang || "en");
        return isCurrent ? (
          <span
            key={`${t.lang}-${t.slug}`}
            className="inline-block text-xs font-bold uppercase tracking-wide bg-[#1a1a1a] text-white rounded-full px-2.5 py-0.5"
          >
            {t.lang}
          </span>
        ) : (
          <Link
            key={`${t.lang}-${t.slug}`}
            href={href}
            className="inline-block text-xs font-bold uppercase tracking-wide no-underline bg-white border border-[#1a1a1a] rounded-full px-2.5 py-0.5 text-[#1a1a1a] hover:bg-[#FFF0F5]"
          >
            {t.lang}
          </Link>
        );
      })}
    </nav>
  );
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const post = getBlogPost(slug);
  const { locale, localePath } = useLocale();

  const { html, toc } = useMemo(
    () => (post ? withHeadingIds(post.html) : { html: "", toc: [] as TocItem[] }),
    [post],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!post) return;
    document.title = `${post.title} · HECS Blog`;

    // hreflang + canonical for SEO (client-side; prerender also emits these)
    const head = document.head;
    head
      .querySelectorAll('link[data-blog-hreflang], link[data-blog-canonical]')
      .forEach((el) => el.remove());

    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = `${SITE}${getBlogPostPath(post)}/`;
    canonical.setAttribute("data-blog-canonical", "1");
    head.appendChild(canonical);

    const alts: { lang: string; slug: string }[] = [
      { lang: post.lang || "en", slug: post.slug },
      ...(post.translations || []),
    ];
    const seen = new Set<string>();
    for (const t of alts) {
      if (seen.has(t.lang)) continue;
      seen.add(t.lang);
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = t.lang === "en" ? "en" : t.lang;
      link.href = `${SITE}${getBlogPostPath({ lang: t.lang, slug: t.slug })}/`;
      link.setAttribute("data-blog-hreflang", "1");
      head.appendChild(link);
    }
    if (seen.has("en")) {
      const xd = document.createElement("link");
      xd.rel = "alternate";
      xd.hreflang = "x-default";
      const en = alts.find((a) => a.lang === "en") || alts[0];
      xd.href = `${SITE}${getBlogPostPath({ lang: en.lang, slug: en.slug })}/`;
      xd.setAttribute("data-blog-hreflang", "1");
      head.appendChild(xd);
    }

    return () => {
      head
        .querySelectorAll('link[data-blog-hreflang], link[data-blog-canonical]')
        .forEach((el) => el.remove());
    };
  }, [post]);

  if (!post) {
    return <NotFound />;
  }

  const countries = getPostCountries(post);
  const backHref = getBlogIndexPath(locale as Locale);
  const faqHeading = getFaqHeading(post);

  return (
    <Layout>
      <article className="py-10 md:py-16">
        <div className="container max-w-3xl">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#FF1493] no-underline mb-6 hover:underline"
          >
            <ArrowLeft size={16} />
            {post.lang === "es" ? "Volver al blog" : "Back to Blog"}
          </Link>

          <LanguageSwitch post={post} />

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.pill ? (
              <span className="inline-block text-xs font-bold uppercase tracking-wide bg-[#FFE500] border border-[#1a1a1a] rounded-full px-2.5 py-0.5">
                {post.pill}
              </span>
            ) : null}
            {post.draft ? (
              <span className="inline-block text-xs font-bold uppercase tracking-wide bg-[#fff3cd] border border-[#ffc107] rounded-full px-2.5 py-0.5 text-[#664d03]">
                Draft — Preview only
              </span>
            ) : null}
            {post.date ? (
              <time dateTime={post.date} className="text-sm text-[#999]">
                {post.date}
              </time>
            ) : null}
          </div>

          {countries.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4" aria-label="Countries">
              {countries.map((c) => (
                <Link
                  key={c}
                  href={getBlogIndexPath(locale as Locale, c)}
                  className="inline-block text-xs font-bold uppercase tracking-wide no-underline bg-[#FFF0F5] border-2 border-[#1a1a1a] rounded-full px-2.5 py-0.5 text-[#1a1a1a] shadow-[1px_1px_0px_#1a1a1a] hover:bg-[#FFE500]"
                >
                  {c}
                </Link>
              ))}
            </div>
          ) : null}

          <h1 className="font-display text-4xl md:text-5xl text-[#1a1a1a] mb-4 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-[#555] mb-6 leading-relaxed">
            {post.description}
          </p>

          <BlogToc toc={toc} locale={post.lang || locale} />

          <div
            className="blog-prose prose-hecs space-y-4 text-[#333] leading-relaxed
              [&_h1]:font-display [&_h1]:text-3xl [&_h1]:text-[#1a1a1a] [&_h1]:mt-8
              [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-[#1a1a1a] [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:font-bold [&_h3]:text-xl [&_h3]:text-[#1a1a1a] [&_h3]:mt-6
              [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
              [&_li]:mb-1 [&_a]:text-[#FF1493] [&_a]:font-medium [&_a]:underline
              [&_strong]:text-[#1a1a1a] [&_code]:bg-[#F5F5F5] [&_code]:px-1 [&_code]:rounded [&_code]:text-sm
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
              [&_th]:border [&_th]:border-[#ccc] [&_th]:bg-[#FAFAFA] [&_th]:p-2 [&_th]:text-left
              [&_td]:border [&_td]:border-[#ccc] [&_td]:p-2
              [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <BlogPhraseEmbeds embeds={post.phraseEmbeds} lang={post.lang} />

          {post.faq.length > 0 ? (
            <section className="mt-12 pt-8 border-t-2 border-[#1a1a1a]">
              <h2 className="font-display text-2xl text-[#1a1a1a] mb-4">
                {faqHeading}
              </h2>
              <div className="space-y-4">
                {post.faq.map((f) => (
                  <div
                    key={f.q}
                    className="bg-[#FAFAFA] rounded-xl border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] p-4"
                  >
                    <h3 className="font-bold text-[#1a1a1a] mb-2">{f.q}</h3>
                    <p className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap">
                      {f.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <BlogCta post={post} localePath={localePath} />
          <BlogRelated post={post} />
        </div>
      </article>
    </Layout>
  );
}
