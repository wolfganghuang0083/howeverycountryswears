import { Card, getRiskColor, type Country, SITE_DOMAIN, isLockedContent } from "@/lib/data";
import { playPronunciation, shareToTwitter, shareToFacebook, shareToWhatsApp } from "@/lib/pronunciation";
import { Volume2, Lock, Star, Link2, Twitter, Facebook, MessageCircle } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/LocaleContext";
import { trackPhrasePlay, trackPhraseShare, trackPhraseRate, trackFirstPlay, trackFirstShare, trackPaywallView } from "@/lib/analytics";
import JoinFree from "@/components/JoinFree";

interface PhraseCardProps {
  card: Card;
  country: Country;
  compact?: boolean;
  showCountryLink?: boolean;
  isAuthenticated?: boolean;
  memberTier?: string;
  userRole?: string;
  avgRating?: number;
  totalRatings?: number;
  userRating?: number;
  /** If true, show as a clickable card that links to detail page */
  linkToDetail?: boolean;
  /** Number of reviews for this card */
  reviewCount?: number;
  /** If true, allow playing pronunciation without authentication (for homepage free preview) */
  freePreview?: boolean;
}

export default function PhraseCard({
  card,
  country,
  compact = false,
  showCountryLink = false,
  isAuthenticated = false,
  memberTier = "regular",
  userRole = "user",
  avgRating,
  totalRatings,
  userRating: initialUserRating,
  linkToDetail = false,
  reviewCount,
  freePreview = false,
}: PhraseCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showJoinFree, setShowJoinFree] = useState(false);
  const [currentUserRating, setCurrentUserRating] = useState(initialUserRating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (!showJoinFree) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowJoinFree(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showJoinFree]);

  const riskColor = getRiskColor(card.risk);
  const { locale, t, localePath } = useLocale();
  const isZhTw = locale === "zh-tw";

  const isAdmin = userRole === "admin";
  const isBookBuyer = memberTier === "bookBuyer" || isAdmin;
  const isLocked = isLockedContent(country.part_id, country.slug);

  const canPlay = freePreview || (isAuthenticated && (isBookBuyer || !isLocked));
  const canRate = isAuthenticated;

  const rateMutation = trpc.rating.rate.useMutation();
  const listenMutation = trpc.tracking.listenPhrase.useMutation();

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!freePreview && !isAuthenticated) { setShowJoinFree(true); trackPaywallView({ country: country.slug, context: "phrase_card" }); return; }
    if (!freePreview && isLocked && !isBookBuyer) { setShowJoinFree(true); trackPaywallView({ country: country.slug, context: "phrase_card" }); return; }
    setIsPlaying(true);
    playPronunciation(card.phrase, country.lang_code);
    trackPhrasePlay({ country: country.slug, phrase_index: card.number, is_free_preview: freePreview, is_locked: isLocked });
    trackFirstPlay();
    if (isAuthenticated) {
      listenMutation.mutate({ countrySlug: country.slug, cardNumber: card.number });
    }
    setTimeout(() => setIsPlaying(false), 2000);
  }, [card.phrase, country.lang_code, country.slug, card.number, isAuthenticated, isLocked, isBookBuyer, freePreview, listenMutation]);

  const handleRate = useCallback((value: number) => {
    if (!isAuthenticated) { setShowJoinFree(true); return; }
    setCurrentUserRating(value);
    rateMutation.mutate({ countrySlug: country.slug, cardNumber: card.number, value });
    trackPhraseRate({ country: country.slug, phrase_index: card.number, rating_value: value });
  }, [country.slug, card.number, isAuthenticated, rateMutation]);

  const anchorId = `phrase-${card.number}`;
  const phraseAnchorUrl = `${SITE_DOMAIN}/country/${country.slug}#${anchorId}`;
  const phrasePageUrl = `${SITE_DOMAIN}/phrase/${country.slug}-${card.number}`;
  const detailPath = localePath(`/phrase/${country.slug}-${card.number}`);

  const typeTag = card.type;
  const shareText = isZhTw
    ? `你知道${country.name}的[${typeTag}]髒話是什麼嗎？超過100個國家的髒話都在這裡！`
    : `Do you know what ${country.name}'s [${typeTag}] swear word is? Over 100 countries' swear words are all here!`;
  const shareUrl = phrasePageUrl;

  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(phraseAnchorUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = phraseAnchorUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [phraseAnchorUrl]);

  // Round icon button component
  const IconBtn = ({ onClick, title, children, highlight }: { onClick: (e: React.MouseEvent) => void; title: string; children: React.ReactNode; highlight?: boolean }) => (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#1a1a1a] transition-all shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[0px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] ${
        highlight ? "bg-green-400 text-white" : "bg-white text-[#666] hover:bg-[#FF1493] hover:text-white"
      }`}
    >
      {children}
    </button>
  );

  const joinFreeModal = (
    <JoinFree
      variant="modal"
      open={showJoinFree}
      onOpenChange={setShowJoinFree}
      surface="graycard"
      ctaId="graycard_join"
      country={country.slug}
      headline="Unlock more phrases — join free"
      microcopy="Free email membership. No payment. Unsubscribe anytime."
      enabled={!isZhTw}
      locale={locale}
      sourcePath={localePath(`/country/${country.slug}`)}
    />
  );

  const cardContent = (
    <div
      id={anchorId}
      className={`bg-white rounded-lg border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden transition-all hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] relative ${linkToDetail ? "cursor-pointer" : ""}`}
    >
      <div className="flex">
        <div className="w-2 shrink-0" style={{ backgroundColor: riskColor }} />
        <div className="flex-1 p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{card.emoji}</span>
              <span className="font-bold text-xs uppercase tracking-wider text-[#666]">
                #{card.number} {card.type}
              </span>
              {showCountryLink && !linkToDetail && (
                <Link href={localePath(`/country/${country.slug}`)} className="text-xs font-semibold text-[#FF1493] no-underline hover:underline">
                  {country.flag} {country.name}
                </Link>
              )}
              {showCountryLink && linkToDetail && (
                <span className="text-xs font-semibold text-[#FF1493]">
                  {country.flag} {country.name}
                </span>
              )}
            </div>
            {/* Compact rating display */}
            {avgRating !== undefined && totalRatings !== undefined && totalRatings > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#FFF8E1] px-2 py-0.5 rounded-full border border-[#FFE500]">
                  <Star size={12} className="fill-[#FFE500] text-[#FFE500]" />
                  <span className="text-xs font-bold text-[#1a1a1a]">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-[#999]">({totalRatings})</span>
                </div>
                {reviewCount !== undefined && reviewCount > 0 && (
                  <div className="flex items-center gap-1 bg-[#F0F0F0] px-2 py-0.5 rounded-full border border-gray-300">
                    <MessageCircle size={10} className="text-[#666]" />
                    <span className="text-xs text-[#666]">{reviewCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phrase */}
          <h3 className="font-noto text-xl md:text-2xl font-bold text-[#1a1a1a] mb-1 leading-tight">
            {card.phrase}
          </h3>

          {/* IPA + ENLARGED Play button */}
          <div className="flex items-center gap-4 mb-4">
            <span className="font-ipa text-sm text-[#666]">{card.ipa}</span>
            <button
              onClick={handlePlay}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold border-3 border-[#1a1a1a] transition-all shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] ${
                isPlaying
                  ? "bg-[#FF1493] text-white scale-110 shadow-[1px_1px_0px_#1a1a1a]"
                  : canPlay
                    ? "bg-[#FFE500] text-[#1a1a1a] hover:bg-[#FF1493] hover:text-white"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
              }`}
            >
              {canPlay ? <Volume2 size={24} className={isPlaying ? "animate-pulse" : ""} /> : <Lock size={20} />}
              {isPlaying ? (isZhTw ? "播放中..." : "Playing...") : t("card.play")}
            </button>
          </div>

          {!compact && (
            <>
              <div className="mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#999]">{t("card.literal")}: </span>
                <span className="text-sm text-[#333]">{card.literal}</span>
              </div>
              <div className="mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#999]">{t("card.feelsLike")}: </span>
                <span className="text-sm text-[#555] leading-relaxed">{card.feels_like}</span>
              </div>
            </>
          )}

          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {card.status && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">{card.status}</span>
            )}
            {card.register && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">{card.register}</span>
            )}
            <span className="px-2 py-0.5 rounded-full text-xs font-bold border" style={{ backgroundColor: riskColor + "15", color: riskColor, borderColor: riskColor + "40" }}>
              {card.risk}
            </span>
          </div>

          {/* Star Rating - interactive (only on non-compact, non-linkToDetail) */}
          {!compact && !linkToDetail && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRate(star); }}
                    onMouseEnter={() => canRate && setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`transition-all ${canRate ? "cursor-pointer hover:scale-125" : "cursor-default"}`}
                    disabled={!canRate && isAuthenticated}
                  >
                    <Star size={18} className={`transition-colors ${(hoverRating || currentUserRating) >= star ? "fill-[#FFE500] text-[#FFE500]" : "fill-none text-gray-300"}`} />
                  </button>
                ))}
              </div>
              {!isAuthenticated && (
                <button onClick={(e) => { e.stopPropagation(); setShowPaywall(true); }} className="text-xs text-[#FF1493] font-semibold hover:underline">
                  {isZhTw ? "登入即可評分" : "Sign in to rate"}
                </button>
              )}
            </div>
          )}

          {/* Round icon action buttons */}
          {!compact && (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <IconBtn onClick={(e) => { handleCopyLink(e); trackPhraseShare({ country: country.slug, phrase_index: card.number, platform: "copy" }); trackFirstShare(); }} title={copied ? t("card.copyLink") : (isZhTw ? "複製連結" : "Copy Link")} highlight={copied}>
                <Link2 size={16} />
              </IconBtn>
              <IconBtn onClick={(e) => { e.stopPropagation(); e.preventDefault(); shareToTwitter(shareText, shareUrl); trackPhraseShare({ country: country.slug, phrase_index: card.number, platform: "twitter" }); trackFirstShare(); }} title={isZhTw ? "分享到 X / Twitter" : "Share on X / Twitter"}>
                <Twitter size={16} />
              </IconBtn>
              <IconBtn onClick={(e) => { e.stopPropagation(); e.preventDefault(); shareToFacebook(shareUrl, shareText); trackPhraseShare({ country: country.slug, phrase_index: card.number, platform: "facebook" }); trackFirstShare(); }} title={isZhTw ? "分享到 Facebook" : "Share on Facebook"}>
                <Facebook size={16} />
              </IconBtn>
              <IconBtn onClick={(e) => { e.stopPropagation(); e.preventDefault(); shareToWhatsApp(shareText, shareUrl); trackPhraseShare({ country: country.slug, phrase_index: card.number, platform: "whatsapp" }); trackFirstShare(); }} title={isZhTw ? "分享到 WhatsApp" : "Share on WhatsApp"}>
                <MessageCircle size={16} />
              </IconBtn>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If linkToDetail, wrap in a Link — portal modal stays outside Link
  if (linkToDetail) {
    return (
      <>
        <Link href={detailPath} className="no-underline block">
          {cardContent}
        </Link>
        {joinFreeModal}
      </>
    );
  }

  return (
    <>
      {cardContent}
      {joinFreeModal}
    </>
  );
}
