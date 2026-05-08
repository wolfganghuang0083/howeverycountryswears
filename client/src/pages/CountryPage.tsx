import Layout from "@/components/Layout";
import PhraseCard from "@/components/PhraseCard";
import {
  getCountryBySlug,
  getAdjacentCountries,
  getAllCountries,
  getToneColor,
  getToneLabel,
  AMAZON_LINK,
  regionColors,
  isLockedContent,
} from "@/lib/data";
import { getRecommendations } from "@/lib/recommendations";
import { useParams, Link } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, AlertTriangle, MapPin, Lock, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
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
  const isLocked = country ? isLockedContent(country.part_id, country.slug) : false;
  const canViewContent = !isLocked || isBookBuyer;

  // Get recommendations for this country
  const allCountries = getAllCountries(locale);
  const [recommendations] = useState(() => country ? getRecommendations(country, allCountries) : {});

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

        {/* Country Header - same as unlocked */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{ background: `linear-gradient(135deg, ${regionColor}40, transparent 60%)` }}
          />
          <div className="absolute inset-0 benday-dots pointer-events-none" />
          <div className="container relative py-10 md:py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-start gap-4 md:gap-6 mb-6">
                <span className="text-6xl md:text-8xl leading-none">{country.flag}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#999] uppercase">#{country.number}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: regionColor }}>
                      {country.region}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFE500] text-[#1a1a1a] border border-[#1a1a1a]">
                      {isZhTw ? "書籍獨家" : "Book Exclusive"}
                    </span>
                  </div>
                  <h1 className="font-display text-4xl md:text-6xl text-[#1a1a1a] leading-none">
                    {country.name}
                  </h1>
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

        {/* Partial Preview - show first 3 cards */}
        <section className="py-10 md:py-16">
          <div className="container">
            <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-2">
              {isZhTw ? (
                <>來自 <span style={{ color: regionColor }}>{country.name}</span> 的片語預覽</>
              ) : (
                <>Preview from <span style={{ color: regionColor }}>{country.name}</span></>
              )}
            </h2>
            <p className="text-[#666] mb-8">
              {isZhTw
                ? `免費預覽前 3 個片語。購買書籍即可解鎖全部 10 個。`
                : `Preview the first 3 phrases for free. Get the book to unlock all 10.`}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {country.cards.slice(0, 3).map((card, i) => (
                <motion.div
                  key={card.number}
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
                  />
                </motion.div>
              ))}
            </div>

            {/* Fade-out overlay + CTA */}
            <div className="relative mt-8">
              <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              <div className="text-center py-10 bg-gradient-to-b from-white via-[#FFF8E1]/50 to-white rounded-xl border-2 border-dashed border-[#FFE500] p-8">
                <Lock size={32} className="text-[#FF1493] mx-auto mb-4" />
                <h3 className="font-display text-2xl text-[#1a1a1a] mb-2">
                  {isZhTw ? `還有 7 個片語等你解鎖` : `7 more phrases to unlock`}
                </h3>
                <p className="text-[#666] mb-6 max-w-md mx-auto">
                  {isZhTw
                    ? "購買書籍即可解鎖全部 100 個國家的完整發音和文化指南！"
                    : "Get the book to unlock all 100 countries with full pronunciation and cultural guides!"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!isAuthenticated && (
                    <a
                      href={getLoginUrl(localePath(`/country/${country.slug}`))}
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
              </div>
            </div>
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
                      {!isAuthenticated ? (
                        <>
                          <p className="text-[#666] mb-2 text-sm">
                            {isZhTw
                              ? "免費註冊即可收聽所有發音，評分片語，並看看其他人怎麼評。"
                              : "Sign up free to hear all pronunciations, rate phrases, and see how others rated them."}
                          </p>
                          <a
                            href={getLoginUrl(localePath(`/country/${country.slug}`))}
                            className="inline-flex items-center gap-2 text-[#FF1493] font-bold text-sm hover:underline no-underline"
                          >
                            <LogIn size={14} />
                            {isZhTw ? "免費註冊 →" : "Sign Up Free →"}
                          </a>
                        </>
                      ) : (
                        <>
                          <p className="text-[#666] mb-2 text-sm">
                            {isZhTw
                              ? `喜歡${country.name}的髒話？探索其他國家的獨特罵罵文化。`
                              : `Enjoying ${country.name}'s profanity? Explore other countries' unique swearing cultures.`}
                          </p>
                          <Link
                            href={localePath(`/region/${country.region_slug}`)}
                            className="inline-flex items-center gap-2 text-[#FF1493] font-bold text-sm hover:underline no-underline"
                          >
                            <MapPin size={14} />
                            {isZhTw ? `探索${country.region}的更多國家 →` : `Explore more from ${country.region} →`}
                          </Link>
                        </>
                      )}
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

      {/* Recommendations — You Might Also Like */}
      <section className="py-10 bg-[#FAFAFA] border-t border-gray-200">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-display text-2xl md:text-3xl text-[#1a1a1a] mb-6 text-center">
              {isZhTw ? "繼續探索" : "Keep Exploring"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommendations.sameRegion && (
                <Link
                  href={localePath(`/country/${recommendations.sameRegion.country.slug}`)}
                  className="block p-4 bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline group"
                >
                  <span className="text-xs font-bold text-[#32CD32] uppercase tracking-wider">
                    {isZhTw ? "鄰國" : "Next door"}
                  </span>
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <span className="text-3xl">{recommendations.sameRegion.country.flag}</span>
                    <span className="font-bold text-[#1a1a1a] group-hover:text-[#FF1493] transition-colors">
                      {recommendations.sameRegion.country.name}
                    </span>
                  </div>
                  <p className="text-xs text-[#666] line-clamp-2">{recommendations.sameRegion.country.culture.slice(0, 80)}...</p>
                </Link>
              )}
              {recommendations.similarStyle && (
                <Link
                  href={localePath(`/country/${recommendations.similarStyle.country.slug}`)}
                  className="block p-4 bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline group"
                >
                  <span className="text-xs font-bold text-[#00BFFF] uppercase tracking-wider">
                    {isZhTw ? "相似風格" : "Similar vibe"}
                  </span>
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <span className="text-3xl">{recommendations.similarStyle.country.flag}</span>
                    <span className="font-bold text-[#1a1a1a] group-hover:text-[#FF1493] transition-colors">
                      {recommendations.similarStyle.country.name}
                    </span>
                  </div>
                  <p className="text-xs text-[#666] line-clamp-2">{recommendations.similarStyle.country.culture.slice(0, 80)}...</p>
                </Link>
              )}
              {recommendations.opposite && (
                <Link
                  href={localePath(`/country/${recommendations.opposite.country.slug}`)}
                  className="block p-4 bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline group"
                >
                  <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider">
                    {isZhTw ? "完全相反" : "Complete opposite"}
                  </span>
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <span className="text-3xl">{recommendations.opposite.country.flag}</span>
                    <span className="font-bold text-[#1a1a1a] group-hover:text-[#FF1493] transition-colors">
                      {recommendations.opposite.country.name}
                    </span>
                  </div>
                  <p className="text-xs text-[#666] line-clamp-2">{recommendations.opposite.country.culture.slice(0, 80)}...</p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

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

      {/* Bottom CTA — Contextual based on auth state */}
      <section className="py-10 bg-[#1a1a1a]">
        <div className="container text-center">
          {!isAuthenticated ? (
            <>
              <p className="text-gray-400 text-sm mb-2">
                {isZhTw ? "免費註冊即可收聽發音" : "Sign up free to hear pronunciations"}
              </p>
              <p className="text-white font-display text-2xl md:text-3xl mb-2">
                {isZhTw ? (
                  <>免費收聽 <span className="text-[#FFE500]">66 個國家</span>的發音</>
                ) : (
                  <>Hear pronunciations from <span className="text-[#FFE500]">66 countries</span> for free</>
                )}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {isZhTw
                  ? "評分片語，看看其他人怎麼評，探索全球罵罵文化"
                  : "Rate phrases, see how others rated them, explore global swearing cultures"}
              </p>
              <a
                href={getLoginUrl(localePath(`/country/${country.slug}`))}
                className="inline-flex items-center gap-2 bg-[#FF1493] text-white px-6 py-3 rounded-lg font-bold border-2 border-white shadow-[3px_3px_0px_white] hover:shadow-[1px_1px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
              >
                <LogIn size={18} />
                {isZhTw ? "免費註冊" : "Sign Up Free"}
              </a>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
