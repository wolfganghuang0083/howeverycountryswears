import Layout from "@/components/Layout";
import { getBlogPost } from "@/lib/blog";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import NotFound from "@/pages/NotFound";

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const post = getBlogPost(slug);
  const { localePath } = useLocale();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post) {
      document.title = `${post.title} · HECS Blog`;
    }
  }, [post]);

  if (!post) {
    return <NotFound />;
  }

  return (
    <Layout>
      <article className="py-10 md:py-16">
        <div className="container max-w-3xl">
          <Link
            href={localePath("/blog")}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#FF1493] no-underline mb-6 hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Blog
          </Link>

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

          <h1 className="font-display text-4xl md:text-5xl text-[#1a1a1a] mb-4 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-[#555] mb-8 leading-relaxed">
            {post.description}
          </p>

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
              [&_td]:border [&_td]:border-[#ccc] [&_td]:p-2"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {post.faq.length > 0 ? (
            <section className="mt-12 pt-8 border-t-2 border-[#1a1a1a]">
              <h2 className="font-display text-2xl text-[#1a1a1a] mb-4">FAQ</h2>
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

          {post.countryLinks.length > 0 ? (
            <nav className="mt-10" aria-label="Related countries">
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">
                Related countries
              </h2>
              <ul className="flex flex-wrap gap-2">
                {post.countryLinks.map((href) => {
                  const label = href.replace(/^\/country\//, "");
                  return (
                    <li key={href}>
                      <Link
                        href={localePath(href)}
                        className="inline-block text-sm font-bold no-underline bg-white border-2 border-[#1a1a1a] rounded-full px-3 py-1 shadow-[2px_2px_0px_#1a1a1a] hover:bg-[#FFF0F5]"
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </div>
      </article>
    </Layout>
  );
}
