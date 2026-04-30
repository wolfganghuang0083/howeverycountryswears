import Layout from "@/components/Layout";
import { AMAZON_LINK } from "@/lib/data";
import { BookOpen, Globe, Volume2, Star, Users, Languages, CheckCircle, ArrowRight, ShieldCheck, Gift, Zap, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";

const BOOK_COVER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663213089248/DxiapP3ZDvXs6SvszhZhBd/Swear-Book-Cover-PopArt-V2-eBook_52a815e1.webp";

const FEATURES_EN = [
  { icon: Globe, title: "100 Countries", desc: "From the UK to Uzbekistan, every continent is covered with authentic local profanity." },
  { icon: Volume2, title: "1,000+ Phrases", desc: "10 carefully curated swear words per country, from mild insults to nuclear-grade profanity." },
  { icon: Languages, title: "Tap to Hear", desc: "Every phrase comes with pronunciation — tap and hear exactly how locals say it." },
  { icon: Star, title: "Cultural Context", desc: "Learn when, where, and why each phrase is used. Understand the culture behind the curse." },
  { icon: Users, title: "Community Access", desc: "Book owners unlock exclusive content, submit new phrases, and become Country Ambassadors." },
  { icon: ShieldCheck, title: "Risk Ratings", desc: "Each phrase is rated from 'Mild' to 'Extreme' so you know exactly what you're getting into." },
];

const FEATURES_ZH = [
  { icon: Globe, title: "100 個國家", desc: "從英國到烏茲別克，每個大洲都涵蓋了道地的當地髒話。" },
  { icon: Volume2, title: "1,000+ 個片語", desc: "每個國家精選 10 句髒話，從輕微的侮辱到核彈級的粗話。" },
  { icon: Languages, title: "點擊即聽", desc: "每個片語都附帶發音——點擊即可聽到當地人怎麼說。" },
  { icon: Star, title: "文化背景", desc: "了解每個片語的使用時機、場合和原因。理解罵人背後的文化。" },
  { icon: Users, title: "社群權限", desc: "購書會員可解鎖獨家內容、投稿新片語，並成為國家大使。" },
  { icon: ShieldCheck, title: "風險評級", desc: "每個片語都從「輕微」到「極端」評級，讓你知道自己在說什麼。" },
];

const LANGUAGE_EDITIONS = [
  { lang: "English", flag: "🇺🇸", status: "available", link: AMAZON_LINK },
  { lang: "繁體中文", flag: "🇹🇼", status: "coming_soon", link: null },
  { lang: "简体中文", flag: "🇨🇳", status: "coming_soon", link: null },
  { lang: "日本語", flag: "🇯🇵", status: "coming_soon", link: null },
  { lang: "한국어", flag: "🇰🇷", status: "coming_soon", link: null },
  { lang: "Español", flag: "🇪🇸", status: "coming_soon", link: null },
  { lang: "Français", flag: "🇫🇷", status: "coming_soon", link: null },
  { lang: "Deutsch", flag: "🇩🇪", status: "coming_soon", link: null },
];

export default function BuyBookPage() {
  const { locale } = useLocale();
  const isZhTw = locale === "zh-tw";
  const FEATURES = isZhTw ? FEATURES_ZH : FEATURES_EN;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = isZhTw
      ? "購買書籍 — 全球髒話文化指南 | 1,000 個片語 · 100 個國家"
      : "Get the Book — How Every Country Swears | 1,000 Phrases · 100 Countries";
    return () => {
      document.title = isZhTw
        ? "全球髒話文化指南 — 1,000 個片語，100 個國家"
        : "How Every Country Swears \u2014 1,000 Phrases, 100 Countries";
    };
  }, [isZhTw]);

  return (
    <Layout>
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#2a1a2a] text-white py-16 md:py-24">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, #FF1493 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />

        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="shrink-0"
            >
              <div className="relative">
                <img
                  src={BOOK_COVER}
                  alt="How Every Country Swears — Book Cover"
                  className="w-64 md:w-80 rounded-lg border-4 border-white shadow-2xl"
                />
                <div className="absolute -top-3 -right-3 bg-[#FF1493] text-white px-3 py-1 rounded-full font-bold text-sm border-2 border-white shadow-lg rotate-12">
                  NEW!
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center md:text-left"
            >
              <h1 className="font-display text-3xl md:text-5xl leading-tight mb-4">
                {isZhTw ? (
                  <>全球 100 國的<br /><span className="text-[#FFE500]">完整髒話指南</span></>
                ) : (
                  <>The complete 100-country guide to<br /><span className="text-[#FFE500]">how the world really swears</span></>
                )}
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-2 leading-relaxed">
                {isZhTw
                  ? "一本出乎意料地有趣、出乎意料地有深度的書——為旅行者、語言極客和文化愛好者而寫。"
                  : "A weirdly entertaining, surprisingly insightful book for travelers, language nerds, and culture lovers."}
              </p>
              <p className="text-base text-gray-400 mb-6 max-w-lg">
                {isZhTw ? "作者：" : "By "}<span className="text-white font-bold">Wolfgang Huang</span>
              </p>

              {/* Stats pills */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-8">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-2xl font-bold text-[#FFE500]">1,000+</span>
                  <span className="text-sm text-gray-300 ml-2">{isZhTw ? "個片語" : "phrases"}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-2xl font-bold text-[#FF1493]">100</span>
                  <span className="text-sm text-gray-300 ml-2">{isZhTw ? "個國家" : "countries"}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-2xl font-bold text-[#00CED1]">11</span>
                  <span className="text-sm text-gray-300 ml-2">{isZhTw ? "個區域" : "regions"}</span>
                </div>
              </div>

              {/* Support bullets before CTA */}
              <div className="space-y-1.5 mb-6 text-left">
                {(isZhTw ? [
                  "每個詞條附發音連結",
                  "文化背景、風險評級、區域瀏覽",
                  "送給有黑色幽默感的好奇人的完美禮物",
                ] : [
                  "Pronunciation links for every entry",
                  "Cultural context, risk ratings, and region-based browsing",
                  "A perfect gift for curious people with a dark sense of humor",
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <span className="text-[#32CD32]">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <a
                href={AMAZON_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#FFE500] text-[#1a1a1a] px-8 py-4 rounded-xl font-bold text-lg border-3 border-[#1a1a1a] shadow-[5px_5px_0px_#FF1493] hover:shadow-[2px_2px_0px_#FF1493] hover:translate-x-[3px] hover:translate-y-[3px] transition-all no-underline"
              >
                <BookOpen size={24} />
                {isZhTw ? "在 Amazon 購買完整版" : "Buy the Complete Edition on Amazon"}
                <ArrowRight size={20} />
              </a>
              <p className="text-xs text-gray-500 mt-3">
                {isZhTw ? "Kindle 和平裝版均可購買" : "Available on Kindle and Paperback"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WHY BUY THE BOOK — The missing conversion argument ===== */}
      <section className="py-16 md:py-20 bg-[#FFF8E1] border-y-4 border-[#FFE500]">
        <div className="container max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 justify-center mb-6">
              <HelpCircle size={28} className="text-[#FF1493]" />
              <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a]">
                {isZhTw ? "網站免費，為什麼還要買書？" : "Why buy the book if the website is free?"}
              </h2>
            </div>

            <p className="text-center text-lg text-[#666] mb-8">
              {isZhTw
                ? "網站讓你瀏覽。書讓你擁有完整體系。"
                : "The website lets you browse. The book gives you the full system."}
            </p>

            <div className="space-y-3">
              {(isZhTw ? [
                { icon: "📚", text: "1,000 個片語集中在一個地方——不用在頁面間跳來跳去" },
                { icon: "🔊", text: "每個詞條都附互動式發音連結——點擊即聽" },
                { icon: "🗺️", text: "依國家和區域精心編排的結構——系統性學習" },
                { icon: "🧠", text: "更深度的文化背景——不只是翻譯，而是理解" },
                { icon: "🎁", text: "適合送禮、適合一口氣讀完的有趣格式" },
              ] : [
                { icon: "📚", text: "1,000 phrases in one place — no jumping between pages" },
                { icon: "🔊", text: "Interactive pronunciation links for every entry — tap and hear" },
                { icon: "🗺️", text: "Curated structure by country and region — systematic learning" },
                { icon: "🧠", text: "Deeper cultural context — not just translation, but understanding" },
                { icon: "🎁", text: "A giftable, bingeable format that's fun to own" },
              ]).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
                >
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <span className="text-[#444] font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-[#999] text-sm mb-4 italic">
                {isZhTw
                  ? "「免費瀏覽。擁有完整的世界之旅。」"
                  : "\"Browse for free. Own the complete world tour.\""}
              </p>
              <a
                href={AMAZON_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FF1493] text-white px-7 py-3.5 rounded-lg font-bold text-base border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
              >
                <BookOpen size={20} />
                {isZhTw ? "解鎖全部 1,000 個片語" : "Unlock All 1,000 Phrases"}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== PROBLEM / HOOK SECTION ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            {isZhTw ? (
              <>
                <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-6">
                  你走遍了全世界...<br />
                  <span className="text-[#FF1493]">但你真的懂當地的語言嗎？</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  每本語言教科書都教你「請」和「謝謝」。但老實說——每個人學新語言時真正想學的第一批詞，都是那些在禮貌場合<em>不能說</em>的話。
                </p>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  <strong>《全球髒話文化指南》</strong>不只是一份壞話清單——而是深入探討人們為什麼用這種方式罵人背後的文化、歷史和心理學。一本結構嚴謹的文化指南，用不正經的包裝呈現嚴肅的研究。
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  從德語創意十足的複合侮辱，到阿拉伯語攻擊家族榮譽的罵法，從芬蘭語令人捧腹的動物比喻，到日語出乎意料的詩意粗話——這本書全部涵蓋。
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-6">
                  You've Traveled the World...<br />
                  <span className="text-[#FF1493]">But Do You REALLY Know the Language?</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Every language textbook teaches you "please" and "thank you." But let's be honest — the first words anyone actually wants to learn in a new language are the ones you <em>can't</em> say in polite company.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  <strong>How Every Country Swears</strong> isn't just a list of bad words — it's a structured cultural guide to how different societies express anger, contempt, intimacy, humor, and taboo. Serious research wrapped in irreverent packaging.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  From the creative compound insults of German to the family-honor attacks of Arabic, from the hilariously specific animal comparisons of Finnish to the surprisingly poetic profanity of Japanese — this book covers it all.
                </p>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-16 md:py-20 bg-[#FAFAFA]">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] text-center mb-12">
            {isZhTw ? "書中內容" : "What's Inside the Book"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-6 hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#FF1493]/10 flex items-center justify-center mb-4">
                  <f.icon size={24} className="text-[#FF1493]" />
                </div>
                <h3 className="font-display text-xl text-[#1a1a1a] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOOK OWNER EXCLUSIVE ACCESS ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] text-center mb-10">
            {isZhTw ? (
              <>購書會員享有<span className="text-[#FF1493]">獨家權限</span></>
            ) : (
              <>Book Owners Get <span className="text-[#FF1493]">Exclusive Access</span></>
            )}
          </h2>
          <div className="space-y-4">
            {(isZhTw ? [
              "全部 100 個國家的完整發音音檔（1,000+ 個片語）",
              "獨家 Part 8–11 內容（額外 45 個國家）",
              "向社群投稿你知道的髒話",
              "獲得積分、徽章，成為國家大使",
              "存取全球髒話排行榜",
              "為每張片語卡片評分和撰寫評論",
              "優先取得未來的語言版本",
            ] : [
              "Full pronunciation audio for all 100 countries (1,000+ phrases)",
              "Exclusive Part 8–11 content (45 additional countries)",
              "Submit your own swear words to the community",
              "Earn points, badges, and become a Country Ambassador",
              "Access the global profanity leaderboard",
              "Rate and review every phrase card",
              "Priority access to future language editions",
            ]).map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GIFT ANGLE ===== */}
      <section className="py-14 md:py-20 bg-[#FFF0F5]">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Gift size={40} className="mx-auto text-[#FF1493] mb-4" />
            <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-4">
              {isZhTw ? (
                <>送禮？<span className="text-[#FF1493]">這本就對了。</span></>
              ) : (
                <>Looking for a gift? <span className="text-[#FF1493]">This is it.</span></>
              )}
            </h2>
            <p className="text-lg text-[#666] leading-relaxed mb-6">
              {isZhTw
                ? "送給旅行者、語言極客，和那些書架上已經太多無聊書的朋友。一本出乎意料地聰明的茶几話題製造機。今年你會買到的最有趣的「嚴肅」書。"
                : "The perfect gift for travelers, language geeks, and people who already own too many boring books. A weirdly smart coffee-table conversation starter. The funniest serious book you'll buy this year."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {(isZhTw
                ? ["🎄 節日禮物", "🎂 生日驚喜", "✈️ 旅行伴手禮", "🎓 畢業禮物", "☕ 茶几話題書"]
                : ["🎄 Holiday Gift", "🎂 Birthday Surprise", "✈️ Travel Companion", "🎓 Graduation Gift", "☕ Coffee Table Book"]
              ).map((tag, i) => (
                <span key={i} className="bg-white text-[#FF1493] px-4 py-2 rounded-full text-sm font-semibold border-2 border-[#FF1493]/20 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF — Authentic framing ===== */}
      <section className="py-16 md:py-20 bg-[#1a1a1a] text-white">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl text-center mb-4">
            {isZhTw ? (
              <>讀者<span className="text-[#FFE500]">怎麼說</span></>
            ) : (
              <>What Readers Are <span className="text-[#FFE500]">Saying</span></>
            )}
          </h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            {isZhTw ? "來自 Amazon 的真實讀者評論" : "Real reader reviews from Amazon"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(isZhTw ? [
              { text: "買來當搞笑禮物，結果自己讀完了整本。文化背景的部分真的很迷人，比我預期的有深度太多了。", author: "Amazon 讀者", context: "購買原因：送禮" },
              { text: "身為語言學愛好者，我很欣賞書中的音標標注和細緻的分類。這本書出乎意料地有學術價值！", author: "Amazon 讀者", context: "購買原因：語言學習" },
              { text: "帶這本書去旅行，在每個國家都試了幾句。當地人的反應太經典了——從大笑到震驚都有。", author: "Amazon 讀者", context: "購買原因：旅行" },
            ] : [
              { text: "I bought this as a joke gift but ended up reading the whole thing myself. The cultural context is genuinely fascinating — way more depth than I expected.", author: "Amazon Reader", context: "Bought as: Gift" },
              { text: "As a linguistics enthusiast, I appreciate the IPA transcriptions and the careful categorization. This is surprisingly scholarly!", author: "Amazon Reader", context: "Bought for: Language learning" },
              { text: "Took this book traveling and tried a few phrases in each country. The locals' reactions were priceless — from laughter to genuine shock.", author: "Amazon Reader", context: "Bought for: Travel" },
            ]).map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={16} className="fill-[#FFE500] text-[#FFE500]" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-semibold">— {testimonial.author}</p>
                  <span className="text-xs text-[#FFE500]/60">{testimonial.context}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LANGUAGE EDITIONS ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] text-center mb-4">
            {isZhTw ? (
              <><span className="text-[#00CED1]">語言版本</span></>
            ) : (
              <>Available <span className="text-[#00CED1]">Editions</span></>
            )}
          </h2>
          <p className="text-center text-gray-500 mb-10">
            {isZhTw ? "更多語言版本即將推出，敬請期待！" : "More language editions coming soon. Sign up to be notified!"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LANGUAGE_EDITIONS.map((ed, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  ed.status === "available"
                    ? "border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px]"
                    : "border-gray-200 bg-gray-50 opacity-70"
                }`}
              >
                <span className="text-3xl block mb-2">{ed.flag}</span>
                <span className="font-bold text-sm text-[#1a1a1a] block">{ed.lang}</span>
                {ed.status === "available" && ed.link ? (
                  <a
                    href={ed.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs font-bold text-[#FF1493] no-underline hover:underline"
                  >
                    {isZhTw ? "立即購買 →" : "Buy Now →"}
                  </a>
                ) : (
                  <span className="inline-block mt-2 text-xs font-semibold text-gray-400">
                    {isZhTw ? "即將推出" : "Coming Soon"}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#FF1493] to-[#FF6B6B] text-white">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              {isZhTw ? "準備好像當地人一樣罵了嗎？" : "Ready to Swear Like a Local?"}
            </h2>
            <p className="text-xl text-white/80 mb-4 max-w-2xl mx-auto">
              {isZhTw
                ? "加入已經發現世界上最精彩語言的讀者。今天就入手你的那本！"
                : "Join readers who've discovered the world's most colorful language. Get your copy today!"}
            </p>
            {/* Final micro-proof */}
            <p className="text-sm text-white/60 mb-8">
              1,000+ {isZhTw ? "個片語" : "phrases"} · 100 {isZhTw ? "個國家" : "countries"} · {isZhTw ? "每個詞條附發音連結" : "pronunciation links for every entry"} · {isZhTw ? "適合送禮" : "built for binge reading and gift-worthy browsing"}
            </p>
            <a
              href={AMAZON_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#FFE500] text-[#1a1a1a] px-10 py-5 rounded-xl font-bold text-xl border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] hover:shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] transition-all no-underline"
            >
              <BookOpen size={28} />
              {isZhTw ? "在 Amazon 購買完整版" : "Get the Full 100-Country Edition"}
              <ArrowRight size={24} />
            </a>
            <p className="text-sm text-white/60 mt-4">
              {isZhTw ? "Kindle 和平裝版均可購買" : "Available on Kindle and Paperback"}
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
