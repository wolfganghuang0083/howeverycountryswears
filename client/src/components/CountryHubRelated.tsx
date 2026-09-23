import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import {
  DEFAULT_BOOK_CTA,
  buildBookCtaHref,
  buildRelatedBlogHref,
  getLiveCountryHubRelated,
  resolveRelatedCards,
  COUNTRY_HUB_RELATED_CARDS,
  type CountryHubRelatedCard,
} from "@/data/country-hub-related";
import { trackPurchaseClick } from "@/lib/analytics";

type Props = {
  countrySlug: string;
  /** EN-only for this module; hide on zh-tw if false. Default true for EN hubs. */
  enabled?: boolean;
};

function RelatedCard({
  card,
  countrySlug,
}: {
  card: CountryHubRelatedCard;
  countrySlug: string;
}) {
  const href = buildRelatedBlogHref(card.slug, countrySlug);
  return (
    <Link
      href={href}
      className="block no-underline rounded-xl border-2 border-[#1a1a1a] bg-white shadow-[3px_3px_0px_#1a1a1a] p-4 hover:bg-[#FFF0F5] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
    >
      <span className="font-bold text-[#1a1a1a] text-base leading-snug group-hover:text-[#FF1493] transition-colors">
        {card.title}
      </span>
      <p className="text-sm text-[#555] mt-1.5 mb-3 leading-relaxed">{card.blurb}</p>
      <span className="inline-block text-xs font-bold no-underline bg-[#FFE500] border-2 border-[#1a1a1a] rounded-full px-3 py-1 shadow-[2px_2px_0px_#1a1a1a]">
        {card.chip}
      </span>
    </Link>
  );
}

/**
 * Related reading (≤2) + soft Book CTA for selected country hubs.
 * Renders only when config status is `live` (fiji / new-zealand).
 */
export default function CountryHubRelated({ countrySlug, enabled = true }: Props) {
  if (!enabled) return null;
  const cfg = getLiveCountryHubRelated(countrySlug);
  if (!cfg) return null;

  const cards = resolveRelatedCards(cfg.relatedCardIds);
  const book = cfg.bookCta ?? DEFAULT_BOOK_CTA;
  const bookHref = buildBookCtaHref(countrySlug, book.asin);
  const methodChip = cfg.methodChipId
    ? COUNTRY_HUB_RELATED_CARDS[cfg.methodChipId]
    : null;

  return (
    <section className="py-10 border-t border-gray-200" aria-label={cfg.relatedHeading}>
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-display text-2xl md:text-3xl text-[#1a1a1a] mb-6 text-center">
            {cfg.relatedHeading}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {cards.map((card) => (
              <RelatedCard key={card.slug} card={card} countrySlug={countrySlug} />
            ))}
          </div>

          {methodChip ? (
            <div className="flex justify-center mb-8">
              <Link
                href={buildRelatedBlogHref(methodChip.slug, countrySlug)}
                className="inline-flex items-center gap-2 text-sm font-bold no-underline bg-[#FFF0F5] border-2 border-[#1a1a1a] rounded-full px-4 py-1.5 shadow-[2px_2px_0px_#1a1a1a] hover:bg-[#FFE500] transition-colors"
              >
                {methodChip.chip}
                <span className="text-[#666] font-semibold">· {methodChip.title}</span>
              </Link>
            </div>
          ) : null}

          <aside
            aria-label={book.heading}
            className="rounded-xl border-2 border-[#1a1a1a] bg-[#FAFAFA] shadow-[4px_4px_0px_#1a1a1a] p-5 md:p-6 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#999] mb-2">
              {book.heading}
            </p>
            <h4 className="font-display text-xl md:text-2xl text-[#1a1a1a] mb-2 m-0">
              {book.title}
            </h4>
            <p className="text-sm text-[#555] mb-4 max-w-xl mx-auto leading-relaxed">
              {book.blurb}
            </p>
            <a
              href={bookHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackPurchaseClick("country_hub_book_cta", countrySlug, {
                  destination: "amazon",
                  content_id: book.asin,
                  page_type: "country",
                })
              }
              className="inline-flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-6 py-3 rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
            >
              <BookOpen size={18} />
              {book.buttonLabel}
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
