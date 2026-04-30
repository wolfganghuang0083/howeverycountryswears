import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Menu, X, BookOpen, Globe, Trophy, Info, Users, LayoutDashboard, LogIn, LogOut, User, Star, ShoppingBag, Languages, Search } from "lucide-react";
import SearchDialog from "@/components/SearchDialog";
import { AMAZON_LINK } from "@/lib/data";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocale } from "@/contexts/LocaleContext";
import { getEnabledLocales, type Locale, DEFAULT_LOCALE } from "@/lib/i18n";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { locale, t, localePath, switchLocalePath } = useLocale();
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const isBookBuyer = user?.memberTier === "bookBuyer" || user?.role === "admin";

  const navLinks = [
    { href: localePath("/"), label: t("nav.home"), icon: Globe },
    { href: localePath("/community"), label: t("nav.community"), icon: Users },
    { href: localePath("/rankings"), label: t("nav.rankings"), icon: Trophy },
    { href: localePath("/get-the-book"), label: t("nav.getBook"), icon: ShoppingBag },
    { href: localePath("/about"), label: t("nav.about"), icon: Info },
  ];

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setLangMenuOpen(false);
  }, [location]);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen && !langMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, langMenuOpen]);

  // Filter nav links: hide "Get the Book" for bookBuyer members
  const filteredNavLinks = navLinks.filter((link) => {
    if (link.href === localePath("/get-the-book") && isBookBuyer) return false;
    return true;
  });

  const enabledLocales = getEnabledLocales();
  const currentLocaleInfo = enabledLocales.find(l => l.code === locale);

  const handleSwitchLocale = (newLocale: Locale) => {
    const newPath = switchLocalePath(newLocale);
    setLocation(newPath);
    setLangMenuOpen(false);
    setMenuOpen(false);
  };

  const siteTitle = locale === "zh-tw" ? "全球髒話" : "How Every";
  const siteTitleLine2 = locale === "zh-tw" ? "文化指南" : "Country Swears";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b-3 border-[#1a1a1a]">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={localePath("/")} className="flex items-center gap-2 no-underline">
            <span className="font-display text-2xl md:text-3xl text-[#FF1493] tracking-wide leading-none">
              @#$%!
            </span>
            <span className="hidden sm:block font-bold text-sm text-[#1a1a1a] leading-tight">
              {siteTitle}<br />{siteTitleLine2}
            </span>
          </Link>

          {/* Right side: search + language switcher + hamburger menu */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={() => { setSearchOpen(true); setMenuOpen(false); setLangMenuOpen(false); }}
              className="p-2 border-2 border-[#1a1a1a] rounded-lg bg-white hover:bg-[#FFF0F5] transition-colors shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[0px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center gap-1.5"
              aria-label={locale === "zh-tw" ? "搜尋" : "Search"}
            >
              <Search size={18} />
              <span className="text-xs font-bold hidden md:inline text-[#999]">
                ⌘K
              </span>
            </button>
            {/* Language Switcher */}
            {enabledLocales.length > 1 && (
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => { setLangMenuOpen(!langMenuOpen); setMenuOpen(false); }}
                  className="p-2 border-2 border-[#1a1a1a] rounded-lg bg-white hover:bg-[#FFF0F5] transition-colors shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[0px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center gap-1.5"
                  aria-label={t("nav.language")}
                >
                  <Languages size={18} />
                  <span className="text-xs font-bold hidden sm:inline">{currentLocaleInfo?.flag}</span>
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] z-50 overflow-hidden py-2">
                    {enabledLocales.map((loc) => (
                      <button
                        key={loc.code}
                        onClick={() => handleSwitchLocale(loc.code)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold w-full transition-colors ${
                          locale === loc.code
                            ? "text-[#FF1493] bg-[#FFF0F5]"
                            : "text-[#1a1a1a] hover:bg-[#FFF0F5] hover:text-[#FF1493]"
                        }`}
                      >
                        <span className="text-lg">{loc.flag}</span>
                        <span>{loc.nativeName}</span>
                        {locale === loc.code && <span className="ml-auto text-[#FF1493]">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hamburger Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => { setMenuOpen(!menuOpen); setLangMenuOpen(false); }}
                className="p-2 border-2 border-[#1a1a1a] rounded-lg bg-white hover:bg-[#FFF0F5] transition-colors shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[0px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px]"
                aria-label="Menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] z-50 overflow-hidden">
                  {/* User info section */}
                  {!authLoading && isAuthenticated && user && (
                    <div className="px-4 py-3 bg-gradient-to-r from-[#FFF0F5] to-[#FFF8E1] border-b-2 border-[#1a1a1a]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF1493] to-[#FFE500] flex items-center justify-center border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                          <User size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#1a1a1a] truncate max-w-[160px]">
                            {user.displayName || user.name || "User"}
                          </p>
                          <p className="text-xs text-[#999] flex items-center gap-1">
                            {isBookBuyer ? (
                              <><BookOpen size={10} /> {locale === "zh-tw" ? "書籍持有者" : "Book Owner"}</>
                            ) : (
                              <><Star size={10} /> {locale === "zh-tw" ? "免費會員" : "Free Member"}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nav links */}
                  <nav className="py-2">
                    {filteredNavLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold no-underline transition-colors ${
                          location === link.href || (link.href !== localePath("/") && location.startsWith(link.href))
                            ? "text-[#FF1493] bg-[#FFF0F5]"
                            : "text-[#1a1a1a] hover:bg-[#FFF0F5] hover:text-[#FF1493]"
                        }`}
                      >
                        <link.icon size={18} />
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Auth section */}
                  <div className="border-t-2 border-[#eee] py-2">
                    {!authLoading && (
                      isAuthenticated ? (
                        <>
                          <Link
                            href={localePath("/dashboard")}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold no-underline transition-colors ${
                              location === localePath("/dashboard")
                                ? "text-[#FF1493] bg-[#FFF0F5]"
                                : "text-[#1a1a1a] hover:bg-[#FFF0F5] hover:text-[#FF1493]"
                            }`}
                          >
                            <LayoutDashboard size={18} />
                            {t("nav.dashboard")}
                          </Link>
                          <button
                            onClick={() => { logout(); setMenuOpen(false); }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#FF4444] hover:bg-[#FFF0F0] w-full transition-colors"
                          >
                            <LogOut size={18} /> {t("nav.signOut")}
                          </button>
                        </>
                      ) : (
                        <a
                          href={getLoginUrl()}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#FFF0F5] hover:text-[#FF1493] no-underline transition-colors"
                        >
                          <LogIn size={18} /> {t("nav.signIn")}
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-display text-3xl text-[#FF1493] mb-3">@#$%!</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {locale === "zh-tw"
                  ? "全球髒話文化指南 — 探索世界各國的罵人藝術。來自 100 個國家的 1,000 個片語。"
                  : "How Every Country Swears — A Cultural Guide to Global Profanity. 1,000 phrases from 100 countries."}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-3">
                {locale === "zh-tw" ? "探索" : "Explore"}
              </h4>
              <div className="flex flex-col gap-2">
                <Link href={localePath("/")} className="text-gray-300 hover:text-[#FF1493] text-sm no-underline transition-colors">{t("nav.home")}</Link>
                <Link href={localePath("/community")} className="text-gray-300 hover:text-[#FF1493] text-sm no-underline transition-colors">{t("nav.community")}</Link>
                <Link href={localePath("/rankings")} className="text-gray-300 hover:text-[#FF1493] text-sm no-underline transition-colors">{t("nav.rankings")}</Link>
                <Link href={localePath("/get-the-book")} className="text-gray-300 hover:text-[#FFE500] text-sm no-underline transition-colors">{t("nav.getBook")}</Link>
                <Link href={localePath("/about")} className="text-gray-300 hover:text-[#FF1493] text-sm no-underline transition-colors">{t("nav.about")}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-3">
                {locale === "zh-tw" ? "我們的理念" : "Our Philosophy"}
              </h4>
              <blockquote className="text-[#FFE500] font-display text-lg italic leading-relaxed">
                {locale === "zh-tw"
                  ? "「理解是目標，尊重是方法，歡笑是獎勵。」"
                  : "\"Understanding is the goal. Respect is the method. Laughter is the reward.\""}
              </blockquote>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">&copy; 2026 Wolfgang Huang. {t("footer.rights")}.</p>
            <div className="flex items-center gap-4 text-gray-500 text-xs">
              <Link href={localePath("/about")} className="hover:text-gray-300 no-underline transition-colors">{t("nav.about")}</Link>
              <span>&middot;</span>
              <a href="mailto:contact@howeverycountryswears.com" className="hover:text-gray-300 no-underline transition-colors">
                {locale === "zh-tw" ? "聯絡我們" : "Contact"}
              </a>
              <span>&middot;</span>
              <span className="hover:text-gray-300 cursor-default">{t("footer.privacy")}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
