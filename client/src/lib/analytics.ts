/**
 * GA4 Analytics Module
 * Uses dataLayer.push() for GTM integration
 * All events are forwarded to GA4 via GTM Configuration Tag
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export const PREVIEW_COUNTRIES = ["egypt", "kenya", "mexico", "samoa"];

function pushEvent(eventName: string, params?: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params,
  });
}

// ============================================================
// KEY EVENTS (Conversions)
// ============================================================

/** User completes OAuth sign-up */
export function trackSignUp(method: string = "oauth") {
  pushEvent("sign_up", { method });
}

/** User clicks Amazon purchase link */
export function trackPurchaseClick(context: string, country?: string) {
  pushEvent("purchase_click", {
    context, // e.g. "country_page", "paywall", "buy_page", "footer", "hero"
    country,
  });
}

/** User views the Buy Book page */
export function trackBookPageView() {
  pushEvent("book_page_view");
}

// ============================================================
// EXPLORATION EVENTS
// ============================================================

/** User plays a phrase pronunciation */
export function trackPhrasePlay(params: {
  country: string;
  phrase_index: number;
  is_free_preview: boolean;
  is_locked: boolean;
}) {
  pushEvent("phrase_play", params);
}

/** User views a country page */
export function trackCountryView(params: {
  country: string;
  part_id: number;
  is_preview_country: boolean;
  is_locked: boolean;
}) {
  pushEvent("country_view", params);
}

/** User views a region page */
export function trackRegionView(params: {
  region: string;
  part_id: number;
  is_locked: boolean;
}) {
  pushEvent("region_view", params);
}

/** User scrolls to depth milestone on country page */
export function trackCountryScrollDepth(country: string, depthPercent: number) {
  pushEvent("country_scroll_depth", {
    country,
    depth_percent: depthPercent,
  });
}

// ============================================================
// INTERACTION & SOCIAL EVENTS
// ============================================================

/** User shares a phrase */
export function trackPhraseShare(params: {
  country: string;
  phrase_index: number;
  platform: "twitter" | "facebook" | "whatsapp" | "copy";
}) {
  pushEvent("phrase_share", params);
}

/** User rates a phrase */
export function trackPhraseRate(params: {
  country: string;
  phrase_index: number;
  rating_value: number;
}) {
  pushEvent("phrase_rate", params);
}

/** User uses search */
export function trackSearchUse(searchTerm: string, resultsCount: number) {
  pushEvent("search_use", {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

/** User clicks a recommendation card */
export function trackRecommendationClick(params: {
  from_country: string;
  to_country: string;
  recommendation_type: "same_region" | "similar_style" | "contrast";
}) {
  pushEvent("recommendation_click", params);
}

// ============================================================
// PAYWALL EVENTS
// ============================================================

/** User sees locked content */
export function trackPaywallView(params: {
  country?: string;
  context: "country_page" | "phrase_card" | "region_page";
}) {
  pushEvent("paywall_view", params);
}

/** User clicks Sign In on paywall */
export function trackPaywallLoginClick(params: {
  country?: string;
  context: "country_page" | "phrase_card" | "region_page";
}) {
  pushEvent("paywall_login_click", params);
}

/** User clicks Get the Book on paywall */
export function trackPaywallBookClick(params: {
  country?: string;
  context: "country_page" | "phrase_card" | "region_page";
  phrases_previewed?: number;
}) {
  pushEvent("paywall_book_click", params);
}

/** User enters a preview country from a locked region */
export function trackPreviewCountryEntry(params: {
  country: string;
  source_region: string;
}) {
  pushEvent("preview_country_entry", params);
}

// ============================================================
// MILESTONE EVENTS
// ============================================================

const MILESTONE_KEY = "hecs_milestones";

function getMilestones(): Set<string> {
  try {
    const stored = localStorage.getItem(MILESTONE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveMilestone(key: string) {
  const milestones = getMilestones();
  milestones.add(key);
  try {
    localStorage.setItem(MILESTONE_KEY, JSON.stringify([...milestones]));
  } catch {
    // localStorage unavailable
  }
}

/** Track countries explored milestone (3, 5, 10, 20) */
export function trackCountriesExploredMilestone(count: number) {
  const thresholds = [3, 5, 10, 20];
  for (const threshold of thresholds) {
    if (count >= threshold) {
      const key = `countries_${threshold}`;
      const milestones = getMilestones();
      if (!milestones.has(key)) {
        saveMilestone(key);
        pushEvent("countries_explored_milestone", {
          milestone_count: threshold,
          actual_count: count,
        });
      }
    }
  }
}

/** Track first play event */
export function trackFirstPlay() {
  const milestones = getMilestones();
  if (!milestones.has("first_play")) {
    saveMilestone("first_play");
    pushEvent("first_play");
  }
}

/** Track first share event */
export function trackFirstShare() {
  const milestones = getMilestones();
  if (!milestones.has("first_share")) {
    saveMilestone("first_share");
    pushEvent("first_share");
  }
}
