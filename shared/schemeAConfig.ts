/**
 * Scheme A — English Sphere Pack
 * SINGLE source for price, currency, experiment ids, landing arms, and Pack/CTA copy.
 * Commercial source: /workspace/hecs-commercial/hecs-landing-arms-v0.html (Albedo 2026-09-24).
 *
 * Default arm A = node_traffic (formal). Arm B = feature_unlock (control only).
 * Switch: ?arm=node_traffic|feature_unlock  OR  VITE_HECS_LANDING_ARM
 * Price is engineering placeholder only — not brand-final. Product name deferred.
 */

export const EN_SPHERE_COUNTRIES = [
  "united-states",
  "united-kingdom",
  "australia",
] as const;

export type EnSphereCountry = (typeof EN_SPHERE_COUNTRIES)[number];

export const UNLOCK_ID_EN_SPHERE = "pack_en_sphere" as const;
export const EXPERIMENT_ID_EN_SPHERE = "hecs_a_en_sphere_v0" as const;
/** Experiment label only — not the charge amount / value narrative. */
export const VARIANT_ID_PRICE_699 = "price_699" as const;

export type LandingArm = "node_traffic" | "feature_unlock";
export const DEFAULT_LANDING_ARM: LandingArm = "node_traffic";
export const LANDING_ARMS = ["node_traffic", "feature_unlock"] as const;

/** Placeholder Recur product id; override with RECUR_PRODUCT_ID_EN_SPHERE. Never reuse huabiz ecard ids. */
export const RECUR_PRODUCT_ID_PLACEHOLDER = "REPLACE_ME_HECS_EN_SPHERE";

/**
 * Charge / analytics placeholders (Albedo 2026-09-24).
 * begin_checkout & purchase: value + currency from here — not USD 6.99 as charge.
 */
export const SCHEME_A_PRICE = {
  value: 219,
  currency: "TWD",
  displayTwdLabel: "NT$219",
  displayUsdLabel: "$6.99",
} as const;

export const RECUR_PRODUCTS = {
  en_sphere: {
    id: RECUR_PRODUCT_ID_PLACEHOLDER,
    slug: "hecs-pack-en-sphere",
    name: "English Sphere Pack",
    unlockId: UNLOCK_ID_EN_SPHERE,
    price: SCHEME_A_PRICE.value,
    currency: SCHEME_A_PRICE.currency,
    displayUsdLabel: SCHEME_A_PRICE.displayUsdLabel,
    displayTwdLabel: SCHEME_A_PRICE.displayTwdLabel,
    interval: null as null,
    mode: "PAYMENT" as const,
    available: true,
    countries: EN_SPHERE_COUNTRIES,
    experimentId: EXPERIMENT_ID_EN_SPHERE,
    variantId: VARIANT_ID_PRICE_699,
  },
} as const;

export type RecurPackKey = keyof typeof RECUR_PRODUCTS;

export type ArmCopy = {
  headline: string;
  sub: string;
  cta: string;
  /** Optional micro-proof line (arm A). */
  microProof?: string;
};

/** Dual-arm landing copy — EN is primary (site default); zh-tw for locale. */
export const LANDING_ARM_COPY: Record<
  LandingArm,
  { en: ArmCopy; "zh-tw": ArmCopy }
> = {
  node_traffic: {
    en: {
      headline: "Get on the English-sphere map — not another AI answer.",
      sub: "HECS is a public node for how countries swear. You’re buying a place in the network — discovery, share paths, and the data that compounds — not a feature switch.",
      cta: "Claim your node spot",
      microProof: "Free AI chats stay private. Nodes get traffic.",
    },
    "zh-tw": {
      headline: "進英文圈流量圖，不是再問一次 AI。",
      sub: "HECS 是各國怎麼罵的公開節點。你買的是網路裡的位置：被找到、被分享、資料可累積——不是打開某個功能。",
      cta: "取得節點位置",
      microProof: "免費 AI 對話留在私聊；節點才帶流量。",
    },
  },
  feature_unlock: {
    en: {
      headline: "Unlock US · UK · Australia swear cards",
      sub: "Pay once to unlock three country packs with audio and notes.",
      cta: "Unlock now",
    },
    "zh-tw": {
      headline: "解鎖美／英／澳髒話卡片",
      sub: "一次付費解鎖三國內容包（含聽音與註解）。",
      cta: "立即解鎖",
    },
  },
};

/** Success page — forbid “unlocked” vocabulary. */
export const SUCCESS_COPY = {
  en: {
    title: "You’re on the map",
    body: "You’re on the map — your English-sphere node is active. Traffic and insights start from here.",
    ctaBrowse: "Visit your node countries",
    pendingNote:
      "If the node isn’t active yet, wait a moment for the webhook or refresh after signing in.",
  },
  "zh-tw": {
    title: "你已上圖",
    body: "你已上圖——英文圈節點已啟動。流量與洞察從這裡開始累積。",
    ctaBrowse: "前往節點國家",
    pendingNote: "若尚未啟動，請稍候 webhook 或重新整理（需已登入）。",
  },
} as const;

/** Shared system strings (not sell narrative). */
export const SYSTEM_COPY = {
  en: {
    priceLine: `${SCHEME_A_PRICE.displayTwdLabel} · ${SCHEME_A_PRICE.displayUsdLabel} (placeholder)`,
    ctaLogin: "Sign in to continue",
    paymentNotConfigured:
      "Payment not configured on this Preview — sandbox keys / product id pending.",
    alreadyOnMap: "Your English-sphere node is already active.",
    countryBannerHint: "Audio gated until your node is active. Phrase text stays free to preview.",
  },
  "zh-tw": {
    priceLine: `${SCHEME_A_PRICE.displayTwdLabel} · ${SCHEME_A_PRICE.displayUsdLabel}（占位）`,
    ctaLogin: "登入後繼續",
    paymentNotConfigured: "此 Preview 尚未設定付款（sandbox 金鑰／商品 id 待補）。",
    alreadyOnMap: "你的英文圈節點已啟動。",
    countryBannerHint: "節點啟動前發音鎖定；片語文字仍可免費預覽。",
  },
} as const;

export function parseLandingArm(raw: string | null | undefined): LandingArm | null {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "node_traffic" || v === "feature_unlock") return v;
  return null;
}

/**
 * Resolve arm: URL ?arm= → VITE_HECS_LANDING_ARM → default node_traffic.
 * Pass search string (with or without leading ?) from the client.
 */
export function resolveLandingArm(opts?: {
  search?: string | null;
  envArm?: string | null;
}): LandingArm {
  const search = opts?.search ?? "";
  try {
    const q = search.startsWith("?") ? search.slice(1) : search;
    const fromQuery = parseLandingArm(new URLSearchParams(q).get("arm"));
    if (fromQuery) return fromQuery;
  } catch {
    /* ignore */
  }
  const fromEnv = parseLandingArm(opts?.envArm ?? null);
  if (fromEnv) return fromEnv;
  return DEFAULT_LANDING_ARM;
}

export function armCopy(arm: LandingArm, locale: string): ArmCopy {
  const block = LANDING_ARM_COPY[arm];
  return locale === "zh-tw" ? block["zh-tw"] : block.en;
}

export function systemCopy(locale: string) {
  return locale === "zh-tw" ? SYSTEM_COPY["zh-tw"] : SYSTEM_COPY.en;
}

export function successCopy(locale: string) {
  return locale === "zh-tw" ? SUCCESS_COPY["zh-tw"] : SUCCESS_COPY.en;
}

/** Pack page composite (arm + system). */
export function packCopy(locale: string, arm: LandingArm = DEFAULT_LANDING_ARM) {
  const a = armCopy(arm, locale);
  const s = systemCopy(locale);
  return {
    title: a.headline,
    subtitle: a.sub,
    priceLine: s.priceLine,
    bullets: a.microProof ? [a.microProof] : [],
    ctaUnlock: a.cta,
    ctaLogin: s.ctaLogin,
    paymentNotConfigured: s.paymentNotConfigured,
    alreadyUnlocked: s.alreadyOnMap,
    microProof: a.microProof,
    arm,
  };
}

export function countryBannerCopy(locale: string, arm: LandingArm = DEFAULT_LANDING_ARM) {
  const a = armCopy(arm, locale);
  const s = systemCopy(locale);
  return {
    title: a.headline,
    body: `${a.sub} ${s.countryBannerHint}`,
    cta: a.cta,
    arm,
  };
}

export function paywallCopy(locale: string, arm: LandingArm = DEFAULT_LANDING_ARM) {
  const a = armCopy(arm, locale);
  return {
    title: a.headline,
    desc: a.sub,
    ctaPack: a.cta,
    arm,
  };
}

export function isEnSphereCountry(slug: string): boolean {
  return (EN_SPHERE_COUNTRIES as readonly string[]).includes(slug);
}

export function resolveEnSphereProductId(envOverride?: string | null): string {
  const fromEnv = (envOverride ?? "").trim();
  if (fromEnv) return fromEnv;
  return RECUR_PRODUCTS.en_sphere.id;
}

export function isEnSphereProduct(
  productId: string | null | undefined,
  productSlug: string | null | undefined,
  resolvedId: string,
): boolean {
  if (productId && productId === resolvedId) return true;
  if (productSlug && productSlug === RECUR_PRODUCTS.en_sphere.slug) return true;
  return false;
}
