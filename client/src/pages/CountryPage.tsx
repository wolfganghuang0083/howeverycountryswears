import Layout from "@/components/Layout";
import PhraseCard from "@/components/PhraseCard";
import {
  getCountryBySlug,
  getAdjacentCountries,
  getToneColor,
  getToneLabel,
  AMAZON_LINK,
  regionColors,
  isLockedContent,
} from "@/lib/data";
import { useParams, Link } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, AlertTriangle, MapPin, Lock, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import React, { useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocale } from "@/contexts/LocaleContext";

export default function CountryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, t, localePath } = useLocale();
  const isZhTw = locale === "zh-tw";

  const country = getCountryBySlug(slug || "", locale);
  const { prev, next } = getAdjacentCountries(slug || "", locale);
  const { user, isAuthenticated } = useAuth();

  const isAdmin = user?.role === "admin";
  const isBookBuyer = user?.memberTier === "bookBuyer" || isAdmin;
  const isLocked = country ? isLockedContent(country.part_id) : false;
  const canViewContent = !isLocked || isBookBuyer;

  // Fetch ratings for this country's cards
  const cardNumbers = useMemo(() => country?.cards.map(c => c.number) || [], [country]);
  const { data: ratingsData } = trpc.rating.getForCountry.useQuery(
    { countrySlug: slug || "", cardNumbers },
    { enabled: !!slug && !!country && canViewContent }
  );
  const { data: userRatingsData } = trpc.rating.myRatings.useQuery(
    { countrySlug: slug || "" },
    { enabled: !!slug && !!country && isAuthenticated && canViewContent }
  );

  // Track country visit
  const visitMutation = trpc.tracking.visitCountry.useMutation();
  useEffect(() => {
    if (country && isAuthenticated) {
      visitMutation.mutate({ countrySlug: country.slug });
    }
  }, [slug, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (country) {
      document.title = isZhTw
        ? `${country.name} 髒話 — 10 個片語含發音 | 全球髒話文化指南`
        : `${country.name} Swear Words — 10 Phrases with Pronunciation | How Every Country Swears`;
    }
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-[#FF1493]', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-4', 'ring-[#FF1493]', 'ring-offset-2'), 3000);
        }
      }, 500);
    } else {
      window.scrollTo(0, 0);
    }
    return () => {
      document.title = isZhTw
        ? '全球髒話文化指南 — 1,000 個片語，100 個國家'
        : 'How Every Country Swears \u2014 1,000 Phrases, 100 Countries';
    };
  }, [slug, country, isZhTw]);

  if (!country) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-4xl text-[#1a1a1a] mb-4">
            {isZhTw ? "找不到國家" : "Country Not Found"}
          </h1>
          <Link href={localePath("/")} className="text-[#FF1493] font-semibold">
            {isZhTw ? "回到首頁" : "Back to Home"}
          </Link>
        </div>
      </Layout>
    );
  }

  const toneColor = getToneColor(country.tone_dependence);
  const toneLabel = getToneLabel(country.tone_dependence);
  const regionColor = regionColors[country.region_slug] || "#FF1493";

  // If content is locked (Part 8-11) and user is not bookBuyer
  if (!canViewContent) {
    return (
      <Layout>
        {/* Breadcrumb */}
        <div className="bg-[#FAFAFA] border-b border-gray-200">
          <div className="container py-3 flex items-center gap-2 text-sm">
            <Link href={localePath("/")} className="text-[#666] hover:text-[#FF1493] no-underline">
              {isZhTw ? "首頁" : "Home"}
            </Link>
            <span className="text-[#ccc]">/</span>
            <Link href={localePath(`/region/${country.region_slug}`)} className="text-[#666] hover:text-[#FF1493] no-underline">
              {country.region}
            </Link>
            <span className="text-[#ccc]">/</span>
            <span className="text-[#1a1a1a] font-semibold">{country.name}</span>
          </div>
        </div>

        {/* Locked Content */}
        <section className="py-20 md:py-32">
          <div className="container max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#FFF8E1] flex items-center justify-center border-3 border-[#FFE500] shadow-[4px_4px_0px_#1a1a1a]">
                <Lock size={48} className="text-[#FF1493]" />
              </div>
              <span className="text-6xl mb-4 block">{country.flag}</span>
              <h1 className="font-display text-4xl md:text-5xl text-[#1a1a1a] mb-3">
                {country.name}
              </h1>
              <p className="text-lg text-[#666] mb-2">
                Part {country.part_id} — {isZhTw ? "獨家內容" : "Exclusive Content"}
              </p>
              <p className="text-[#888] mb-8 max-w-md mx-auto">
                {isZhTw
                  ? "此國家屬於我們的獨家收藏（Part 8-11）。購買書籍即可解鎖全部 100 個國家的完整發音和文化指南！"
                  : "This country is part of our exclusive collection (Part 8-11). Get the book to unlock all 100 countries with full pronunciation and cultural guides!"}
              </p>

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
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-[#FAFAFA] border-b border-gray-200">
        <div className="container py-3 flex items-center gap-2 text-sm">
          <Link href={localePath("/")} className="text-[#666] hover:text-[#FF1493] no-underline">
            {isZhTw ? "首頁" : "Home"}
          </Link>
          <span className="text-[#ccc]">/</span>
          <Link href={localePath(`/region/${country.region_slug}`)} className="text-[#666] hover:text-[#FF1493] no-underline">
            {country.region}
          </Link>
          <span className="text-[#ccc]">/</span>
          <span className="text-[#1a1a1a] font-semibold">{country.name}</span>
        </div>
      </div>

      {/* Country Header */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: `linear-gradient(135deg, ${regionColor}40, transparent 60%)` }}
        />
        <div className="absolute inset-0 benday-dots pointer-events-none" />
        <div className="container relative py-10 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-start gap-4 md:gap-6 mb-6">
              <span className="text-6xl md:text-8xl leading-none">{country.flag}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#999] uppercase">#{country.number}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: regionColor }}
                  >
                    {country.region}
                  </span>
                  {isLocked && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFE500] text-[#1a1a1a] border border-[#1a1a1a]">
                      {isZhTw ? "書籍獨家" : "Book Exclusive"}
                    </span>
                  )}
                </div>
                <h1 className="font-display text-4xl md:text-6xl text-[#1a1a1a] leading-none">
                  {country.name}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                <span className="text-xs font-bold text-[#999] uppercase">
                  {isZhTw ? "模式" : "Pattern"}
                </span>
                <span className="text-sm font-semibold text-[#1a1a1a]">{country.dominant_pattern}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                <span className="text-xs font-bold text-[#999] uppercase">
                  {isZhTw ? "語調依賴度" : "Tone Dependence"}
                </span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: toneColor }} />
                <span className="text-sm font-semibold text-[#1a1a1a]">{toneLabel}</span>
              </div>
            </div>

            <div className="max-w-3xl bg-white p-5 rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#999] mb-2">
                {isZhTw ? "罵人文化" : "Swearing Culture"}
              </h3>
              <p className="text-[#333] leading-relaxed">{country.culture}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Phrase Cards */}
      <section className="py-10 md:py-16">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-8">
            {isZhTw ? (
              <>來自 <span style={{ color: regionColor }}>{country.name}</span> 的 10 個片語</>
            ) : (
              <>10 Phrases from <span style={{ color: regionColor }}>{country.name}</span></>
            )}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {country.cards.map((card, i) => {
              const cardRating = ratingsData?.[card.number];
              const userRating = userRatingsData?.[card.number];
              return (
                <React.Fragment key={card.number}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PhraseCard
                      card={card}
                      country={country}
                      isAuthenticated={isAuthenticated}
                      memberTier={user?.memberTier}
                      userRole={user?.role}
                      avgRating={cardRating?.avg}
                      totalRatings={cardRating?.total}
                      userRating={userRating}
                    />
                  </motion.div>
                  {/* Contextual CTA after the 5th card */}
                  {i === 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="lg:col-span-2 bg-gradient-to-r from-[#FF1493]/10 to-[#FFE500]/10 rounded-xl border-2 border-dashed border-[#FF1493]/30 p-6 text-center"
                    >
                      <p className="text-[#666] mb-2 text-sm">
                        {isZhTw
                          ? `正在探索${country.name}的髒話？書中還有 99 個國家等你發掘。`
                          : `Enjoying ${country.name}'s profanity? There are 99 more countries in the book.`}
                      </p>
                      <a
                        href={AMAZON_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#FF1493] font-bold text-sm hover:underline no-underline"
                      >
                        <BookOpen size={14} />
                        {isZhTw ? "解鎖全部 1,000 個片語 →" : "Unlock all 1,000 phrases →"}
                      </a>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* Friendly Fire Warning */}
      {country.friendly_fire_warning && (
        <section className="py-8">
          <div className="container">
            <div className="max-w-3xl mx-auto bg-[#FFF8E1] border-2 border-[#F59E0B] rounded-xl p-6 shadow-[3px_3px_0px_#F59E0B40]">
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-[#1a1a1a] mb-2">
                    {isZhTw ? "友軍傷害警告" : "Friendly Fire Warning"}
                  </h3>
                  <p className="text-[#555] text-sm leading-relaxed">{country.friendly_fire_warning}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cultural Notes */}
      {country.cultural_notes.length > 0 && (
        <section className="py-8">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h3 className="font-display text-2xl text-[#1a1a1a] mb-4">
                {isZhTw ? "文化筆記" : "Cultural Notes"}
              </h3>
              <ul className="space-y-3">
                {country.cultural_notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#FF1493] shrink-0 mt-2" />
                    <span className="text-[#444] text-sm leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      <section className="py-8 border-t border-gray-200">
        <div className="container">
          <div className="flex items-center justify-between gap-4">
            {prev ? (
              <Link
                href={localePath(`/country/${prev.slug}`)}
                className="flex items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#FF1493] no-underline transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">{prev.flag} {prev.name}</span>
                <span className="sm:hidden">{prev.flag} {isZhTw ? "上一個" : "Prev"}</span>
              </Link>
            ) : <div />}

            <div className="flex items-center gap-3">
              <Link
                href={localePath(`/region/${country.region_slug}`)}
                className="flex items-center gap-1 text-xs font-semibold text-[#666] hover:text-[#FF1493] no-underline"
              >
                <MapPin size={12} />
                {country.region}
              </Link>
            </div>

            {next ? (
              <Link
                href={localePath(`/country/${next.slug}`)}
                className="flex items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#FF1493] no-underline transition-colors"
              >
                <span className="hidden sm:inline">{next.name} {next.flag}</span>
                <span className="sm:hidden">{isZhTw ? "下一個" : "Next"} {next.flag}</span>
                <ArrowRight size={16} />
              </Link>
            ) : <div />}
          </div>
        </div>
      </section>

      {/* Book CTA — Contextual */}
      <section className="py-10 bg-[#1a1a1a]">
        <div className="container text-center">
          <p className="text-gray-400 text-sm mb-2">
            {isZhTw ? "網站是遊樂場。書是完整收藏。" : "The website is the playground. The book is the full collection."}
          </p>
          <p className="text-white font-display text-2xl md:text-3xl mb-2">
            {isZhTw ? (
              <>擁有全部 <span className="text-[#FFE500]">100 個國家</span>的完整指南</>
            ) : (
              <>Own the complete guide to all <span className="text-[#FFE500]">100 countries</span></>
            )}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {isZhTw
              ? "1,000+ 個片語 · 每個詞條附發音連結 · 深度文化背景"
              : "1,000+ phrases · pronunciation for every entry · deep cultural context"}
          </p>
          <a
            href={AMAZON_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-6 py-3 rounded-lg font-bold border-2 border-white shadow-[3px_3px_0px_white] hover:shadow-[1px_1px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
          >
            <BookOpen size={18} />
            {isZhTw ? "在 Amazon 購買完整版" : "Buy the Complete Edition on Amazon"}
          </a>
        </div>
      </section>
    </Layout>
  );
}
