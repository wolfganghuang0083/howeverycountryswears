import { BookOpen } from "lucide-react";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import {
  BOOK_CTA_ASIN,
  buildBookCtaHref,
} from "@/data/country-hub-related";
import cta from "@/data/country-inline-cta.json";
import { trackPurchaseClick } from "@/lib/analytics";

export const COUNTRY_INLINE_CTA_SLUGS = cta.slugs;

export type CountryInlineCtaSlug = keyof typeof cta.newsletter.body;

export function isCountryInlineCtaSlug(
  slug: string,
): slug is CountryInlineCtaSlug {
  return (cta.slugs as string[]).includes(slug);
}

type CommonProps = {
  slug: string;
  enabled?: boolean;
};

/**
 * Allowlisted country-page newsletter, placed after the 3rd phrase card.
 * Reuses the blog NewsletterSubscribe / JoinFree flow and newsletter_signup.
 */
export function CountryInlineNewsletter({
  slug,
  enabled = true,
  locale = "en",
}: CommonProps & { locale?: string }) {
  if (!enabled || !isCountryInlineCtaSlug(slug)) return null;
  const body = cta.newsletter.body[slug];
  return (
    <NewsletterSubscribe
      sourcePath={`/country/${slug}`}
      country={slug}
      locale={locale}
      surface="country"
      ctaId="country_inline"
      placement="country_inline"
      headline={cta.newsletter.title}
      microcopy={body}
      submitLabel={cta.newsletter.button}
      privacy={cta.newsletter.finePrint}
      showBookLink={false}
      sectionId={`country-newsletter-${slug}`}
      className="py-0 border-0"
    />
  );
}

/**
 * Allowlisted country-page book CTA, placed after the phrase list.
 * Reuses buildBookCtaHref (ASIN B0GSGZ3ZJZ + existing UTMs) and book_cta_click.
 */
export function CountryInlineBookCta({ slug, enabled = true }: CommonProps) {
  if (!enabled || !isCountryInlineCtaSlug(slug)) return null;
  const href = buildBookCtaHref(slug, cta.book.asin || BOOK_CTA_ASIN);
  return (
    <section
      className="py-10"
      aria-label={cta.book.title}
      data-country-book-cta={slug}
      data-placement="country_bottom"
    >
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <aside
            aria-label={cta.book.title}
            className="rounded-xl border-2 border-[#1a1a1a] bg-[#FAFAFA] shadow-[4px_4px_0px_#1a1a1a] p-5 md:p-6 text-center"
          >
            <h3 className="font-display text-xl md:text-2xl text-[#1a1a1a] mb-2 m-0">
              {cta.book.title}
            </h3>
            <p className="text-sm text-[#555] mb-4 max-w-xl mx-auto leading-relaxed">
              {cta.book.body}
            </p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackPurchaseClick("country_bottom", slug, {
                  destination: "amazon",
                  content_id: cta.book.asin || BOOK_CTA_ASIN,
                  page_type: "country",
                  placement: "country_bottom",
                })
              }
              className="inline-flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-6 py-3 rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
            >
              <BookOpen size={18} />
              {cta.book.button}
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
