import { useEffect, useState, FormEvent } from "react";
import { createPortal } from "react-dom";
import { Loader2, Lock, X, Mail } from "lucide-react";
import {
  trackSignupStart,
  trackNewsletterModalOpen,
  trackNewsletterCtaClick,
  trackWelcomeEmailQueued,
  trackNewsletterSignup,
  getPageTypeFromPath,
} from "@/lib/analytics";

/** Short-lived preference cookie (also set httpOnly by /api/auth/google). */
export const NEWSLETTER_OPTIN_COOKIE = "hecs_newsletter_optin";
export const NEWSLETTER_ASK_DISMISSED_KEY = "hecs_newsletter_ask_dismissed";

export function setNewsletterOptInCookie(optIn: boolean) {
  if (typeof document === "undefined") return;
  const v = optIn ? "1" : "0";
  document.cookie = `${NEWSLETTER_OPTIN_COOKIE}=${v}; Path=/; Max-Age=3600; SameSite=Lax`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surface: "graycard" | "country" | "home" | "nav";
  ctaId: string;
  country?: string;
  sourcePath?: string;
  locale?: string;
  enabled?: boolean;
};

function OptInCheckbox({
  optIn,
  setOptIn,
  id,
}: {
  optIn: boolean;
  setOptIn: (v: boolean) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-2 text-xs text-[#555] cursor-pointer select-none mb-3">
      <input
        id={id}
        type="checkbox"
        checked={optIn}
        onChange={(e) => setOptIn(e.target.checked)}
        className="mt-0.5 accent-[#FF1493]"
      />
      <span>Also send me one swear word a week (newsletter). Unsubscribe anytime.</span>
    </label>
  );
}

export default function SignupModal({
  open,
  onOpenChange,
  surface,
  ctaId,
  country,
  sourcePath,
  locale = "en",
  enabled = true,
}: Props) {
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false); // GDPR: default unchecked
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [previewMagicUrl, setPreviewMagicUrl] = useState<string | null>(null);
  const [previewEmailHtml, setPreviewEmailHtml] = useState<string | null>(null);
  const [previewEmailSubject, setPreviewEmailSubject] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    trackNewsletterModalOpen({ surface, cta_id: ctaId });
    trackSignupStart({ method: "modal", surface, cta_id: ctaId });
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(Boolean(d.google)))
      .catch(() => setGoogleEnabled(false));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, surface, ctaId, onOpenChange]);

  if (!enabled || !open || typeof document === "undefined") return null;

  const returnTo =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";
  const path = sourcePath || returnTo;

  const onGoogle = () => {
    if (!googleEnabled) return;
    trackSignupStart({ method: "google", surface, cta_id: ctaId });
    trackNewsletterCtaClick({
      surface,
      cta_id: ctaId,
      page_type: getPageTypeFromPath(),
      country,
    });
    setNewsletterOptInCookie(optIn);
    const q = new URLSearchParams({
      returnTo,
      marketingConsent: optIn ? "1" : "0",
    });
    window.location.href = `/api/auth/google?${q.toString()}`;
  };

  const onMagic = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    trackSignupStart({ method: "email", surface, cta_id: ctaId });
    trackNewsletterCtaClick({
      surface,
      cta_id: ctaId,
      page_type: getPageTypeFromPath(),
      country,
    });
    setNewsletterOptInCookie(optIn);
    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          marketingConsent: optIn,
          returnTo,
          sourcePath: path,
          locale,
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send magic link");
      setSent(true);
      if (data.previewMagicUrl) setPreviewMagicUrl(data.previewMagicUrl);
      if (data.previewEmailHtml) {
        setPreviewEmailHtml(data.previewEmailHtml);
        setPreviewEmailSubject(data.previewEmailSubject || null);
      }
      trackWelcomeEmailQueued({ variant: "magic", surface, cta_id: ctaId });
      if (optIn) {
        trackNewsletterSignup({
          surface,
          cta_id: ctaId,
          method: "email",
          country: surface === "country" || surface === "graycard" ? country : undefined,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign up to unlock pronunciations"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 text-[#999] hover:text-[#1a1a1a]"
        >
          <X size={18} />
        </button>

        {sent ? (
          <div className="text-center">
            <Mail className="mx-auto mb-3 text-[#FF1493]" size={36} />
            <h3 className="font-display text-2xl text-[#1a1a1a] mb-2">Check your email</h3>
            <p className="text-sm text-[#555] leading-relaxed">
              We sent a magic link to verify your email and unlock pronunciations.
              {optIn ? " Weekly note confirmation is included when you verify." : ""}
            </p>
            {previewMagicUrl ? (
              <p className="mt-3 text-xs break-all">
                <span className="font-bold text-[#FF1493]">Preview only: magic link</span>
                <br />
                <a href={previewMagicUrl} className="text-[#FF1493] underline break-all">
                  {previewMagicUrl}
                </a>
              </p>
            ) : null}
            {previewEmailHtml ? (
              <div className="mt-3 text-left">
                <button
                  type="button"
                  onClick={() => setShowEmailPreview((v) => !v)}
                  className="text-xs font-bold text-[#FF1493] underline"
                >
                  {showEmailPreview ? "Hide email preview" : "Preview email"}
                  {previewEmailSubject ? ` — ${previewEmailSubject}` : ""}
                </button>
                {showEmailPreview ? (
                  <iframe
                    title="Email preview"
                    srcDoc={previewEmailHtml}
                    className="mt-2 w-full h-64 border-2 border-[#1a1a1a] rounded-lg bg-white"
                    sandbox=""
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 rounded-full bg-[#FFE500] border-2 border-[#1a1a1a] p-2 shadow-[2px_2px_0px_#1a1a1a]">
                <Lock size={18} className="text-[#1a1a1a]" />
              </div>
              <div>
                <h3 className="font-display text-xl md:text-2xl text-[#1a1a1a] mb-1">
                  Unlock pronunciations — free account
                </h3>
                <p className="text-sm text-[#555] leading-relaxed">
                  Register with a verified email. No password. Audio unlocks after verification.
                </p>
              </div>
            </div>

            {/* P0: checkbox directly above Google; still covers email path */}
            <OptInCheckbox optIn={optIn} setOptIn={setOptIn} id="signup-newsletter-optin" />

            <button
              type="button"
              onClick={onGoogle}
              disabled={!googleEnabled}
              title={googleEnabled ? "Continue with Google" : "Coming soon — Google OAuth not configured"}
              className="w-full mb-3 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed bg-white text-[#1a1a1a]"
            >
              {googleEnabled ? "Continue with Google" : "Continue with Google (coming soon)"}
            </button>

            <p className="text-center text-xs text-[#888] mb-3">or use email</p>

            <form onSubmit={onMagic} className="flex flex-col gap-3">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-[#1a1a1a] bg-[#FAFAFA] text-sm"
              />
              <button
                type="submit"
                disabled={pending || !email.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#FF1493] text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending link…
                  </>
                ) : (
                  "Email me a magic link"
                )}
              </button>
            </form>
            {error ? (
              <p className="mt-3 text-sm text-red-600 font-medium" role="alert">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
