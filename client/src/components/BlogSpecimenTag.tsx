import { useState, useCallback } from "react";
import { Volume2, Lock } from "lucide-react";
import { getPhrase, isLockedContent } from "@/lib/data";
import { playPronunciation } from "@/lib/pronunciation";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import {
  trackPhrasePlay,
  trackFirstPlay,
  trackPaywallView,
} from "@/lib/analytics";
import SignupModal from "@/components/SignupModal";

type Props = {
  country: string;
  number: number;
  sourcePath: string;
  lang?: string;
};

/**
 * Compact inline pronunciation specimen chip for blog body.
 * Locked (gray) → SignupModal; canPlay (yellow) → play audio.
 * Copy locked (Albedo): Hear pronunciation / Recognition map microcopy.
 */
export default function BlogSpecimenTag({
  country,
  number,
  sourcePath,
  lang,
}: Props) {
  const { user, isAuthenticated } = useAuth();
  const { locale } = useLocale();
  const isZhTw = locale === "zh-tw";
  const isEs = lang === "es";

  const hit = getPhrase(country, number, locale);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const listenMutation = trpc.tracking.listenPhrase.useMutation();

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!hit) return;

      const { country: c, card } = hit;
      const memberTier = user?.memberTier || "regular";
      const userRole = user?.role || "user";
      const isAdmin = userRole === "admin";
      const isBookBuyer = memberTier === "bookBuyer" || isAdmin;
      const isLocked = isLockedContent(c.part_id, c.slug);
      const canPlay = isAuthenticated && (isBookBuyer || !isLocked);

      if (!canPlay) {
        if (!(isAuthenticated && isLocked && !isBookBuyer)) {
          setShowSignup(true);
        }
        trackPaywallView({ country: c.slug, context: "blog_specimen_tag" });
        return;
      }

      setIsPlaying(true);
      playPronunciation(card.phrase, c.lang_code);
      trackPhrasePlay({
        country: c.slug,
        phrase_index: card.number,
        is_free_preview: false,
        is_locked: isLocked,
      });
      trackFirstPlay();
      if (isAuthenticated) {
        listenMutation.mutate({
          countrySlug: c.slug,
          cardNumber: card.number,
        });
      }
      setTimeout(() => setIsPlaying(false), 2000);
    },
    [hit, isAuthenticated, user, listenMutation],
  );

  if (!hit) return null;

  const { country: c, card } = hit;
  const memberTier = user?.memberTier || "regular";
  const userRole = user?.role || "user";
  const isAdmin = userRole === "admin";
  const isBookBuyer = memberTier === "bookBuyer" || isAdmin;
  const isLocked = isLockedContent(c.part_id, c.slug);
  const canPlay = isAuthenticated && (isBookBuyer || !isLocked);

  const btnLabel = isPlaying
    ? isEs
      ? "Reproduciendo…"
      : "Playing…"
    : isEs
      ? "Escuchar la pronunciación"
      : "Hear pronunciation";

  const microcopy = isEs
    ? "Mapa de reconocimiento — no es un guion para ofender"
    : "Recognition map — not a how-to-offend script";

  return (
    <>
      <span className="not-prose inline-flex flex-col gap-1 my-3 align-middle max-w-full">
        <span className="inline-flex items-center gap-2 flex-wrap rounded-lg border-2 border-[#1a1a1a] bg-white shadow-[3px_3px_0px_#1a1a1a] px-2.5 py-1.5">
          <span className="font-noto text-sm font-bold text-[#1a1a1a] leading-tight">
            {card.phrase}
          </span>
          <button
            type="button"
            onClick={handlePlay}
            title={btnLabel}
            aria-label={btnLabel}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[#1a1a1a] transition-all shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[0px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] ${
              isPlaying
                ? "bg-[#FF1493] text-white"
                : canPlay
                  ? "bg-[#FFE500] text-[#1a1a1a] hover:bg-[#FF1493] hover:text-white"
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
          >
            {canPlay ? (
              <Volume2 size={14} className={isPlaying ? "animate-pulse" : ""} />
            ) : (
              <Lock size={14} />
            )}
            <span>{btnLabel}</span>
          </button>
        </span>
        <span className="text-[11px] text-[#666] leading-snug pl-0.5">
          {microcopy}
          <span className="text-[#999]"> · Recognition ≠ permission</span>
        </span>
      </span>
      <SignupModal
        open={showSignup}
        onOpenChange={setShowSignup}
        surface="blog"
        ctaId="blog_specimen_tag"
        country={c.slug}
        enabled={!isZhTw}
        locale={locale}
        sourcePath={sourcePath}
      />
    </>
  );
}
