import Layout from "@/components/Layout";
import PhraseCard from "@/components/PhraseCard";
import { getAllCountries, getAllParts, regionColors, AMAZON_LINK, type Country } from "@/lib/data";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Volume2, Globe, MapPin, Gift, Sparkles, Users, Star } from "lucide-react";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  return <HomeContent isAuthenticated={isAuthenticated} memberTier={user?.memberTier} userRole={user?.role} />;
}

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663213089248/DxiapP3ZDvXs6SvszhZhBd/hero-bg-h6jdTKmyYBnpMB8qKWFAvW.webp";
const BOOK_COVER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663213089248/DxiapP3ZDvXs6SvszhZhBd/Swear-Book-Cover-PopArt-V2-eBook_52a815e1.webp";
const WORLD_MAP_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663213089248/DxiapP3ZDvXs6SvszhZhBd/world-map-bg-XGxQcV3kJawSS293NtvsR4.webp";

// Featured phrases - hand-picked interesting ones
const FEATURED_SLUGS = [
  { country: "spain", card: 3 },
  { country: "netherlands", card: 1 },
  { country: "finland", card: 1 },
  { country: "australia", card: 10 },
  { country: "japan", card: 3 },
  { country: "germany", card: 3 },
];

function AnimatedCounter({ end, label, suffix }: { end: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, hasStarted]);

  return (
    <div className="text-center" ref={ref}>
      <div className="font-display text-4xl md:text-6xl text-white leading-none">
        {count.toLocaleString()}{suffix || ''}
      </div>
      <div className="text-white/80 font-semibold text-sm md:text-base mt-1">{label}</div>
    </div>
  );
}

function HomeContent({ isAuthenticated, memberTier, userRole }: { isAuthenticated: boolean; memberTier?: string; userRole?: string }) {
  const { locale, t, localePath } = useLocale();
  const countries = getAllCountries(locale);
  const parts = getAllParts(locale);

  const isZhTw = locale === "zh-tw";
  const HOME_TITLE = isZhTw
    ? "全球髒話文化指南 — 1,000 個片語，100 個國家"
    : "How Every Country Swears \u2014 1,000 Phrases, 100 Countries";

  useEffect(() => {
    document.title = HOME_TITLE;
  }, [HOME_TITLE]);

  const featuredCards = useMemo(() => {
    return FEATURED_SLUGS.map(({ country: slug, card: num }) => {
      const c = countries.find((x) => x.slug === slug);
      if (!c) return null;
      const card = c.cards.find((x) => x.number === num);
      if (!card) return null;
      return { country: c, card };
    }).filter(Boolean) as { country: Country; card: any }[];
  }, [countries]);

  return (
    <Layout>
      {/* ===== HERO SECTION — Conversion-focused ===== */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        <div className="relative container py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            {/* Main headline — opinion-driven, curiosity-inducing */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white leading-[0.95] mb-5">
              {isZhTw ? (
                <>從一個國家的<span className="text-[#FFE500]">髒話</span>，<br />比教科書更能理解它的<span className="text-[#FF1493]">文化</span>。</>
              ) : (
                <>You can learn more about a culture from its <span className="text-[#FFE500]">swear words</span> than its <span className="text-[#FF1493]">textbooks</span>.</>
              )}
            </h1>

            {/* Subheadline — clear free vs paid framing */}
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl leading-relaxed">
              {isZhTw
                ? "免費探索 100 個國家的精選片語，然後在完整書籍中解鎖全部 1,000 個片語、發音連結和深度文化背景。"
                : "Browse free samples from 100 countries, then unlock all 1,000 phrases, pronunciation links, and cultural context in the complete book."}
            </p>

            {/* CTAs — Primary: Book, Secondary: Free Samples */}
            <div className="flex flex-wrap gap-4">
              <a
                href={AMAZON_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-7 py-3.5 rounded-lg font-bold text-base border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
              >
                <BookOpen size={20} />
                {isZhTw ? "購買完整 100 國版本" : "Get the Full 100-Country Edition"}
              </a>
              <a
                href="#explore"
                className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-6 py-3.5 rounded-lg font-bold text-base border-2 border-white/40 hover:bg-white/25 transition-all no-underline"
              >
                <Globe size={20} />
                {isZhTw ? "免費試閱精選片語" : "Explore Free Samples"}
              </a>
            </div>

            {/* Credibility strip */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/60 text-sm font-semibold">
              <span>1,000+ {isZhTw ? "個片語" : "phrases"}</span>
              <span className="hidden sm:inline">·</span>
              <span>100 {isZhTw ? "個國家" : "countries"}</span>
              <span className="hidden sm:inline">·</span>
              <span>11 {isZhTw ? "個世界區域" : "world regions"}</span>
              <span className="hidden sm:inline">·</span>
              <span>{isZhTw ? "每個片語附發音連結" : "pronunciation for every entry"}</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-6 max-w-lg"
          >
            <AnimatedCounter end={1000} label={t("home.stats.phrases")} suffix="+" />
            <AnimatedCounter end={100} label={t("home.stats.countries")} />
            <AnimatedCounter end={11} label={t("home.stats.regions")} />
          </motion.div>
        </div>
      </section>

      {/* ===== TARGET AUDIENCE STRIP ===== */}
      <section className="bg-[#FF1493] py-4">
        <div className="container">
          <p className="text-center text-white font-semibold text-sm md:text-base">
            {isZhTw
              ? "為旅行者、語言狂熱者、送禮達人，以及所有好奇「禮貌崩壞時文化真正的聲音」的人而寫。"
              : "For travelers, language nerds, gift hunters, and anyone curious about how culture really sounds when politeness breaks down."}
          </p>
        </div>
      </section>

      {/* ===== CURIOSITY BULLETS — What makes this book different ===== */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] text-center mb-10">
            {isZhTw ? (
              <>不只是一份<span className="text-[#FF1493]">壞話清單</span></>
            ) : (
              <>Not just a list of <span className="text-[#FF1493]">bad words</span></>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(isZhTw ? [
              { icon: "🤔", text: "為什麼「你媽」在某些國家能引發打架，在另一些國家卻幾乎是日常用語？" },
              { icon: "⚔️", text: "哪些文化把宗教、疾病、動物或家族榮譽當作罵人武器？" },
              { icon: "😂", text: "哪些髒話聽起來很搞笑，但說出來可能會被揍？" },
              { icon: "🧠", text: "只有理解文化背景才能真正懂的侮辱——書中全部解析。" },
            ] : [
              { icon: "🤔", text: "Why \"your mother\" starts fights in one country, but sounds almost casual in another." },
              { icon: "⚔️", text: "Which cultures weaponize religion, disease, animals, or family honor in their insults." },
              { icon: "😂", text: "The swear words that sound funny but can actually get you punched." },
              { icon: "🧠", text: "The insults that only work if you understand the culture behind them." },
            ]).map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-5 bg-[#FAFAFA] rounded-xl border-2 border-[#eee] hover:border-[#FF1493]/30 transition-colors"
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <p className="text-[#444] leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PHRASES — Free Samples ===== */}
      <section id="explore" className="py-16 md:py-24 relative">
        <div className="absolute inset-0 benday-dots pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-3">
            <span className="inline-block bg-[#32CD32] text-white text-xs font-bold px-3 py-1 rounded-full border border-[#1a1a1a] mb-4">
              {isZhTw ? "免費試閱" : "FREE SAMPLES"}
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-[#1a1a1a] mb-3">
              {isZhTw ? (
                <><span className="text-[#FF1493]">精選</span>片語</>
              ) : (
                <>Featured{" "}<span className="text-[#FF1493]">Phrases</span></>
              )}
            </h2>
            <p className="text-[#666] max-w-lg mx-auto">
              {isZhTw ? "來自世界各地最有創意、最震撼、最搞笑的髒話——先試幾個" : "Some of the world's most creative, shocking, and hilarious profanity — try a few"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCards.map(({ country, card }, i) => (
              <motion.div
                key={`${country.slug}-${card.number}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <PhraseCard card={card} country={country} showCountryLink linkToDetail isAuthenticated={isAuthenticated} memberTier={memberTier} userRole={userRole} />
              </motion.div>
            ))}
          </div>

          {/* Contextual CTA after free samples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <p className="text-[#666] mb-4 text-lg">
              {isZhTw
                ? "喜歡這些嗎？書中還有 994 個等你發掘。"
                : "Enjoying these? There are 994 more in the book."}
            </p>
            <a
              href={AMAZON_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-6 py-3 rounded-lg font-bold text-base border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
            >
              <BookOpen size={18} />
              {isZhTw ? "解鎖全部 1,000 個片語" : "Unlock All 1,000 Phrases"}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ===== INTERACTIVE WORLD MAP ===== */}
      <section className="relative py-16 md:py-24 bg-[#1a1a1a] overflow-hidden">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-4xl md:text-5xl text-white mb-3">
              {isZhTw ? (
                <>探索{" "}<span className="text-[#FFE500]">世界</span></>
              ) : (
                <>Explore the{" "}<span className="text-[#FFE500]">World</span></>
              )}
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              {isZhTw ? "點擊任何國家，探索其獨特的髒話文化" : "Click any country to discover its unique profanity culture"}
            </p>
          </motion.div>

          {/* Map as clickable image */}
          <div className="relative max-w-4xl mx-auto">
            <img
              src={WORLD_MAP_BG}
              alt="World Map"
              className="w-full rounded-xl border-3 border-white/20"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <a
                href="#regions"
                className="bg-white/95 backdrop-blur-sm rounded-xl p-4 border-2 border-[#1a1a1a] shadow-lg no-underline text-center hover:scale-105 transition-transform cursor-pointer"
              >
                <MapPin size={24} className="mx-auto text-[#FF1493] mb-1" />
                <span className="font-bold text-sm text-[#1a1a1a] block">
                  {isZhTw ? "依區域瀏覽" : "Browse by Region"}
                </span>
                <span className="text-xs text-[#666]">
                  {isZhTw ? `11 個區域，${countries.length} 個國家` : `11 regions, ${countries.length} countries`}
                </span>
              </a>
            </div>
          </div>

          {/* Country quick links grid */}
          <div className="mt-10 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-11 gap-2 max-w-5xl mx-auto">
            {countries.map((c) => (
              <Link
                key={c.slug}
                href={localePath(`/country/${c.slug}`)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/15 transition-colors no-underline group"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">{c.flag}</span>
                <span className="text-[10px] text-gray-400 group-hover:text-white text-center leading-tight truncate w-full">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REGION NAVIGATION ===== */}
      <section id="regions" className="py-16 md:py-24 bg-[#FAFAFA]">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl md:text-5xl text-[#1a1a1a] mb-3">
              {isZhTw ? (
                <>依{" "}<span className="text-[#00BFFF]">區域</span>{" "}瀏覽</>
              ) : (
                <>Browse by{" "}<span className="text-[#00BFFF]">Region</span></>
              )}
            </h2>
            <p className="text-[#666] max-w-lg mx-auto">
              {isZhTw ? "11 個區域涵蓋全球每個角落" : "11 regions covering every corner of the globe"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {parts.map((part, i) => {
              const color = regionColors[part.slug] || "#FF1493";
              const flags = part.countries.slice(0, 6).map((c) => c.flag).join(" ");
              const hasCountries = part.countries.length > 0;
              return (
                <motion.div
                  key={part.slug}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  {hasCountries ? (
                    <Link
                      href={localePath(`/region/${part.slug}`)}
                      className="block p-5 bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline group h-full"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-3 h-10 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-bold text-[#999] uppercase">
                          Part {part.id}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-[#1a1a1a] mb-1 group-hover:text-[#FF1493] transition-colors">
                        {part.title}
                      </h3>
                      <p className="text-sm text-[#666] mb-3">
                        {part.countries.length} {isZhTw ? "個國家" : "countries"}
                      </p>
                      <div className="text-lg tracking-wider">{flags}</div>
                      <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-[#FF1493]">
                        {isZhTw ? "探索" : "Explore"} <ArrowRight size={12} />
                      </div>
                    </Link>
                  ) : (
                    <div className="block p-5 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 h-full opacity-70">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-3 h-10 rounded-full opacity-40"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-bold text-[#999] uppercase">
                          Part {part.id}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-[#999] mb-1">
                        {part.title}
                      </h3>
                      <p className="text-xs text-[#999] mb-2">
                        {isZhTw ? "完整版書籍收錄" : "Coming in the full book"}
                      </p>
                      <span className="inline-block px-2 py-0.5 bg-[#FFE500]/30 text-[#999] text-xs font-bold rounded-full border border-[#FFE500]/50">
                        {t("home.cta.button")}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== GIFT ANGLE SECTION ===== */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Gift size={40} className="mx-auto text-[#FF1493] mb-4" />
            <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-4">
              {isZhTw ? (
                <>今年最有趣的<span className="text-[#FF1493]">送禮選擇</span></>
              ) : (
                <>The funniest serious book <span className="text-[#FF1493]">you'll buy this year</span></>
              )}
            </h2>
            <p className="text-lg text-[#666] leading-relaxed mb-3">
              {isZhTw
                ? "送給旅行者、語言極客，和那些書架上已經太多無聊書的朋友——一本出乎意料地聰明的茶几話題製造機。"
                : "The perfect gift for travelers, language geeks, and people who already own too many boring books. A weirdly smart coffee-table conversation starter."}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {(isZhTw
                ? ["🎁 絕佳禮物", "✈️ 旅行必備", "📖 Kindle + 平裝版", "🎓 出乎意料的學術價值"]
                : ["🎁 Perfect Gift", "✈️ Travel Essential", "📖 Kindle + Paperback", "🎓 Surprisingly Scholarly"]
              ).map((tag, i) => (
                <span key={i} className="bg-[#FFF0F5] text-[#FF1493] px-3 py-1.5 rounded-full text-sm font-semibold border border-[#FF1493]/20">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== BOOK CTA — Conversion-focused ===== */}
      <section className="py-16 md:py-24 bg-[#1a1a1a] relative overflow-hidden">
        <div className="container relative">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Book Cover */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="shrink-0"
            >
              <img
                src={BOOK_COVER}
                alt="How Every Country Swears - Book Cover"
                className="w-56 md:w-72 rounded-lg border-3 border-white/20 shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500"
              />
            </motion.div>

            {/* CTA Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[#FFE500] font-bold text-sm uppercase tracking-wider mb-2">
                {isZhTw ? "網站是遊樂場。書是完整收藏。" : "The website is the playground. The book is the full collection."}
              </p>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-5">
                {isZhTw ? (
                  <>擁有完整的{" "}<span className="text-[#FFE500]">全球髒話地圖集</span></>
                ) : (
                  <>Own the Complete{" "}<span className="text-[#FFE500]">Swear Atlas</span></>
                )}
              </h2>

              {/* Micro-proof bullets */}
              <div className="space-y-2 mb-6">
                {(isZhTw ? [
                  "1,000+ 個片語，集中在一本書裡",
                  "每個詞條都附互動式發音連結",
                  "依國家和區域精心編排的結構",
                  "深度文化背景，不用在頁面間跳來跳去",
                  "適合送禮、適合一口氣讀完的有趣格式",
                ] : [
                  "1,000+ phrases in one place",
                  "Interactive pronunciation links for every entry",
                  "Curated structure by country and region",
                  "Deeper cultural context without jumping between pages",
                  "A giftable, bingeable format that's fun to own",
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="text-[#32CD32]">✓</span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <a
                href={AMAZON_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-8 py-4 rounded-lg font-bold text-lg border-3 border-white shadow-[4px_4px_0px_white] hover:shadow-[2px_2px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
              >
                <BookOpen size={22} />
                {isZhTw ? "在 Amazon 購買完整版" : "Buy the Complete Edition on Amazon"}
              </a>
              <p className="text-xs text-gray-500 mt-3">
                {isZhTw ? "Kindle 和平裝版均可購買" : "Available on Kindle and Paperback"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
