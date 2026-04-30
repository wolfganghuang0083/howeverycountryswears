import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocation } from "wouter";
import { getLocaleFromPath, type Locale, DEFAULT_LOCALE, buildLocalePath, stripLocaleFromPath } from "@/lib/i18n";
import { t as translate } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  t: (key: string) => string;
  localePath: (path: string) => string;
  switchLocalePath: (newLocale: Locale) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key: string) => key,
  localePath: (path: string) => path,
  switchLocalePath: () => "/",
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const locale = useMemo(() => getLocaleFromPath(location), [location]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    t: (key: string) => translate(key, locale),
    localePath: (path: string) => buildLocalePath(path, locale),
    switchLocalePath: (newLocale: Locale) => {
      const basePath = stripLocaleFromPath(location);
      return buildLocalePath(basePath || "/", newLocale);
    },
  }), [locale, location]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
