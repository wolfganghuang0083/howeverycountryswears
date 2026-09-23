import Layout from "@/components/Layout";
import { getAllBlogPosts } from "@/lib/blog";
import { Link } from "wouter";
import { PenLine } from "lucide-react";
import { useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export default function BlogPage() {
  const { localePath } = useLocale();
  const posts = getAllBlogPosts({ includeDrafts: true });

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Blog · How Every Country Swears";
  }, []);

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
              <p className="text-[#666] mt-1">
                Recognition, risk labeling, and global profanity culture.
              </p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="bg-[#FAFAFA] rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] p-6 text-center text-[#666]">
              No posts yet. Check back soon.
            </div>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={localePath(`/blog/${post.slug}`)}
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
                    <p className="text-sm text-[#555] leading-relaxed">
                      {post.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
}
