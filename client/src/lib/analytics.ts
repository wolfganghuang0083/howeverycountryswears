/**
 * GA4 Analytics Module
 * Uses gtag() for direct GA4 event sending
 * Measurement ID: G-GVS8FVW8NN
 *
 * Dual-fire: existing event names stay; P0 v0 aliases fire alongside
 * (see docs/analytics-p0-map.md). Call sites should prefer wrappers below.
 */

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
// NEWSLETTER / JOIN FREE FUNNEL
// ============================================================

/**
 * Legacy CRM Preview submit event — kept harmless alongside newsletter_signup.
 */
export function trackNewsletterSubscribeSubmit(params: {
  country?: string;
  locale?: string;
  source_path: string;
}) {
  trackEvent("newsletter_subscribe_submit", {
    country: params.country,
    locale: params.locale,
    source_path: params.source_path,
  });
}

/** User clicks Join free CTA (inline / sticky / modal submit button). No PII. */
export function trackNewsletterCtaClick(params: {
  surface: string;
  cta_id: string;
  page_type?: string;
  country?: string;
}) {
  trackEvent("newsletter_cta_click", {
    surface: params.surface,
    cta_id: params.cta_id,
    page_type: params.page_type ?? getPageTypeFromPath(),
    country: params.country,
  });
}

/** Modal opened (graycard / etc). Inline forms do not fire this. */
export function trackNewsletterModalOpen(params: {
  surface: string;
  cta_id: string;
}) {
  trackEvent("newsletter_modal_open", {
    surface: params.surface,
    cta_id: params.cta_id,
  });
}

/** Fired after subscribe API success. No email / PII. */
export function trackNewsletterSignup(params: {
  surface: string;
  cta_id: string;
  method?: string;
  country?: string;
}) {
  trackEvent("newsletter_signup", {
    surface: params.surface,
    cta_id: params.cta_id,
    method: params.method ?? "email",
    country: params.country,
  });
}

/** Audio unlocked via email gate (every successful unlock submit). No PII. */
export function trackAudioUnlock(params: {
  opt_in: boolean;
  surface: string;
  cta_id: string;
  country?: string;
}) {
  trackEvent("audio_unlock", {
    opt_in: params.opt_in,
    surface: params.surface,
    cta_id: params.cta_id,
    country: params.country,
  });
}

/** Fired on /subscribe/confirmed after successful confirm. No PII. */
export function trackNewsletterConfirm(params?: { method?: string }) {
  trackEvent("newsletter_confirm", {
    method: params?.method ?? "email",
  });
}

/** Welcome/service email queued or dry-run previewed. No PII. */
export function trackWelcomeEmailQueued(params: {
  variant: "unlocked" | "optin_welcome";
  surface?: string;
  cta_id?: string;
}) {
  trackEvent("welcome_email_queued", {
    variant: params.variant,
    surface: params.surface,
    cta_id: params.cta_id,
  });
}
