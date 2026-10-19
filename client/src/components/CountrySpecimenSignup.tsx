import { useState } from "react";
import { Sparkles } from "lucide-react";
import BlogSpecimenTag from "@/components/BlogSpecimenTag";
import SignupModal from "@/components/SignupModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { isLockedContent, type Country } from "@/lib/data";

type Props = {
  country: Country;
  sourcePath: string;
  locale: string;
  /** EN-only module (same pattern as SameCountryBlogRelated). */
  enabled?: boolean;
};

const CTA_ID = "country_specimen_card";

/**
 * Pronunciation-card-style free signup entry for country pages.
 * Reuses the #47 BlogSpecimenTag chip: gray (locked) → SignupModal,
 * yellow (canPlay) → plays phrase #1. Join free = free account, no payment.
 */
export default function CountrySpecimenSignup({
  country,
  sourcePath,
  locale,
  enabled = true,
}: Props) {
  const { user, isAuthenticated } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (!enabled || locale !== "en") return null;
  const first = country.cards?.[0];
  if (!first) return null;

  const isAdmin = user?.role === "admin";
  const isBookBuyer = user?.memberTier === "bookBuyer" || isAdmin;
  const isLocked = isLockedContent(country.part_id, country.slug);
  const canPlay = isAuthenticated && (isBookBuyer || !isLocked);

  // Logged-in readers on a book-exclusive country: existing paywall handles it.
  if (isAuthenticated && !canPlay) return null;

  let kicker = "Hear it first";
  let heading = "Read it, then hear it said right";
  let body =
    "Spelling only gets you halfway. A free account plays every phrase across 66 countries — and lets you rate them and see how everyone else did.";
  if (isLocked && !canPlay) {
    heading = "Train your ear before you open the book";
    body = `${country.name}'s full audio set lives in the book. A free account still plays every phrase across 66 countries, so your ear gets a head start.`;
  }
  if (canPlay) {
    kicker = "You're in";
    heading = "Press play — every phrase here talks back";
    body =
      "Your free account plays all 10. Hearing it is for recognizing it, not for testing it on strangers.";
  }

  return (
    <section className="pb-2 pt-0" data-country-specimen-signup={country.slug}>
      <div className="container">
        <div className="max-w-3xl rounded-xl border-2 border-[#1a1a1a] bg-[#FFFDF0] shadow-[4px_4px_0px_#1a1a1a] p-4 md:p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FF1493] m-0 mb-1">
            <Sparkles size={12} />
            {kicker}
          </p>
          <h2 className="font-display text-xl md:text-2xl text-[#1a1a1a] leading-tight m-0 mb-1.5">
            {heading}
          </h2>
          <p className="text-sm text-[#555] leading-relaxed m-0">{body}</p>
          <div className="mt-1">
            <BlogSpecimenTag
              country={country.slug}
              number={first.number}
              sourcePath={sourcePath}
              surface="country"
              ctaId={CTA_ID}
              hideMicrocopy
            />
          </div>
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="inline-flex items-center justify-center gap-2 bg-[#FF1493] text-white px-5 py-2.5 rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Join free
              </button>
              <span className="text-xs text-[#777] leading-snug">
                Free. Unsubscribe anytime. We never sell your email.
              </span>
            </div>
          ) : null}
          <p className="text-[11px] text-[#999] leading-snug m-0 mt-3">
            Recognition map — not a how-to-offend script · Recognition ≠ permission
          </p>
        </div>
      </div>
      <SignupModal
        open={showSignup}
        onOpenChange={setShowSignup}
        surface="country"
        ctaId={CTA_ID}
        country={country.slug}
        enabled
        locale={locale}
        sourcePath={sourcePath}
      />
    </section>
  );
}
