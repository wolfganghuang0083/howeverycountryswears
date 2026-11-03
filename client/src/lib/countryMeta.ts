import countryMetaData from "@/data/country-meta.json";

export const SITE_ORIGIN = "https://howeverycountryswears.com";
export const DEFAULT_SITE_TITLE = "How Every Country Swears \u2014 1,000 Phrases, 100 Countries";

type MetaFields = { title?: string; description?: string };
type CountryMetaFile = {
  defaults: Required<MetaFields>;
  overrides: Record<string, MetaFields>;
};

const data = countryMetaData as unknown as CountryMetaFile;

function fill(template: string, name: string): string {
  return template.split("{name}").join(name);
}

/** English per-country title/description: data override first, then the {name} template. */
export function getCountryMeta(slug: string, name: string): { title: string; description: string } {
  const o = data.overrides[slug] || {};
  return {
    title: o.title || fill(data.defaults.title, name),
    description: o.description || fill(data.defaults.description, name),
  };
}

type HeadSnapshot = Array<{ el: Element; attr: string; value: string | null }>;

/** Sets head tags and returns a restore function (SPA navigation away from the country page). */
export function applyHeadMeta(m: {
  title: string;
  description: string;
  canonical?: string;
}): () => void {
  const snap: HeadSnapshot = [];
  document.title = m.title;
  const set = (selector: string, attr: string, value: string | undefined) => {
    if (!value) return;
    const el = document.head.querySelector(selector);
    if (!el) return;
    snap.push({ el, attr, value: el.getAttribute(attr) });
    el.setAttribute(attr, value);
  };
  set('meta[name="description"]', "content", m.description);
  set('meta[property="og:title"]', "content", m.title);
  set('meta[property="og:description"]', "content", m.description);
  set('meta[name="twitter:title"]', "content", m.title);
  set('meta[name="twitter:description"]', "content", m.description);
  set('meta[property="og:url"]', "content", m.canonical);
  set('link[rel="canonical"]', "href", m.canonical);
  return () => {
    document.title = DEFAULT_SITE_TITLE;
    for (const s of snap) {
      if (s.value === null) s.el.removeAttribute(s.attr);
      else s.el.setAttribute(s.attr, s.value);
    }
  };
}
