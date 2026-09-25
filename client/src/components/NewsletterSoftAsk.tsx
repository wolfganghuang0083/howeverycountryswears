import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { NEWSLETTER_ASK_DISMISSED_KEY } from "@/components/SignupModal";
import { trackNewsletterSignup } from "@/lib/analytics";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Post-verify soft ask for weekly newsletter.
 * Shows once after signup=google|email when user is not subscribed and did not
 * already opt in during registration (newsletter=1 query or prior consent).
 */
export default function NewsletterSoftAsk() {
  const { isAuthenticated, user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // Capture signup=* before useAuth clears the query string
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const signup = q.get("signup");
      if (signup === "google" || signup === "email") {
        const skip = q.get("newsletter") === "1";
        sessionStorage.setItem(
          "hecs_soft_ask_pending",
          skip ? "skip" : "ask",
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.email) return;
    try {
      if (localStorage.getItem(NEWSLETTER_ASK_DISMISSED_KEY) === "1") return;
      const pendingFlag = sessionStorage.getItem("hecs_soft_ask_pending");
      if (pendingFlag !== "ask") return;

      let cancelled = false;
      (async () => {
        const res = await fetch("/api/auth/newsletter-status", { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        if (data.subscribed) {
          sessionStorage.removeItem("hecs_soft_ask_pending");
          return;
        }
        setOpen(true);
      })().catch(() => {});

      return () => {
        cancelled = true;
      };
    } catch {
      /* ignore */
    }
  }, [loading, isAuthenticated, user?.email]);

  const dismiss = () => {
    try {
      localStorage.setItem(NEWSLETTER_ASK_DISMISSED_KEY, "1");
      sessionStorage.removeItem("hecs_soft_ask_pending");
    } catch {
      /* ignore */
    }
    setOpen(false);
    // Clean signup query so refresh doesn't re-trigger before localStorage write races
    try {
      const q = new URLSearchParams(window.location.search);
      q.delete("signup");
      q.delete("newsletter");
      const clean = `${window.location.pathname}${q.toString() ? `?${q}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", clean);
    } catch {
      /* ignore */
    }
  };

  const onYes = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/auth/newsletter-optin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        trackNewsletterSignup({ surface: "soft_ask", cta_id: "post_unlock_yes", method: "soft_ask" });
      }
    } catch {
      /* ignore */
    } finally {
      setPending(false);
      dismiss();
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Weekly newsletter"
      onClick={dismiss}
    >
      <div
        className="bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={dismiss}
          className="absolute top-3 right-3 text-[#999] hover:text-[#1a1a1a]"
        >
          <X size={18} />
        </button>
        <p className="text-sm font-bold text-[#1a1a1a] mb-1 pr-6">
          You're unlocked. We also sent a welcome email.
        </p>
        <h3 className="font-display text-xl text-[#1a1a1a] mb-2 pr-6">
          Want one swear word a week?
        </h3>
        <p className="text-sm text-[#555] leading-relaxed mb-4">
          Pronunciations are ready now — no need to wait on the inbox. Optional short newsletter; unsubscribe anytime.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onYes}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#FF1493] text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : (
              "Yes, send it"
            )}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={dismiss}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-bold text-sm bg-white text-[#1a1a1a] border-2 border-[#1a1a1a]"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
