/**
 * i18n Module
 * 
 * Multi-language support for the website.
 * 
 * Architecture:
 * - Each locale has its own JSON data file: countries-{locale}.json
 * - UI strings are stored in the TRANSLATIONS object below
 * - The locale is determined by URL prefix: /zh-tw/country/japan
 * - Default (no prefix) = English
 */

export type Locale = "en" | "zh-tw" | "zh-cn" | "ja" | "ko" | "es" | "fr" | "de";

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORTED_LOCALES: { code: Locale; name: string; nativeName: string; flag: string; enabled: boolean }[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", enabled: true },
  { code: "zh-tw", name: "Traditional Chinese", nativeName: "繁體中文", flag: "🇹🇼", enabled: true },
  { code: "zh-cn", name: "Simplified Chinese", nativeName: "简体中文", flag: "🇨🇳", enabled: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", enabled: false },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", enabled: false },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", enabled: false },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", enabled: false },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", enabled: false },
];

export function getEnabledLocales() {
  return SUPPORTED_LOCALES.filter((l) => l.enabled);
}

export function isValidLocale(code: string): code is Locale {
  return SUPPORTED_LOCALES.some((l) => l.code === code);
}

export function isEnabledLocale(code: string): boolean {
  return SUPPORTED_LOCALES.some((l) => l.code === code && l.enabled);
}

/**
 * UI Translations
 */
export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.community": "Community",
    "nav.rankings": "Rankings",
    "nav.about": "About",
    "nav.blog": "Blog",
    "nav.dashboard": "Dashboard",
    "nav.getBook": "Get the Book",
    "nav.signIn": "Sign In",
    "nav.signOut": "Sign Out",
    "nav.language": "Language",
    
    // PhraseCard
    "card.play": "Play",
    "card.locked": "Book Owners Only",
    "card.signInToListen": "Sign in to listen",
    "card.getBookToUnlock": "Get the book to unlock",
    "card.type": "Type",
    "card.literal": "Literal",
    "card.feelsLike": "Feels Like",
    "card.risk": "Risk",
    "card.register": "Register",
    "card.copyLink": "Link copied!",
    "card.share": "Share",
    "card.permalink": "Permalink",
    
    // Homepage
    "home.hero.title": "How Every Country Swears",
    "home.hero.subtitle": "A Cultural Guide to Global Profanity",
    "home.stats.phrases": "Phrases",
    "home.stats.countries": "Countries",
    "home.stats.regions": "World Regions",
    "home.featured.title": "Featured Phrases",
    "home.featured.subtitle": "Hand-picked gems from around the world",
    "home.regions.title": "Explore by Region",
    "home.regions.subtitle": "Discover profanity across cultures",
    "home.cta.title": "Get the Complete Guide",
    "home.cta.subtitle": "Unlock all 1,000 phrases with audio, cultural context, and more",
    "home.cta.button": "Get the Book",
    "home.explore": "Explore Countries",
    "home.viewAll": "View All",
    
    // Country Page
    "country.cards": "Phrase Cards",
    "country.culture": "Cultural Context",
    "country.pattern": "Dominant Pattern",
    "country.tone": "Tone Dependence",
    "country.warning": "Friendly Fire Warning",
    "country.locked": "This content is exclusive to book owners",
    "country.backToCountries": "Back to Countries",
    "country.phrases": "phrases",
    "country.culturalNotes": "Cultural Notes",
    
    // Region Page
    "region.countries": "Countries",
    "region.backToRegions": "Back to Regions",
    
    // Rankings
    "rankings.title": "Rankings",
    "rankings.subtitle": "See how phrases rank across the globe",
    
    // Buy Book
    "book.title": "Get the Book",
    "book.subtitle": "The complete guide to global profanity",
    "book.buyNow": "Buy Now",
    
    // Community
    "community.title": "Community",
    "community.submit": "Submit a Phrase",
    "community.vote": "Vote",
    
    // Dashboard
    "dashboard.title": "My Dashboard",
    "dashboard.points": "Points",
    "dashboard.badges": "Badges",
    "dashboard.submissions": "My Submissions",
    
    // Phrase Page
    "phrase.backToCountry": "Back to Country",
    "phrase.reviews": "Reviews",
    "phrase.addReview": "Add a Review",
    "phrase.noReviews": "No reviews yet. Be the first!",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.comingSoon": "Coming Soon",
    "common.backToHome": "Back to Home",
    "common.search": "Search",
    "common.searchPlaceholder": "Search countries or phrases...",
    
    // Footer
    "footer.rights": "All rights reserved",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
  },
  "zh-tw": {
    // Navigation
    "nav.home": "首頁",
    "nav.community": "社群",
    "nav.rankings": "排行榜",
    "nav.about": "關於",
    "nav.blog": "部落格",
    "nav.dashboard": "我的面板",
    "nav.getBook": "購買書籍",
    "nav.signIn": "登入",
    "nav.signOut": "登出",
    "nav.language": "語言",
    
    // PhraseCard
    "card.play": "播放",
    "card.locked": "僅限書籍持有者",
    "card.signInToListen": "登入即可收聽",
    "card.getBookToUnlock": "購書解鎖完整內容",
    "card.type": "類型",
    "card.literal": "字面意思",
    "card.feelsLike": "使用情境",
    "card.risk": "風險等級",
    "card.register": "使用場合",
    "card.copyLink": "連結已複製！",
    "card.share": "分享",
    "card.permalink": "永久連結",
    
    // Homepage
    "home.hero.title": "全球髒話文化指南",
    "home.hero.subtitle": "探索世界各國的罵人藝術",
    "home.stats.phrases": "個髒話片語",
    "home.stats.countries": "個國家",
    "home.stats.regions": "個世界區域",
    "home.featured.title": "精選片語",
    "home.featured.subtitle": "來自世界各地的精選佳句",
    "home.regions.title": "依區域探索",
    "home.regions.subtitle": "發掘不同文化的髒話藝術",
    "home.cta.title": "取得完整指南",
    "home.cta.subtitle": "解鎖全部 1,000 個片語，包含語音、文化背景等豐富內容",
    "home.cta.button": "購買書籍",
    "home.explore": "探索各國",
    "home.viewAll": "查看全部",
    
    // Country Page
    "country.cards": "片語卡片",
    "country.culture": "文化背景",
    "country.pattern": "主要模式",
    "country.tone": "語氣依賴度",
    "country.warning": "友軍傷害警告",
    "country.locked": "此內容為書籍持有者專屬",
    "country.backToCountries": "返回國家列表",
    "country.phrases": "個片語",
    "country.culturalNotes": "文化筆記",
    
    // Region Page
    "region.countries": "個國家",
    "region.backToRegions": "返回區域列表",
    
    // Rankings
    "rankings.title": "排行榜",
    "rankings.subtitle": "看看各國片語的全球排名",
    
    // Buy Book
    "book.title": "購買書籍",
    "book.subtitle": "全球髒話完整指南",
    "book.buyNow": "立即購買",
    
    // Community
    "community.title": "社群",
    "community.submit": "提交片語",
    "community.vote": "投票",
    
    // Dashboard
    "dashboard.title": "我的面板",
    "dashboard.points": "積分",
    "dashboard.badges": "徽章",
    "dashboard.submissions": "我的提交",
    
    // Phrase Page
    "phrase.backToCountry": "返回國家",
    "phrase.reviews": "評論",
    "phrase.addReview": "新增評論",
    "phrase.noReviews": "尚無評論，成為第一個評論者！",
    
    // Common
    "common.loading": "載入中...",
    "common.error": "發生錯誤",
    "common.comingSoon": "即將推出",
    "common.backToHome": "返回首頁",
    "common.search": "搜尋",
    "common.searchPlaceholder": "搜尋國家或片語...",
    
    // Footer
    "footer.rights": "版權所有",
    "footer.privacy": "隱私權政策",
    "footer.terms": "服務條款",
  },
  "zh-cn": {},
  ja: {},
  ko: {},
  es: {},
  fr: {},
  de: {},
};

/**
 * Get a translated string for the given locale and key.
 * Falls back to English if the translation is not available.
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || key;
}

/**
 * Get the current locale from the URL path.
 * e.g., /zh-tw/country/japan → "zh-tw"
 *       /country/japan → "en" (default)
 */
export function getLocaleFromPath(path: string): Locale {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0 && isEnabledLocale(segments[0])) {
    return segments[0] as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Strip locale prefix from path.
 * e.g., /zh-tw/country/japan → /country/japan
 *       /country/japan → /country/japan
 */
export function stripLocaleFromPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0 && isEnabledLocale(segments[0]) && segments[0] !== DEFAULT_LOCALE) {
    return "/" + segments.slice(1).join("/");
  }
  return path;
}

/**
 * Build a localized path.
 * e.g., buildLocalePath("/country/japan", "zh-tw") → "/zh-tw/country/japan"
 *       buildLocalePath("/country/japan", "en") → "/country/japan"
 */
export function buildLocalePath(path: string, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === DEFAULT_LOCALE) return path;
  return `/${locale}${path}`;
}

/**
 * Data file mapping for each locale.
 */
export function getDataFileName(locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return "countries.json";
  return `countries-${locale}.json`;
}
