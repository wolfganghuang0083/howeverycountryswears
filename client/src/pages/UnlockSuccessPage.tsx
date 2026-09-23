import Layout from "@/components/Layout";
import { useEffect, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { successCopy, EN_SPHERE_COUNTRIES } from "@shared/schemeAConfig";
import { getClientLandingArm } from "@/lib/schemeAArm";
import { trackPurchaseOnce } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";

export default function UnlockSuccessPage() {
  const { locale, localePath } = useLocale();
  const copy = successCopy(locale);
  const search = useSearch();
  const arm = useMemo(() => getClientLandingArm(search), [search]);
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const sessionId = params.get("session_id");
  const pack = params.get("pack");

  const { data: status } = trpc.unlock.myStatus.useQuery(undefined, {
    refetchInterval: (q) => (q.state.data?.canPlayEnSphereAudio ? false : 3000),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${copy.title} — How Every Country Swears`;
    trackPurchaseOnce({ session_id: sessionId, transaction_id: sessionId, arm });
  }, [copy.title, sessionId, arm]);

  return (
    <Layout>
      <div className="container max-w-lg py-16 text-center">
        <div className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-8">
          <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
          <h1 className="font-display text-3xl mb-2">{copy.title}</h1>
          <p className="text-[#666] mb-4 leading-relaxed">{copy.body}</p>
          {pack && (
            <p className="text-xs text-[#999] mb-4">
              pack={pack}
              {sessionId ? ` · session=${sessionId}` : ""} · arm={arm}
            </p>
          )}
          {status?.canPlayEnSphereAudio ? (
            <p className="text-green-700 font-semibold mb-4">Node active ✓</p>
          ) : (
            <p className="text-sm text-amber-700 mb-4">{copy.pendingNote}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {EN_SPHERE_COUNTRIES.map((slug) => (
              <Link
                key={slug}
                href={localePath(`/country/${slug}`)}
                className="px-3 py-1.5 rounded-full border-2 border-[#1a1a1a] text-xs font-bold bg-[#FFE500] no-underline text-[#1a1a1a]"
              >
                {slug}
              </Link>
            ))}
          </div>
          <Link
            href={localePath(`/pack/en-sphere?arm=${arm}`)}
            className="inline-block px-4 py-2 bg-[#FF1493] text-white rounded-lg font-bold border-2 border-[#1a1a1a] no-underline"
          >
            {copy.ctaBrowse}
          </Link>
        </div>
      </div>
    </Layout>
  );
}
