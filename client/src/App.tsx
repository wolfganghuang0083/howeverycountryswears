import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const CountryPage = lazy(() => import("./pages/CountryPage"));
const RegionPage = lazy(() => import("./pages/RegionPage"));
const PhrasePage = lazy(() => import("./pages/PhrasePage"));
const RankingsPage = lazy(() => import("./pages/RankingsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const BuyBookPage = lazy(() => import("./pages/BuyBookPage"));
const HiddenRegisterPage = lazy(() => import("./pages/HiddenRegisterPage"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-pop-pink border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-display text-2xl text-pop-pink">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* English (default) routes */}
        <Route path="/" component={Home} />
        <Route path="/country/:slug" component={CountryPage} />
        <Route path="/region/:slug" component={RegionPage} />
        <Route path="/phrase/:id" component={PhrasePage} />
        <Route path="/rankings" component={RankingsPage} />
        <Route path="/rankings/:category" component={RankingsPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/get-the-book" component={BuyBookPage} />
        <Route path="/book-activate" component={HiddenRegisterPage} />

        {/* Chinese (zh-tw) routes */}
        <Route path="/zh-tw" component={Home} />
        <Route path="/zh-tw/country/:slug" component={CountryPage} />
        <Route path="/zh-tw/region/:slug" component={RegionPage} />
        <Route path="/zh-tw/phrase/:id" component={PhrasePage} />
        <Route path="/zh-tw/rankings" component={RankingsPage} />
        <Route path="/zh-tw/rankings/:category" component={RankingsPage} />
        <Route path="/zh-tw/about" component={AboutPage} />
        <Route path="/zh-tw/blog" component={BlogPage} />
        <Route path="/zh-tw/community" component={CommunityPage} />
        <Route path="/zh-tw/dashboard" component={DashboardPage} />
        <Route path="/zh-tw/get-the-book" component={BuyBookPage} />

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LocaleProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
