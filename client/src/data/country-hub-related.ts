/**
 * Anglo related-reading + soft Book CTA on HOT country hubs.
 * Handoff: kdp-s1/traffic/blog-drafts/2026-09-24_HECS_Anglo_related_on_hot_country_pages.md
 *
 * IA: max 2 related blog cards + 1 Book CTA. Do NOT link Wave A #25/#27/#29/#30.
 * Only `status: "live"` hubs render; `pending` = queued until sitemap-confirmed.
 */

export type CountryHubRelatedCardId = "08" | "09" | "07";

export type CountryHubRelatedCard = {
  id: CountryHubRelatedCardId;
  slug: string;
  title: string;
  blurb: string;
  chip: string;
};

/** Paste-ready EN card copy (§4 handoff). */
export const COUNTRY_HUB_RELATED_CARDS: Record<
  CountryHubRelatedCardId,
  CountryHubRelatedCard
> = {
  "08": {
    id: "08",
    slug: "how-to-read-hecs-country-page",
    title: "How to Read a HECS Country Page",
    blurb:
      "Risk lamps, register, and IPA have a reading order — skip the funny gloss first so you study the map, not a green light.",
    chip: "Read the card order",
  },
  "09": {
    id: "09",
    slug: "hear-swear-phrase-tap-to-listen-ipa",
    title: "How to Hear Any Swear Phrase (Tap-to-Listen + IPA)",
    blurb:
      "Train the ear with sound maps before mouth-shapes — hearing is literacy; performance is still Friendly Fire.",
    chip: "Hear before you guess",
  },
  "07": {
    id: "07",
    slug: "recognition-not-permission-study-profanity",
    title: "Recognition ≠ Permission",
    blurb:
      "Studying a taboo map is not a license to perform it — keep the brake on while you explore this country page.",
    chip: "Keep the brake on",
  },
};

export const BOOK_CTA_ASIN = "B0GSGZ3ZJZ";

export type CountryHubBookCta = {
  heading: string;
  title: string;
  blurb: string;
  buttonLabel: string;
  asin: string;
};

export const DEFAULT_BOOK_CTA: CountryHubBookCta = {
  heading: "Prefer the full guide in one place?",
  title: "How Every Country Swears (EN Kindle)",
  blurb:
    "The full recognition companion — risk-labeled maps and hear-first literacy, not a roast kit.",
  buttonLabel: "View on Amazon",
  asin: BOOK_CTA_ASIN,
};

export type CountryHubStatus = "live" | "pending";

export type CountryHubRelatedConfig = {
  status: CountryHubStatus;
  relatedHeading: string;
  /** Max 2 card ids (IA). */
  relatedCardIds: [CountryHubRelatedCardId, CountryHubRelatedCardId];
  bookCta?: CountryHubBookCta;
  /** Optional method chip (does not count against related-2). */
  methodChipId?: CountryHubRelatedCardId;
};

/**
 * Hang now (live): fiji, new-zealand, uzbekistan, afghanistan.
 * Queue (pending): tunisia, samoa, algeria — exotic pack when sitemap-confirmed.
 */
export const COUNTRY_HUB_RELATED: Record<string, CountryHubRelatedConfig> = {
  fiji: {
    status: "live",
    relatedHeading: "Related reading for this country map",
    relatedCardIds: ["08", "09"],
    methodChipId: "07",
  },
  "new-zealand": {
    status: "live",
    relatedHeading:
      "Related reading — how to use this kiwi map without Friendly Fire",
    relatedCardIds: ["08", "07"],
  },
  uzbekistan: {
    status: "live",
    relatedHeading: "Related reading for this country map",
    relatedCardIds: ["08", "09"],
  },
  afghanistan: {
    status: "live",
    relatedHeading: "Related reading for this country map",
    relatedCardIds: ["08", "09"],
  },
  // --- Queue (pending): tunisia / samoa / algeria — exotic pack when sitemap-confirmed ---
  tunisia: {
    status: "pending",
    relatedHeading: "Related reading for this country map",
    relatedCardIds: ["08", "09"],
  },
  samoa: {
    status: "pending",
    relatedHeading: "Related reading for this country map",
    relatedCardIds: ["08", "09"],
  },
  algeria: {
    status: "pending",
    relatedHeading: "Related reading for this country map",
    relatedCardIds: ["08", "09"],
  },
};

export function getLiveCountryHubRelated(
  countrySlug: string,
): CountryHubRelatedConfig | null {
  const cfg = COUNTRY_HUB_RELATED[countrySlug];
  if (!cfg || cfg.status !== "live") return null;
  return cfg;
}

export function resolveRelatedCards(
  ids: CountryHubRelatedCardId[],
): CountryHubRelatedCard[] {
  return ids.slice(0, 2).map((id) => COUNTRY_HUB_RELATED_CARDS[id]);
}

export function buildRelatedBlogHref(
  blogSlug: string,
  countrySlug: string,
): string {
  const params = new URLSearchParams({
    utm_source: "hecs_country",
    utm_medium: "related",
    utm_campaign: `${countrySlug}_hub`,
  });
  return `/blog/${blogSlug}/?${params.toString()}`;
}

export function buildBookCtaHref(countrySlug: string, asin = BOOK_CTA_ASIN): string {
  const params = new URLSearchParams({
    utm_source: "hecs_country",
    utm_medium: "book_cta",
    utm_campaign: `${countrySlug}_hub`,
  });
  return `https://www.amazon.com/dp/${asin}?${params.toString()}`;
}
