import type { Country } from "./data";

/**
 * Get 3 recommended countries for the "You Might Also Like" section.
 * 
 * Strategy:
 * 1. Same region neighbor (geographic proximity)
 * 2. Similar swearing style (cultural similarity from different region)
 * 3. Opposite country (maximum cultural contrast)
 */
export function getRecommendations(country: Country, allCountries: Country[]): {
  sameRegion?: { country: Country; reason: string; reasonZhTw: string };
  similarStyle?: { country: Country; reason: string; reasonZhTw: string };
  opposite?: { country: Country; reason: string; reasonZhTw: string };
} {
  const others = allCountries.filter(c => c.slug !== country.slug);

  // 1. Same region neighbor
  const sameRegionCountries = others.filter(c => c.region_slug === country.region_slug);
  const sameRegion = sameRegionCountries.length > 0
    ? sameRegionCountries[Math.floor(Math.random() * sameRegionCountries.length)]
    : undefined;

  // 2. Similar style — find countries from different regions with overlapping dominant_pattern keywords
  const patternKeywords = country.dominant_pattern.toLowerCase().split(/[\s,\-+&]+/).filter(w => w.length > 3);
  const differentRegionCountries = others.filter(c => c.region_slug !== country.region_slug);
  
  let similarStyle: Country | undefined;
  if (patternKeywords.length > 0 && differentRegionCountries.length > 0) {
    const scored = differentRegionCountries.map(c => {
      const cKeywords = c.dominant_pattern.toLowerCase().split(/[\s,\-+&]+/).filter(w => w.length > 3);
      const overlap = patternKeywords.filter(k => cKeywords.some(ck => ck.includes(k) || k.includes(ck))).length;
      return { country: c, score: overlap };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    
    if (scored.length > 0) {
      // Pick from top 3 randomly for variety
      const top = scored.slice(0, 3);
      similarStyle = top[Math.floor(Math.random() * top.length)].country;
    }
  }
  
  // Fallback: pick a random country from a different region
  if (!similarStyle && differentRegionCountries.length > 0) {
    similarStyle = differentRegionCountries[Math.floor(Math.random() * differentRegionCountries.length)];
  }

  // 3. Opposite — find a country from the most different region with no pattern overlap
  const usedSlugs = new Set([country.slug, sameRegion?.slug, similarStyle?.slug].filter(Boolean));
  const remainingCountries = others.filter(c => !usedSlugs.has(c.slug) && c.region_slug !== country.region_slug);
  
  let opposite: Country | undefined;
  if (remainingCountries.length > 0) {
    // Prefer countries with zero pattern overlap
    const noOverlap = remainingCountries.filter(c => {
      const cKeywords = c.dominant_pattern.toLowerCase().split(/[\s,\-+&]+/).filter(w => w.length > 3);
      return patternKeywords.every(k => !cKeywords.some(ck => ck.includes(k) || k.includes(ck)));
    });
    const pool = noOverlap.length > 0 ? noOverlap : remainingCountries;
    opposite = pool[Math.floor(Math.random() * pool.length)];
  }

  // Generate reason strings
  const result: ReturnType<typeof getRecommendations> = {};

  if (sameRegion) {
    result.sameRegion = {
      country: sameRegion,
      reason: `Next door: ${sameRegion.flag} ${sameRegion.name}`,
      reasonZhTw: `鄰國：${sameRegion.flag} ${sameRegion.name}`,
    };
  }

  if (similarStyle) {
    result.similarStyle = {
      country: similarStyle,
      reason: `Similar vibe: ${similarStyle.flag} ${similarStyle.name}`,
      reasonZhTw: `相似風格：${similarStyle.flag} ${similarStyle.name}`,
    };
  }

  if (opposite) {
    result.opposite = {
      country: opposite,
      reason: `Complete opposite: ${opposite.flag} ${opposite.name}`,
      reasonZhTw: `完全相反：${opposite.flag} ${opposite.name}`,
    };
  }

  return result;
}
