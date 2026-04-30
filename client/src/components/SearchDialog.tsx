import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Globe, MessageSquare, ArrowRight, Keyboard } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { getAllCountries, type Country } from "@/lib/data";
import { useLocale } from "@/contexts/LocaleContext";

interface SearchResult {
  type: "country" | "phrase";
  label: string;
  sublabel: string;
  href: string;
  searchText: string; // combined text for cross-language matching
  matchScore: number;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Normalize a string for search: lowercase, trim, remove diacritics
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Score how well a query matches a target string.
 * Higher = better match. 0 = no match.
 */
function scoreMatch(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  const words = t.split(/\s+/);
  for (const w of words) {
    if (w === q) return 90;
    if (w.startsWith(q)) return 70;
  }
  if (t.includes(q)) return 60;
  for (const w of words) {
    if (w.includes(q)) return 50;
  }
  return 0;
}

/**
 * Build a flat search index combining current locale + English data for cross-language search.
 * Each item's searchText includes both locale labels and English labels for matching.
 */
function buildSearchIndex(
  countries: Country[],
  enCountries: Country[],
  locale: string,
  localePath: (p: string) => string
): SearchResult[] {
  const results: SearchResult[] = [];
  const isZhTw = locale === "zh-tw";

  for (let ci = 0; ci < countries.length; ci++) {
    const country = countries[ci];
    const enCountry = isZhTw && ci < enCountries.length ? enCountries[ci] : null;

    // Build searchText that combines both languages
    const countrySearchParts = [country.name, country.region, country.slug];
    if (enCountry) {
      countrySearchParts.push(enCountry.name, enCountry.region, enCountry.slug);
    }

    results.push({
      type: "country",
      label: `${country.flag} ${country.name}`,
      sublabel: country.region,
      href: localePath(`/country/${country.slug}`),
      searchText: countrySearchParts.join(" "),
      matchScore: 0,
    });

    for (let pi = 0; pi < country.cards.length; pi++) {
      const card = country.cards[pi];
      const enCard = enCountry && pi < enCountry.cards.length ? enCountry.cards[pi] : null;

      const phraseSearchParts = [
        card.phrase, card.literal, card.feels_like,
        country.name, country.slug,
      ];
      if (enCard) {
        phraseSearchParts.push(enCard.phrase, enCard.literal, enCard.feels_like);
      }
      if (enCountry) {
        phraseSearchParts.push(enCountry.name);
      }

      results.push({
        type: "phrase",
        label: card.phrase,
        sublabel: `${country.flag} ${country.name} · ${card.literal}`,
        href: localePath(`/phrase/${country.slug}-${card.number}`),
        searchText: phraseSearchParts.join(" "),
        matchScore: 0,
      });
    }
  }

  return results;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const { locale, t, localePath } = useLocale();
  const [, setLocation] = useLocation();

  const isZhTw = locale === "zh-tw";

  // Build search index
  const countries = useMemo(() => getAllCountries(locale), [locale]);
  const enCountries = useMemo(() => (isZhTw ? getAllCountries("en") : []), [isZhTw]);
  const searchIndex = useMemo(
    () => buildSearchIndex(countries, enCountries, locale, localePath),
    [countries, enCountries, locale, localePath]
  );

  // Reset query when dialog opens
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Custom filter: score all items against searchText
  const { countryResults, phraseResults } = useMemo(() => {
    if (!query.trim()) {
      const popular = countries.slice(0, 8).map((c) => ({
        type: "country" as const,
        label: `${c.flag} ${c.name}`,
        sublabel: c.region,
        href: localePath(`/country/${c.slug}`),
        searchText: "",
        matchScore: 50,
      }));
      return { countryResults: popular, phraseResults: [] };
    }

    const scored = searchIndex.map((item) => ({
      ...item,
      matchScore: scoreMatch(query, item.searchText),
    }));

    const matched = scored.filter((r) => r.matchScore > 0);
    matched.sort((a, b) => b.matchScore - a.matchScore);

    const countryResults = matched.filter((r) => r.type === "country").slice(0, 8);
    const phraseResults = matched.filter((r) => r.type === "phrase").slice(0, 12);

    return { countryResults, phraseResults };
  }, [query, searchIndex, countries, localePath]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      setLocation(href);
    },
    [onOpenChange, setLocation]
  );

  // Custom filter for cmdk: always return 1 (show all) since we handle filtering ourselves
  const customFilter = useCallback(() => 1, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isZhTw ? "搜尋" : "Search"}
      description={isZhTw ? "搜尋國家或髒話片語" : "Search countries or swear phrases"}
      showCloseButton={false}
    >
      <CommandInput
        placeholder={t("common.searchPlaceholder")}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {query.trim() && countryResults.length === 0 && phraseResults.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {isZhTw ? "找不到相關結果" : "No results found"}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {isZhTw ? "試試其他關鍵字，或用英文搜尋" : "Try different keywords"}
            </p>
          </div>
        )}

        {countryResults.length > 0 && (
          <CommandGroup heading={isZhTw ? "🌍 國家" : "🌍 Countries"}>
            {countryResults.map((result) => (
              <CommandItem
                key={result.href}
                value={result.href}
                onSelect={() => handleSelect(result.href)}
                className="cursor-pointer"
                keywords={[result.searchText]}
              >
                <Globe className="mr-2 h-4 w-4 text-[#FF1493]" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate">{result.label}</span>
                  <span className="text-xs text-muted-foreground truncate">{result.sublabel}</span>
                </div>
                <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/40" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {countryResults.length > 0 && phraseResults.length > 0 && <CommandSeparator />}

        {phraseResults.length > 0 && (
          <CommandGroup heading={isZhTw ? "💬 片語" : "💬 Phrases"}>
            {phraseResults.map((result) => (
              <CommandItem
                key={result.href}
                value={result.href}
                onSelect={() => handleSelect(result.href)}
                className="cursor-pointer"
                keywords={[result.searchText]}
              >
                <MessageSquare className="mr-2 h-4 w-4 text-[#FFE500]" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate">{result.label}</span>
                  <span className="text-xs text-muted-foreground truncate">{result.sublabel}</span>
                </div>
                <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/40" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer with keyboard shortcut hint */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Keyboard className="h-3 w-3" />
          <span>{isZhTw ? "按 ↑↓ 選擇，Enter 確認" : "↑↓ to navigate, Enter to select"}</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Esc
          </kbd>
          <span>{isZhTw ? "關閉" : "to close"}</span>
        </div>
      </div>
    </CommandDialog>
  );
}
