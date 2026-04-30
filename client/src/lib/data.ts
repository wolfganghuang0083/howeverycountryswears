import countriesData from "@/data/countries.json";
import countriesDataZhTw from "@/data/countries-zh-tw.json";
import type { Locale } from "./i18n";

export interface Card {
  number: number;
  emoji: string;
  type: string;
  phrase: string;
  ipa: string;
  literal: string;
  feels_like: string;
  status: string;
  register: string;
  risk: string;
}

export interface Country {
  number: number;
  name: string;
  flag: string;
  slug: string;
  culture: string;
  dominant_pattern: string;
  tone_dependence: string;
  cards: Card[];
  friendly_fire_warning: string;
  cultural_notes: string[];
  lang_code: string;
  part_id: number;
  region: string;
  region_slug: string;
  description?: string;
  cultural_context?: string;
}

export interface Part {
  id: number;
  title: string;
  slug: string;
  countries: Country[];
}

export interface SiteData {
  title: string;
  subtitle: string;
  author: string;
  tagline: string;
  why_exists: string;
  how_to_use: string;
  parts: Part[];
  countries: Country[];
  total_countries: number;
  total_phrases: number;
}

const data = countriesData as SiteData;
const dataZhTw = countriesDataZhTw as SiteData;

// Locale-aware data map
const localeDataMap: Record<string, SiteData> = {
  en: data,
  "zh-tw": dataZhTw,
};

/** Get the SiteData for a given locale, falling back to English */
export function getLocaleData(locale: Locale = "en"): SiteData {
  return localeDataMap[locale] || data;
}

export function getAllCountries(locale: Locale = "en"): Country[] {
  return getLocaleData(locale).countries;
}

export function getCountryBySlug(slug: string, locale: Locale = "en"): Country | undefined {
  return getLocaleData(locale).countries.find((c) => c.slug === slug);
}

export function getCountryByNumber(num: number, locale: Locale = "en"): Country | undefined {
  return getLocaleData(locale).countries.find((c) => c.number === num);
}

export function getAllParts(locale: Locale = "en"): Part[] {
  return getLocaleData(locale).parts;
}

export function getPartBySlug(slug: string, locale: Locale = "en"): Part | undefined {
  return getLocaleData(locale).parts.find((p) => p.slug === slug);
}

export function getPhrase(countrySlug: string, cardNumber: number, locale: Locale = "en"): { country: Country; card: Card } | undefined {
  const country = getCountryBySlug(countrySlug, locale);
  if (!country) return undefined;
  const card = country.cards.find((c) => c.number === cardNumber);
  if (!card) return undefined;
  return { country, card };
}

export function getPhraseById(id: string, locale: Locale = "en"): { country: Country; card: Card } | undefined {
  const match = id.match(/^(.+)-(\d+)$/);
  if (!match) return undefined;
  return getPhrase(match[1], parseInt(match[2]), locale);
}

export function getAdjacentCountries(slug: string, locale: Locale = "en"): { prev?: Country; next?: Country } {
  const countries = getLocaleData(locale).countries;
  const idx = countries.findIndex((c) => c.slug === slug);
  return {
    prev: idx > 0 ? countries[idx - 1] : undefined,
    next: idx < countries.length - 1 ? countries[idx + 1] : undefined,
  };
}

export function getRiskColor(risk: string): string {
  if (risk.includes("Extreme") || risk.includes("極端") || risk.includes("🔴")) return "#DC2626";
  if (risk.includes("Severe") || risk.includes("⚠️⚠️⚠️")) return "#EF4444";
  if (risk.includes("High") || risk.includes("高度") || risk.includes("🟠")) return "#F97316";
  if (risk.includes("Medium") || risk.includes("中度") || risk.includes("🟡")) return "#F59E0B";
  if (risk.includes("Mild") || risk.includes("輕度")) return "#F59E0B";
  return "#22C55E";
}

export function getRiskLevel(risk: string): string {
  if (risk.includes("Extreme") || risk.includes("極端") || risk.includes("🔴")) return "extreme";
  if (risk.includes("Severe") || risk.includes("⚠️⚠️⚠️")) return "severe";
  if (risk.includes("High") || risk.includes("高度") || risk.includes("🟠")) return "high";
  if (risk.includes("Medium") || risk.includes("中度") || risk.includes("🟡")) return "moderate";
  if (risk.includes("Mild") || risk.includes("輕度")) return "mild";
  return "low";
}

export function getToneColor(tone: string): string {
  if (tone.includes("🔴")) return "#EF4444";
  if (tone.includes("🟡")) return "#F59E0B";
  return "#22C55E";
}

export function getToneLabel(tone: string): string {
  if (tone.includes("🔴")) return "High";
  if (tone.includes("🟡")) return "Medium";
  return "Low";
}

// Region colors for the map and region cards
export const regionColors: Record<string, string> = {
  "english-speaking-world": "#FF1493",
  "western-europe": "#FFE500",
  "northern-eastern-europe": "#00BFFF",
  "central-southeastern-europe": "#FF6600",
  "balkans-alpine-baltic": "#32CD32",
  "east-asia": "#FF1493",
  "southeast-south-central-asia": "#00BFFF",
  "middle-east-north-africa": "#FFE500",
  "sub-saharan-africa": "#FF6600",
  "latin-america": "#32CD32",
  "pacific-islands": "#00BFFF",
};

export const AMAZON_LINK = "https://www.amazon.com/dp/B0GSGZ3ZJZ?tag=aitoolverify-20&utm_source=website&utm_medium=cta&utm_campaign=swearbook";

export const SITE_DOMAIN = "https://howeverycountryswears.com";

/** Check if a country is in locked parts (Part 8-11) */
export function isLockedContent(partId: number): boolean {
  return partId >= 8;
}

/** Free parts are 1-7 */
export const FREE_PARTS = [1, 2, 3, 4, 5, 6, 7];
export const LOCKED_PARTS = [8, 9, 10, 11];

export { data as siteData };
