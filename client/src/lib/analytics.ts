/**
 * GA4 Analytics Module
 * Uses gtag() for direct GA4 event sending
 * Measurement ID: G-GVS8FVW8NN
 *
 * Dual-fire: existing event names stay; P0 v0 aliases fire alongside
 * (see docs/analytics-p0-map.md). Call sites should prefer wrappers below.
 */

import {
  EXPERIMENT_ID_EN_SPHERE,
  VARIANT_ID_PRICE_699,
  UNLOCK_ID_EN_SPHERE,
  SCHEME_A_PRICE,
  type LandingArm,
} from "@shared/schemeAConfig";
import { getClientLandingArm } from "@/lib/schemeAArm";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export const PREVIEW_COUNTRIES = ["egypt", "kenya", "mexico", "samoa"];

const LOGIN_SUCCESS_SESSION_KEY = "hecs_login_success_fired";
/** In-memory guard so parallel useAuth mounts cannot double-fire before sessionStorage writes. */
let loginSuccessFiredThisLoad = false;

function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

/** Infer page_type from pathname for v0 alias params. */
export function getPageTypeFromPath(pathname?: string): string {
  const p =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  if (/\/blog(\/|$)/.test(p)) return "blog";
  if (/\/country\//.test(p)) return "country";
  if (/\/(region|part)\//.test(p)) return "region";
  if (/\/phrase\//.test(p)) return "phrase";
  if (/\/(get-the-book|buy)/.test(p)) return "buy";
  if (/\/about(\/|$)/.test(p)) return "about";
  if (/\/community(\/|$)/.test(p)) return "community";
  if (/\/ranking/.test(p)) return "rankings";
  if (/\/dashboard(\/|$)/.test(p)) return "dashboard";
  if (p === "/" || /^\/(es|zh-tw)\/?$/.test(p)) return "home";
  return "other";
}

// ============================================================
// KEY EVENTS (Conversions)
// ============================================================

/** User completes OAuth sign-up (legacy; prefer trackLoginSuccess for session login) */
export function trackSignUp(method: string = "oauth") {
  trackEvent("sign_up", { method });
}

/**
 * Fire login_success once per browser session when auth first resolves with a user.
 * Does not fire sign_up (first-ever user is unclear from /api/auth/me alone).
 */
export function trackLoginSuccess(params?: {
  method?: string;
  page_type?: string;
}) {
  if (typeof window === "undefined") return;
  if (loginSuccessFiredThisLoad) return;
  try {
    if (sessionStorage.getItem(LOGIN_SUCCESS_SESSION_KEY)) {
      loginSuccessFiredThisLoad = true;
      return;
    }
    sessionStorage.setItem(LOGIN_SUCCESS_SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable — in-memory guard still limits to once per page load
  }
  loginSuccessFiredThisLoad = true;
  trackEvent("login_success", {
    method: params?.method ?? "github",
    page_type: params?.page_type ?? getPageTypeFromPath(),
  });
}

export type PurchaseClickOpts = {
  destination?: string;
  content_id?: string;
  page_type?: string;
};

/** User clicks Amazon / book purchase CTA — dual-fires book_cta_click */
export function trackPurchaseClick(
  context: string,
  country?: string,
  opts?: PurchaseClickOpts,
) {
  const destination = opts?.destination ?? "amazon";
  const page_type = opts?.page_type ?? getPageTypeFromPath();
  const extra: Record<string, unknown> = {};
  if (opts?.content_id) extra.content_id = opts.content_id;

  trackEvent("purchase_click", {
    context,
    country,
    ...extra,
  });
  trackEvent("book_cta_click", {
    cta_id: context,
    context,
    destination,
    country,
    page_type,
    ...extra,
  });
}

/** User views the Buy Book page */
export function trackBookPageView() {
  trackEvent("book_page_view");
}

// ============================================================
// EXPLORATION EVENTS
// ============================================================

/** User plays a phrase pronunciation — dual-fires audio_play */
export function trackPhrasePlay(params: {
  country: string;
  phrase_index: number;
  is_free_preview: boolean;
  is_locked: boolean;
}) {
  trackEvent("phrase_play", params);
  trackEvent("audio_play", {
    content_id: String(params.phrase_index),
    country: params.country,
    page_type: getPageTypeFromPath(),
    phrase_index: params.phrase_index,
  });
}

/** User views a country page — dual-fires country_page_view */
export function trackCountryView(params: {
  country: string;
  part_id: number;
  is_preview_country: boolean;
  is_locked: boolean;
}) {
  trackEvent("country_view", params);
  trackEvent("country_page_view", {
    country: params.country,
    page_path:
      typeof window !== "undefined" ? window.location.pathname : undefined,
    part_id: params.part_id,
    is_preview_country: params.is_preview_country,
    is_locked: params.is_locked,
  });
}

/** User views a region page */
export function trackRegionView(params: {
  region: string;
  part_id: number;
  is_locked: boolean;
}) {
  trackEvent("region_view", params);
}

/** User scrolls to depth milestone on country page */
export function trackCountryScrollDepth(country: string, depthPercent: number) {
  trackEvent("country_scroll_depth", {
    country,
    depth_percent: depthPercent,
  });
}

/**
 * Blog post reached read threshold (30s on page OR 50% scroll).
 * Call once per post view from BlogPostPage.
 */
export function trackBlogRead(params: {
  post_id: string;
  category?: string;
  country?: string;
  read_seconds: number;
}) {
  trackEvent("blog_read", {
    post_id: params.post_id,
    slug: params.post_id,
    category: params.category,
    country: params.country,
    read_seconds: params.read_seconds,
    page_type: "blog",
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
  trackEvent("phrase_share", params);
}

/** User rates a phrase */
export function trackPhraseRate(params: {
  country: string;
  phrase_index: number;
  rating_value: number;
}) {
  trackEvent("phrase_rate", params);
}

/** User uses search */
export function trackSearchUse(searchTerm: string, resultsCount: number) {
  trackEvent("search_use", {
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
  trackEvent("recommendation_click", params);
}

// ============================================================
// PAYWALL EVENTS
// ============================================================

/** User sees locked content — dual-fires gray_card_view (no IntersectionObserver) */
export function trackPaywallView(params: {
  country?: string;
  context: "country_page" | "phrase_card" | "region_page";
}) {
  trackEvent("paywall_view", params);
  trackEvent("gray_card_view", {
    country: params.country,
    page_type: getPageTypeFromPath(),
    card_type: params.context,
    context: params.context,
  });
}

/** User clicks Sign In on paywall */
export function trackPaywallLoginClick(params: {
  country?: string;
  context: "country_page" | "phrase_card" | "region_page";
}) {
  trackEvent("paywall_login_click", params);
}

/** User clicks Get the Book on paywall — dual-fires book_cta_click */
export function trackPaywallBookClick(params: {
  country?: string;
  context: "country_page" | "phrase_card" | "region_page";
  phrases_previewed?: number;
}) {
  trackEvent("paywall_book_click", params);
  trackEvent("book_cta_click", {
    cta_id: params.context,
    context: params.context,
    destination: "amazon",
    country: params.country,
    page_type: getPageTypeFromPath(),
    phrases_previewed: params.phrases_previewed,
  });
}

/** User enters a preview country from a locked region */
export function trackPreviewCountryEntry(params: {
  country: string;
  source_region: string;
}) {
  trackEvent("preview_country_entry", params);
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
        trackEvent("countries_explored_milestone", {
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
    trackEvent("first_play");
  }
}

/** Track first share event */
export function trackFirstShare() {
  const milestones = getMilestones();
  if (!milestones.has("first_share")) {
    saveMilestone("first_share");
    trackEvent("first_share");
  }
}

// ============================================================
// SCHEME A — Recur unlock experiment (locked event names)
// value/currency from SCHEME_A_PRICE (TWD 219); variant_id is label only.
// ============================================================

const EXPOSURE_SESSION_KEY = "hecs_a_en_sphere_exposure";

function schemeABase(arm?: LandingArm) {
  const resolved = arm ?? getClientLandingArm();
  return {
    experiment_id: EXPERIMENT_ID_EN_SPHERE,
    variant_id: VARIANT_ID_PRICE_699,
    unlock_id: UNLOCK_ID_EN_SPHERE,
    arm: resolved,
  };
}

/** Fire experiment_exposure once per browser session when Pack surface or gated Play is shown. */
export function trackExperimentExposure(params?: {
  surface?: "pack_page" | "country_banner" | "gated_play";
  country?: string;
  arm?: LandingArm;
}) {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(EXPOSURE_SESSION_KEY)) return;
    sessionStorage.setItem(EXPOSURE_SESSION_KEY, "1");
  } catch {
    // fall through once if sessionStorage blocked
  }
  trackEvent("experiment_exposure", {
    ...schemeABase(params?.arm),
    surface: params?.surface,
    country: params?.country,
    page_type: getPageTypeFromPath(),
  });
}

export function trackMembershipUnlockClick(params?: {
  country?: string;
  surface?: string;
  arm?: LandingArm;
}) {
  trackEvent("membership_unlock_click", {
    ...schemeABase(params?.arm),
    country: params?.country,
    surface: params?.surface,
    page_type: getPageTypeFromPath(),
  });
}

export function trackBeginCheckout(params?: {
  session_id?: string | null;
  arm?: LandingArm;
}) {
  trackEvent("begin_checkout", {
    ...schemeABase(params?.arm),
    value: SCHEME_A_PRICE.value,
    currency: SCHEME_A_PRICE.currency,
    session_id: params?.session_id ?? undefined,
    page_type: getPageTypeFromPath(),
  });
}

const PURCHASE_SESSION_KEY = "hecs_a_en_sphere_purchase";

/** Fire purchase once per session when success page loads with transaction/session id. */
export function trackPurchaseOnce(params: {
  transaction_id?: string | null;
  session_id?: string | null;
  arm?: LandingArm;
}) {
  if (typeof window === "undefined") return;
  const tid = params.transaction_id || params.session_id || "unknown";
  const key = `${PURCHASE_SESSION_KEY}:${tid}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* continue once */
  }
  trackEvent("purchase", {
    ...schemeABase(params?.arm),
    value: SCHEME_A_PRICE.value,
    currency: SCHEME_A_PRICE.currency,
    transaction_id: tid,
    page_type: "unlock_success",
  });
}

export function trackUnlockOpen(params: {
  country: string;
  phrase_index?: number;
  arm?: LandingArm;
}) {
  trackEvent("unlock_open", {
    ...schemeABase(params?.arm),
    country: params.country,
    phrase_index: params.phrase_index,
    page_type: getPageTypeFromPath(),
  });
}
