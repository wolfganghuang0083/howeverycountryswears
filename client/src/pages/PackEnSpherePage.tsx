/**
 * Scheme A Pack surface — dual-arm copy from shared/schemeAConfig.
 * Default arm=node_traffic; switch via ?arm=feature_unlock or VITE_HECS_LANDING_ARM.
 */
import Layout from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { Lock, Volume2, LogIn, CheckCircle } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  packCopy,
  EN_SPHERE_COUNTRIES,
  SCHEME_A_PRICE,
} from "@shared/schemeAConfig";
import { getClientLandingArm } from "@/lib/schemeAArm";
import {
  trackExperimentExposure,
  trackMembershipUnlockClick,
  trackBeginCheckout,
} from "@/lib/analytics";
import { toast } from "sonner";

export default function PackEnSpherePage() {
  const { locale, localePath } = useLocale();
  const search = useSearch();
  const arm = useMemo(() => getClientLandingArm(search), [search]);
  const copy = packCopy(locale, arm);
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState(user?.email || "");

  const { data: status, refetch } = trpc.unlock.myStatus.useQuery(undefined, {
    staleTime: 10_000,
  });

  const checkout = trpc.unlock.createCheckout.useMutation({
    onSuccess: (res) => {
      trackBeginCheckout({ session_id: res.sessionId, arm });
      window.location.href = res.url;
    },
    onError: (err) => {
      toast.error(err.message || copy.paymentNotConfigured);
    },
  });

  const devGrant = trpc.unlock.devGrantPackUnlock.useMutation({
    onSuccess: () => {
      toast.success("Dev node grant OK");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `English-sphere node — How Every Country Swears`;
    trackExperimentExposure({ surface: "pack_page", arm });
    return () => {
      document.title = "How Every Country Swears";
    };
  }, [arm]);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user?.email, email]);

  const unlocked = !!status?.canPlayEnSphereAudio;
  const canCheckout = !!status?.configured && !!status?.productReady;

  const onUnlockClick = () => {
    trackMembershipUnlockClick({ surface: "pack_page", arm });
    if (!isAuthenticated) {
      window.location.href = getLoginUrl(`/pack/en-sphere?arm=${arm}`);
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(locale === "zh-tw" ? "請填寫有效 Email" : "Please enter a valid email");
      return;
    }
    checkout.mutate({ pack: "en_sphere", email });
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-12">
        <div className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#FFF8E1] border-2 border-[#FFE500] flex items-center justify-center">
              {unlocked ? <CheckCircle className="text-green-600" /> : <Volume2 className="text-[#FF1493]" />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#999] mb-1">
                arm={arm}
              </p>
              <h1 className="font-display text-2xl md:text-3xl text-[#1a1a1a] leading-tight">{copy.title}</h1>
            </div>
          </div>

          <p className="text-sm text-[#444] mb-4 leading-relaxed">{copy.subtitle}</p>
          <p className="font-bold text-lg mb-2 text-[#1a1a1a]">{copy.priceLine}</p>
          {copy.microProof && (
            <p className="text-xs text-[#666] italic mb-4">{copy.microProof}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {EN_SPHERE_COUNTRIES.map((slug) => (
              <Link
                key={slug}
                href={localePath(`/country/${slug}?arm=${arm}`)}
                className="px-3 py-1.5 rounded-full border-2 border-[#1a1a1a] text-xs font-bold bg-[#FFE500] no-underline text-[#1a1a1a]"
              >
                {slug}
              </Link>
            ))}
          </div>

          {/* Arm switcher for Preview (B is control only) */}
          <p className="text-[11px] text-[#999] mb-4">
            Preview arm:{" "}
            <Link href={localePath("/pack/en-sphere?arm=node_traffic")} className="underline text-[#FF1493]">
              node_traffic
            </Link>
            {" · "}
            <Link href={localePath("/pack/en-sphere?arm=feature_unlock")} className="underline text-[#666]">
              feature_unlock
            </Link>
          </p>

          {unlocked ? (
            <div className="rounded-lg bg-green-50 border-2 border-green-600 p-4 text-green-800 font-semibold">
              {copy.alreadyUnlocked}
            </div>
          ) : (
            <div className="space-y-3">
              {isAuthenticated && (
                <label className="block text-sm">
                  <span className="font-semibold text-[#666]">Email (for checkout receipt)</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border-2 border-[#1a1a1a] rounded-lg px-3 py-2"
                    placeholder="you@example.com"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={onUnlockClick}
                disabled={checkout.isPending}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#FF1493] text-white rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60"
              >
                {!isAuthenticated ? (
                  <>
                    <LogIn size={18} /> {copy.ctaLogin}
                  </>
                ) : (
                  <>
                    <Lock size={18} /> {copy.ctaUnlock}
                  </>
                )}
              </button>
              {!canCheckout && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded p-2">
                  {copy.paymentNotConfigured}
                  <br />
                  <span className="text-[#666]">
                    value={SCHEME_A_PRICE.value} {SCHEME_A_PRICE.currency} (analytics placeholder)
                  </span>
                </p>
              )}
              {isAuthenticated && status?.mode !== "live" && (
                <button
                  type="button"
                  className="text-xs underline text-[#999]"
                  onClick={() => devGrant.mutate({ unlockId: "pack_en_sphere" })}
                >
                  Dev grant (Preview only if HECS_ALLOW_DEV_UNLOCK=1)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
