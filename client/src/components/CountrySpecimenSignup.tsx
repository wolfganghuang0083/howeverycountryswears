import { useState } from "react";
import { Sparkles } from "lucide-react";
import BlogSpecimenTag from "@/components/BlogSpecimenTag";
import SignupModal from "@/components/SignupModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { getAllCountries, isLockedContent, type Country } from "@/lib/data";
import { canPlayAudio } from "@/lib/audioAccess";

export {
  FREE_COUNTRY_COUNT,
  BOOK_EXCLUSIVE_SIGNUP_TITLE,
  BOOK_EXCLUSIVE_SIGNUP_AUDIO_NOTE,
} from "@/lib/signupCopy";
import { FREE_COUNTRY_COUNT, BOOK_EXCLUSIVE_SIGNUP_TITLE, BOOK_EXCLUSIVE_SIGNUP_AUDIO_NOTE } from "@/lib/signupCopy";

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
  const canPlay = canPlayAudio({ isLocked, isBookBuyer });

  // Logged-in readers on a book-exclusive country: existing paywall handles it.
  if (isAuthenticated && !canPlay) return null;

  let kicker = "Hear it first";
  let heading = "Read it, then hear it said right";
  let body =
    "Spelling only gets you halfway. Tap play on any phrase here — no account needed. Join free if you'd like to rate phrases and see how everyone else rated them.";
  const bookExclusiveLoggedOut = isLocked && !isAuthenticated;
  if (isLocked && !canPlay) {
    heading = "Train your ear before you open the book";
    // Book-exclusive audio still needs the book (bookBuyer).
    body = `${country.name}'s full audio set lives in the book. Every phrase in the ${FREE_COUNTRY_COUNT} free countries plays right here, no account needed, so your ear gets a head start.`;
  }
  if (isAuthenticated && canPlay) {
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
          {bookExclusiveLoggedOut ? (
            <p className="text-xs font-semibold text-[#777] leading-snug m-0 mt-3 mb-3">
              {country.name} audio unlocks with the book, not with a free account.
            </p>
          ) : (
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
          )}
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
        titleOverride={bookExclusiveLoggedOut ? BOOK_EXCLUSIVE_SIGNUP_TITLE : undefined}
        audioNoteOverride={
          bookExclusiveLoggedOut ? BOOK_EXCLUSIVE_SIGNUP_AUDIO_NOTE : undefined
        }
      />
    </section>
  );
}
