import PhraseCard from "@/components/PhraseCard";
import { useAuth } from "@/_core/hooks/useAuth";
import { getPhrase } from "@/lib/data";
import {
  MAX_BLOG_PHRASE_EMBEDS,
  type BlogPhraseEmbed,
} from "@/lib/blog";
import { useLocale } from "@/contexts/LocaleContext";
import { useMemo } from "react";

/**
 * Frontmatter-driven PhraseCard embeds for blog posts.
 * Recognition specimens only — not a how-to / inventory dump.
 * Hard cap: MAX_BLOG_PHRASE_EMBEDS (3).
 */
export default function BlogPhraseEmbeds({
  embeds,
  lang,
}: {
  embeds: BlogPhraseEmbed[];
  lang?: string;
}) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { locale } = useLocale();

  const capped = useMemo(
    () => (embeds || []).slice(0, MAX_BLOG_PHRASE_EMBEDS),
    [embeds],
  );

  const resolved = useMemo(() => {
    const out: NonNullable<ReturnType<typeof getPhrase>>[] = [];
    for (const e of capped) {
      const hit = getPhrase(e.country, e.number, locale);
      if (hit) out.push(hit);
    }
    return out;
  }, [capped, locale]);

  if (!capped.length) return null;
  if (!authLoading && resolved.length === 0) return null;

  const isEs = lang === "es";
  const heading = isEs
    ? "Especímenes de reconocimiento"
    : "Recognition specimens";
  const lede = isEs
    ? "Reconocimiento ≠ permiso. Especímenes etiquetados para oír el mapa — no un guion ni un inventario."
    : "Recognition ≠ permission. Labeled specimens for hearing the map — not a script or an inventory dump.";

  const skeletonCount = Math.max(resolved.length, capped.length);

  return (
    <section
      id="phrase-embeds"
      aria-label={heading}
      className="mt-12 pt-8 border-t-2 border-[#1a1a1a] scroll-mt-24"
    >
      <h2 className="font-display text-2xl text-[#1a1a1a] mb-2">{heading}</h2>
      <p className="text-sm text-[#555] mb-4 leading-relaxed">{lede}</p>
      <div className="space-y-4">
        {authLoading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="rounded-lg border-2 border-[#1a1a1a] bg-[#FAFAFA] animate-pulse"
                style={{ minHeight: 148 }}
                aria-hidden
              />
            ))
          : resolved.map(({ country, card }) => (
              <PhraseCard
                key={`${country.slug}-${card.number}`}
                card={card}
                country={country}
                compact
                showCountryLink
                isAuthenticated={isAuthenticated}
                memberTier={user?.memberTier}
                userRole={user?.role}
              />
            ))}
      </div>
    </section>
  );
}
