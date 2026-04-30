import Layout from "@/components/Layout";
import { getPartBySlug, regionColors, AMAZON_LINK, isLockedContent } from "@/lib/data";
import { useParams, Link } from "wouter";
import { ArrowRight, BookOpen, Lock, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocale } from "@/contexts/LocaleContext";

export default function RegionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, t, localePath } = useLocale();
  const isZhTw = locale === "zh-tw";

  const part = getPartBySlug(slug || "", locale);
  const { user, isAuthenticated } = useAuth();

  const isAdmin = user?.role === "admin";
  const isBookBuyer = user?.memberTier === "bookBuyer" || isAdmin;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (part) {
      document.title = isZhTw
        ? `${part.title} — 各國髒話 | 全球髒話文化指南`
        : `${part.title} — Swear Words by Region | How Every Country Swears`;
    }
    return () => {
      document.title = isZhTw
        ? '全球髒話文化指南 — 1,000 個片語，100 個國家'
        : 'How Every Country Swears \u2014 1,000 Phrases, 100 Countries';
    };
  }, [slug, part, isZhTw]);

  if (!part || part.countries.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-4xl text-[#1a1a1a] mb-4">
            {isZhTw ? "找不到區域" : "Region Not Found"}
          </h1>
          <p className="text-[#666] mb-6">
            {isZhTw ? "此區域尚無國家資料，或不存在。" : "This region doesn't have any countries yet, or doesn't exist."}
          </p>
          <Link href={localePath("/")} className="text-[#FF1493] font-semibold">
            {t("common.backToHome")}
          </Link>
        </div>
      </Layout>
    );
  }

  const color = regionColors[part.slug] || "#FF1493";
  const isLocked = isLockedContent(part.id);
  const canView = !isLocked || isBookBuyer;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-[#FAFAFA] border-b border-gray-200">
        <div className="container py-3 flex items-center gap-2 text-sm">
          <Link href={localePath("/")} className="text-[#666] hover:text-[#FF1493] no-underline">
            {t("nav.home")}
          </Link>
          <span className="text-[#ccc]">/</span>
          <span className="text-[#1a1a1a] font-semibold">{part.title}</span>
        </div>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: `linear-gradient(135deg, ${color}60, transparent 60%)` }}
        />
        <div className="absolute inset-0 benday-dots pointer-events-none" />
        <div className="container relative py-10 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-12 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-bold text-[#999] uppercase">Part {part.id}</span>
              {isLocked && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFE500] text-[#1a1a1a] border border-[#1a1a1a] flex items-center gap-1">
                  <Lock size={10} />
                  {isZhTw ? "書籍獨家" : "Book Exclusive"}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-[#1a1a1a] mb-3">{part.title}</h1>
            <p className="text-[#666] text-lg">
              {part.countries.length} {isZhTw ? "個國家" : "countries"} &middot; {part.countries.length * 10} {isZhTw ? "個片語" : "phrases"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content: either locked or country grid */}
      {!canView ? (
        <section className="py-16 md:py-24">
          <div className="container max-w-2xl text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FFF8E1] flex items-center justify-center border-3 border-[#FFE500] shadow-[4px_4px_0px_#1a1a1a]">
                <Lock size={40} className="text-[#FF1493]" />
              </div>
              <h2 className="font-display text-3xl text-[#1a1a1a] mb-3">
                {isZhTw ? "獨家內容" : "Exclusive Content"}
              </h2>
              <p className="text-[#666] mb-2">
                Part {part.id} {isZhTw ? "包含" : "contains"} {part.countries.length} {isZhTw ? "個國家，共" : "countries with"} {part.countries.length * 10} {isZhTw ? "個片語。" : "phrases."}
              </p>
              <p className="text-[#888] mb-8 max-w-md mx-auto">
                {isZhTw
                  ? "此區域為書籍持有者專屬。購買書籍即可解鎖全部 100 個國家！"
                  : "This region is exclusive to book owners. Get the book to unlock all 100 countries!"}
              </p>

              {/* Show country flags as a teaser */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {part.countries.map(c => (
                  <div key={c.slug} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-sm font-semibold text-[#999]">{c.name}</span>
                    <Lock size={10} className="text-[#999]" />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!isAuthenticated && (
                  <a
                    href={getLoginUrl()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF1493] text-white rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                  >
                    <LogIn size={18} />
                    {t("nav.signIn")}
                  </a>
                )}
                {isAuthenticated && (
                  <Link
                    href={localePath("/community")}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF1493] text-white rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                  >
                    <BookOpen size={18} />
                    {isZhTw ? "輸入書籍代碼" : "Enter Book Code"}
                  </Link>
                )}
                <a
                  href={AMAZON_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FFE500] text-[#1a1a1a] rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                >
                  <BookOpen size={18} />
                  {isZhTw ? "在 Amazon 購買書籍" : "Get the Book on Amazon"}
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      ) : (
        <section className="py-10 md:py-16">
          <div className="container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {part.countries.map((country, i) => {
                const previewCard = country.cards[0];
                return (
                  <motion.div
                    key={country.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={localePath(`/country/${country.slug}`)}
                      className="block bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline overflow-hidden group"
                    >
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-4xl">{country.flag}</span>
                          <div>
                            <span className="text-xs font-bold text-[#999]">#{country.number}</span>
                            <h3 className="font-bold text-lg text-[#1a1a1a] group-hover:text-[#FF1493] transition-colors leading-tight">
                              {country.name}
                            </h3>
                          </div>
                        </div>

                        {previewCard && (
                          <div className="bg-[#FAFAFA] rounded-lg p-3 mb-3 border border-gray-100">
                            <p className="font-noto font-bold text-[#1a1a1a] text-sm">
                              {previewCard.emoji} "{previewCard.phrase}"
                            </p>
                            <p className="text-xs text-[#666] mt-1">{previewCard.literal}</p>
                          </div>
                        )}

                        <p className="text-xs text-[#666] line-clamp-2 mb-3">{country.culture}</p>

                        <div className="flex items-center gap-1 text-xs font-semibold text-[#FF1493]">
                          {isZhTw ? "查看全部 10 個片語" : "View all 10 phrases"} <ArrowRight size={12} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Book CTA */}
      <section className="py-10 bg-[#1a1a1a]">
        <div className="container text-center">
          <p className="text-white font-display text-2xl md:text-3xl mb-4">
            {isZhTw ? (
              <>想要全部 <span className="text-[#FFE500]">100 個國家</span>？購買書籍！</>
            ) : (
              <>Want all <span className="text-[#FFE500]">100 countries</span>? Get the book!</>
            )}
          </p>
          <a
            href={AMAZON_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-6 py-3 rounded-lg font-bold border-2 border-white shadow-[3px_3px_0px_white] hover:shadow-[1px_1px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
          >
            <BookOpen size={18} />
            {isZhTw ? "在 Amazon 購買書籍" : "Get the Book on Amazon"}
          </a>
        </div>
      </section>
    </Layout>
  );
}
