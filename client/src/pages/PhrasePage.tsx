import Layout from "@/components/Layout";
import PhraseCard from "@/components/PhraseCard";
import { getPhraseById, getAllCountries, AMAZON_LINK, type Card as CardType, type Country } from "@/lib/data";
import { useParams, Link } from "wouter";
import { ArrowLeft, BookOpen, Star, MessageSquare, Send, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocale } from "@/contexts/LocaleContext";

function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(value) ? "fill-[#FFE500] text-[#FFE500]" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

function RatingBreakdown({ ratings }: { ratings: Record<number, number> }) {
  const total = Object.values(ratings).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = ratings[star] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right text-gray-500">{star}</span>
            <Star size={10} className="fill-[#FFE500] text-[#FFE500]" />
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#FFE500] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 text-right text-gray-400">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function TimeAgo({ date, isZhTw }: { date: Date | string; isZhTw: boolean }) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);

  if (isZhTw) {
    if (mins < 1) return <span>剛剛</span>;
    if (mins < 60) return <span>{mins} 分鐘前</span>;
    if (hours < 24) return <span>{hours} 小時前</span>;
    if (days < 30) return <span>{days} 天前</span>;
    return <span>{months} 個月前</span>;
  }
  if (mins < 1) return <span>just now</span>;
  if (mins < 60) return <span>{mins}m ago</span>;
  if (hours < 24) return <span>{hours}h ago</span>;
  if (days < 30) return <span>{days}d ago</span>;
  return <span>{months}mo ago</span>;
}

export default function PhrasePage() {
  const { id } = useParams<{ id: string }>();
  const { locale, t, localePath } = useLocale();
  const isZhTw = locale === "zh-tw";

  const result = getPhraseById(id || "", locale);
  const { user, isAuthenticated } = useAuth();
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (result) {
      const { country, card } = result;
      document.title = isZhTw
        ? `「${card.phrase}」— ${country.name} 髒話 #${card.number} 附發音 | 全球髒話文化指南`
        : `"${card.phrase}" — ${country.name} Swear Word #${card.number} with Pronunciation | How Every Country Swears`;
    }
    return () => {
      document.title = isZhTw
        ? '全球髒話文化指南 — 1,000 個片語，100 個國家'
        : 'How Every Country Swears \u2014 1,000 Phrases, 100 Countries';
    };
  }, [id, result, isZhTw]);

  const countries = getAllCountries(locale);

  // Fetch reviews for this card
  const reviewsQuery = trpc.review.getForCard.useQuery(
    { countrySlug: result?.country.slug || "", cardNumber: result?.card.number || 1, limit: 50 },
    { enabled: !!result }
  );

  // Fetch aggregate ratings
  const ratingsQuery = trpc.rating.getForCountry.useQuery(
    { countrySlug: result?.country.slug || "", cardNumbers: result ? [result.card.number] : [] },
    { enabled: !!result }
  );

  const createReviewMutation = trpc.review.create.useMutation({
    onSuccess: () => {
      setReviewText("");
      setReviewRating(5);
      reviewsQuery.refetch();
      ratingsQuery.refetch();
    },
  });

  const relatedPhrases = useMemo(() => {
    if (!result) return [];
    const { card, country } = result;
    const related: { country: Country; card: CardType }[] = [];
    for (const c of countries) {
      if (c.slug === country.slug) continue;
      const match = c.cards.find((cc) => cc.type === card.type);
      if (match) related.push({ country: c, card: match });
      if (related.length >= 4) break;
    }
    return related;
  }, [result, countries]);

  if (!result) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-4xl text-[#1a1a1a] mb-4">
            {isZhTw ? "找不到片語" : "Phrase Not Found"}
          </h1>
          <Link href={localePath("/")} className="text-[#FF1493] font-semibold">
            {t("common.backToHome")}
          </Link>
        </div>
      </Layout>
    );
  }

  const { country, card } = result;
  const ratingData = ratingsQuery.data?.[card.number];
  const avgRating = ratingData?.avg || 0;
  const totalRatings = ratingData?.total || 0;
  const reviewItems = reviewsQuery.data?.items || [];
  const totalReviews = reviewsQuery.data?.total || 0;

  // Build rating breakdown from reviews
  const ratingBreakdown: Record<number, number> = {};
  for (const r of reviewItems) {
    ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1;
  }

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;
    createReviewMutation.mutate({
      countrySlug: country.slug,
      cardNumber: card.number,
      content: reviewText.trim(),
      rating: reviewRating,
    });
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-[#FAFAFA] border-b border-gray-200">
        <div className="container py-3 flex items-center gap-2 text-sm">
          <Link href={localePath("/")} className="text-[#666] hover:text-[#FF1493] no-underline">
            {t("nav.home")}
          </Link>
          <span className="text-[#ccc]">/</span>
          <Link href={localePath(`/country/${country.slug}`)} className="text-[#666] hover:text-[#FF1493] no-underline">
            {country.flag} {country.name}
          </Link>
          <span className="text-[#ccc]">/</span>
          <span className="text-[#1a1a1a] font-semibold">#{card.number}</span>
        </div>
      </div>

      {/* Main Phrase Card */}
      <section className="py-8 md:py-14">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-6">
              <span className="text-5xl mb-2 block">{country.flag}</span>
              <h1 className="font-display text-3xl md:text-4xl text-[#1a1a1a]">
                {country.name} — {isZhTw ? "片語" : "Phrase"} #{card.number}
              </h1>
            </div>
            <PhraseCard
              card={card}
              country={country}
              isAuthenticated={isAuthenticated}
              memberTier={user?.memberTier}
              userRole={user?.role}
            />
          </motion.div>

          {/* Links */}
          <div className="max-w-2xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={localePath(`/country/${country.slug}`)}
              className="flex items-center gap-2 text-sm font-semibold text-[#FF1493] no-underline hover:underline"
            >
              <ArrowLeft size={14} />
              {isZhTw ? `查看 ${country.name} 的全部 10 個片語` : `See all 10 phrases from ${country.name}`}
            </Link>
            <a
              href={AMAZON_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-4 py-2 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
            >
              <BookOpen size={14} />
              {isZhTw ? "購買書籍解鎖全部 100 國" : "Get the book for all 100 countries"}
            </a>
          </div>
        </div>
      </section>

      {/* Google Map-style Reviews Section */}
      <section className="py-8 md:py-14 bg-[#FAFAFA]">
        <div className="container max-w-2xl mx-auto">
          {/* Rating Summary Header */}
          <div className="bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-6 mb-6">
            <div className="flex items-start gap-6">
              <div className="text-center shrink-0">
                <div className="text-5xl font-bold text-[#1a1a1a]">
                  {totalRatings > 0 ? avgRating.toFixed(1) : "—"}
                </div>
                <StarDisplay value={avgRating} size={16} />
                <div className="text-xs text-gray-500 mt-1">
                  {totalRatings} {isZhTw ? "個評分" : (totalRatings === 1 ? "rating" : "ratings")}
                </div>
              </div>
              <div className="flex-1">
                <RatingBreakdown ratings={ratingBreakdown} />
                {totalReviews === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    {isZhTw ? "還沒有評論。成為第一個！" : "No reviews yet. Be the first!"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Write a Review */}
          <div className="bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-6 mb-6">
            <h3 className="font-display text-xl text-[#1a1a1a] mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              {isZhTw ? "撰寫評論" : "Write a Review"}
            </h3>

            {!isAuthenticated ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">
                  {isZhTw ? "登入即可撰寫評論" : "Sign in to leave a review"}
                </p>
                <a
                  href={getLoginUrl()}
                  className="inline-flex items-center gap-2 bg-[#FF1493] text-white px-6 py-2 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                >
                  {t("nav.signIn")}
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{isZhTw ? "你的評分：" : "Your rating:"}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setReviewRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={24}
                          className={
                            s <= (hoverRating || reviewRating)
                              ? "fill-[#FFE500] text-[#FFE500]"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={isZhTw ? "分享你對這個片語的看法...好用嗎？有趣嗎？你試過嗎？" : "Share your experience with this phrase... Was it useful? Funny? Did you try it?"}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm resize-none focus:border-[#FF1493] focus:outline-none transition-colors"
                  rows={3}
                  maxLength={2000}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{reviewText.length}/2000</span>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!reviewText.trim() || createReviewMutation.isPending}
                    className="flex items-center gap-2 bg-[#FF1493] text-white px-5 py-2 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                    {createReviewMutation.isPending ? (isZhTw ? "發布中..." : "Posting...") : (isZhTw ? "發布評論" : "Post Review")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Review List */}
          <div className="space-y-4">
            <h3 className="font-display text-xl text-[#1a1a1a] flex items-center gap-2">
              <MessageSquare size={20} />
              {isZhTw ? `評論 (${totalReviews})` : `Reviews (${totalReviews})`}
            </h3>

            {reviewItems.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
                <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">
                  {isZhTw ? "還沒有評論。成為第一個分享想法的人！" : "No reviews yet. Be the first to share your thoughts!"}
                </p>
              </div>
            ) : (
              reviewItems.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF1493] to-[#00CED1] flex items-center justify-center shrink-0">
                      <UserIcon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#1a1a1a]">
                          {review.authorName || (isZhTw ? "匿名" : "Anonymous")}
                        </span>
                        <StarDisplay value={review.rating} size={12} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        <TimeAgo date={review.createdAt} isZhTw={isZhTw} />
                      </div>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Phrases */}
      {relatedPhrases.length > 0 && (
        <section className="py-10 md:py-16">
          <div className="container">
            <h2 className="font-display text-2xl md:text-3xl text-[#1a1a1a] mb-6 text-center">
              {isZhTw ? `其他國家的「${card.type}」` : `More "${card.type}" from Other Countries`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {relatedPhrases.map(({ country: rc, card: rcard }) => (
                <PhraseCard
                  key={`${rc.slug}-${rcard.number}`}
                  card={rcard}
                  country={rc}
                  compact
                  showCountryLink
                  isAuthenticated={isAuthenticated}
                  memberTier={user?.memberTier}
                  userRole={user?.role}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contextual Book CTA */}
      <section className="py-10 bg-[#1a1a1a]">
        <div className="container text-center max-w-2xl mx-auto">
          <p className="text-gray-400 text-sm mb-2">
            {isZhTw
              ? `你剛看了 ${country.name} 的「${card.type}」——書中還有 99 個國家的同類型片語。`
              : `You just read ${country.name}'s "${card.type}" — the book has the same category for 99 more countries.`}
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
