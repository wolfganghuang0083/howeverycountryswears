import Layout from "@/components/Layout";
import PhraseCard from "@/components/PhraseCard";
import { getAllCountries, getRiskLevel, AMAZON_LINK, type Country, type Card as CardType } from "@/lib/data";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { Skull, Laugh, Sparkles, Bomb, BookOpen } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";

const categoriesEn = [
  {
    slug: "most-dangerous",
    title: "Most Dangerous",
    titleZh: "最危險",
    description: "Phrases with Extreme or Severe risk ratings — use at your own peril",
    descriptionZh: "風險等級為「極端」或「嚴重」的片語 — 後果自負",
    icon: Skull,
    color: "#DC2626",
    filter: (card: CardType) => {
      const level = getRiskLevel(card.risk);
      return level === "extreme" || level === "severe";
    },
  },
  {
    slug: "funniest",
    title: "Funniest",
    titleZh: "最搞笑",
    description: "Creative Genius phrases — the most imaginative insults from around the world",
    descriptionZh: "創意天才片語 — 來自世界各地最有想像力的罵人話",
    icon: Laugh,
    color: "#FFE500",
    filter: (card: CardType) => card.type === "Creative Genius",
  },
  {
    slug: "most-creative",
    title: "Most Creative",
    titleZh: "最有創意",
    description: "Cultural Special phrases — unique to each country's culture",
    descriptionZh: "文化特色片語 — 每個國家獨有的文化罵人話",
    icon: Sparkles,
    color: "#00BFFF",
    filter: (card: CardType) => card.type === "Cultural Special",
  },
  {
    slug: "nuclear-options",
    title: "Nuclear Options",
    titleZh: "核彈級",
    description: "The absolute worst thing you can say in each country",
    descriptionZh: "每個國家最不能說的話",
    icon: Bomb,
    color: "#FF1493",
    filter: (card: CardType) => card.type === "Nuclear Option",
  },
];

export default function RankingsPage() {
  const { category } = useParams<{ category?: string }>();
  const { locale, t, localePath } = useLocale();
  const isZhTw = locale === "zh-tw";

  const countries = getAllCountries(locale);
  const { user, isAuthenticated } = useAuth();

  const activeCategory = categoriesEn.find((c) => c.slug === category) || categoriesEn[0];

  useEffect(() => {
    window.scrollTo(0, 0);
    const catTitle = isZhTw ? activeCategory.titleZh : activeCategory.title;
    document.title = isZhTw
      ? `${catTitle}髒話排行榜 | 全球髒話文化指南`
      : `${activeCategory.title} Swear Words Rankings | How Every Country Swears`;
    return () => {
      document.title = isZhTw
        ? '全球髒話文化指南 — 1,000 個片語，100 個國家'
        : 'How Every Country Swears \u2014 1,000 Phrases, 100 Countries';
    };
  }, [category, activeCategory, isZhTw]);

  const filteredPhrases = useMemo(() => {
    const results: { country: Country; card: CardType }[] = [];
    for (const c of countries) {
      for (const card of c.cards) {
        if (activeCategory.filter(card)) {
          results.push({ country: c, card });
        }
      }
    }
    return results;
  }, [countries, activeCategory]);

  return (
    <Layout>
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 benday-dots pointer-events-none" />
        <div className="container relative py-10 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl md:text-6xl text-[#1a1a1a] mb-3">
              {isZhTw ? "排行榜" : "Rankings"}
            </h1>
            <p className="text-[#666] text-lg max-w-xl">
              {isZhTw
                ? "瀏覽全球最極端、最有創意、最搞笑的髒話"
                : "Browse the most extreme, creative, and hilarious profanity from around the world"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="sticky top-16 z-40 bg-white border-b-2 border-[#1a1a1a]">
        <div className="container">
          <div className="flex overflow-x-auto gap-1 py-2 -mx-1">
            {categoriesEn.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.slug === activeCategory.slug;
              return (
                <Link
                  key={cat.slug}
                  href={localePath(`/rankings/${cat.slug}`)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap no-underline transition-all border-2 ${
                    isActive
                      ? "border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] text-white"
                      : "border-transparent text-[#666] hover:text-[#1a1a1a] hover:bg-gray-50"
                  }`}
                  style={isActive ? { backgroundColor: cat.color } : {}}
                >
                  <Icon size={16} />
                  {isZhTw ? cat.titleZh : cat.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <section className="py-10 md:py-16">
        <div className="container">
          <div className="mb-6">
            <h2 className="font-display text-2xl md:text-3xl text-[#1a1a1a] mb-1">
              {isZhTw ? activeCategory.titleZh : activeCategory.title}
            </h2>
            <p className="text-[#666] text-sm">
              {isZhTw ? activeCategory.descriptionZh : activeCategory.description}
            </p>
            <p className="text-xs text-[#999] mt-1">
              {isZhTw ? `找到 ${filteredPhrases.length} 個片語` : `${filteredPhrases.length} phrases found`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPhrases.map(({ country, card }, i) => (
              <motion.div
                key={`${country.slug}-${card.number}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <PhraseCard card={card} country={country} showCountryLink isAuthenticated={isAuthenticated} memberTier={user?.memberTier} userRole={user?.role} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contextual Book CTA */}
      <section className="py-10 bg-[#1a1a1a]">
        <div className="container text-center max-w-2xl mx-auto">
          <p className="text-gray-400 text-sm mb-2">
            {isZhTw
              ? `你剛瀏覽了 ${filteredPhrases.length} 個「${isZhTw ? activeCategory.titleZh : activeCategory.title}」片語——書中還有更多等你發掘。`
              : `You just browsed ${filteredPhrases.length} "${activeCategory.title}" phrases — there's even more in the book.`}
          </p>
          <p className="text-white font-display text-xl md:text-2xl mb-4">
            {isZhTw ? "擁有完整的全球髒話地圖集" : "Own the complete swear atlas"}
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
