import { useEffect } from "react";
import { AMAZON_LINK } from "@/lib/data";
import { trackPurchaseClick } from "@/lib/analytics";

/**
 * In-site book redirect: fire dual purchase_click + book_cta_click, then go to Amazon.
 * Query: ?surface=&cta_id= plus any utm_* preserved onto Amazon URL.
 */
export default function GoBookPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surface = params.get("surface") || "site";
    const ctaId = params.get("cta_id") || "go_book";
    const country = params.get("country") || undefined;

    trackPurchaseClick(ctaId, country, {
      destination: "amazon",
      page_type: surface === "email" ? "email" : undefined,
    });
    // Also stamp surface on a companion event param via book_cta_click already fired;
    // re-fire a lightweight surface-tagged purchase for funnel clarity if gtag present
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "book_cta_click", {
        cta_id: ctaId,
        surface,
        destination: "amazon",
        country,
      });
    }

    const dest = new URL(AMAZON_LINK);
    params.forEach((v, k) => {
      if (k.startsWith("utm_")) dest.searchParams.set(k, v);
    });
    // Prefer query surface/cta as campaign breadcrumbs when no utm_campaign
    if (!dest.searchParams.get("utm_campaign") && surface) {
      dest.searchParams.set("utm_campaign", `go_book_${surface}`);
    }
    window.location.replace(dest.toString());
  }, []);

  return (
    <div className="min-h-[40vh] flex items-center justify-center p-8">
      <p className="text-sm text-[#666]">Taking you to the Kindle book…</p>
    </div>
  );
}
