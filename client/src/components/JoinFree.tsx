import { useState, FormEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mail, CheckCircle2, Loader2, X, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  trackNewsletterCtaClick,
  trackNewsletterModalOpen,
  trackNewsletterSignup,
  trackNewsletterSubscribeSubmit,
  trackWelcomeEmailQueued,
  getPageTypeFromPath,
} from "@/lib/analytics";

export type JoinFreeSurface = "country" | "blog" | "home" | "graycard" | "about" | "footer";

type Variant = "inline" | "modal" | "sticky";

/** newsletter = blog/about explicit signup (always consent). audio_unlock = grey Play / sticky. */
type Mode = "newsletter" | "audio_unlock";

type Props = {
  surface: JoinFreeSurface;
  ctaId: string;
  country?: string;
  headline?: string;
  microcopy?: string;
  variant?: Variant;
  mode?: Mode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called after successful unlock (audio_unlock mode). */
  onUnlocked?: () => void;
  enabled?: boolean;
  sourcePath?: string;
  locale?: string;
  showBookLink?: boolean;
  bookLinkLabel?: string;
  className?: string;
};

const PRIVACY = "Free. Unsubscribe anytime. We never sell your email.";
const NEWSLETTER_OPTIN =
  "Also send me one swear word a week (newsletter). Unsubscribe anytime.";
const DEFAULT_NEWSLETTER_HEADLINE = "One swear word a week — free";
const DEFAULT_NEWSLETTER_MICRO =
  "A new country each week, with a short cultural note. Free. Unsubscribe anytime. We never sell your email.";
const AUDIO_HEADLINE = "Unlock all pronunciations — free";
const AUDIO_MICRO = "Enter your email to hear every phrase. No account required.";

export default function JoinFree({
  surface,
  ctaId,
  country,
  headline,
  microcopy,
  variant = "inline",
  mode = "newsletter",
  open,
  onOpenChange,
  onUnlocked,
  enabled = true,
  sourcePath,
  locale = "en",
  showBookLink = false,
  bookLinkLabel = "Prefer the full guide? Get the book on Kindle →",
  className = "",
}: Props) {
  const isAudio = false; // audio_unlock removed; SignupModal owns pronunciation unlock
  void mode;
  void onUnlocked;
  const resolvedHeadline =
    headline ?? (isAudio ? AUDIO_HEADLINE : DEFAULT_NEWSLETTER_HEADLINE);
  const resolvedMicro =
    microcopy ?? (isAudio ? AUDIO_MICRO : DEFAULT_NEWSLETTER_MICRO);

  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false); // GDPR: unchecked by default
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewConfirmUrl, setPreviewConfirmUrl] = useState<string | null>(null);
  const [previewEmailHtml, setPreviewEmailHtml] = useState<string | null>(null);
  const [previewEmailSubject, setPreviewEmailSubject] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const isModal = variant === "modal";
  const isStickyBar = variant === "sticky";
  const isOpen = isModal || isStickyBar ? (open ?? internalOpen) : true;

  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (open === undefined) setInternalOpen(v);
  };

  useEffect(() => {
    if (!(isModal || isStickyBar) || !isOpen) return;
    trackNewsletterModalOpen({ surface, cta_id: ctaId });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModal, isOpen, surface, ctaId]);

  const mutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      const consented =
        isAudio ? optIn : true; // newsletter mode always consents
      trackNewsletterSubscribeSubmit({
        country,
        locale,
        source_path: sourcePath || (typeof window !== "undefined" ? window.location.pathname : "/"),
      });
      // audio_unlock mode deprecated — use SignupModal (verified account).
      if (consented) {
        trackNewsletterSignup({
          surface,
          cta_id: ctaId,
          method: "email",
          country: surface === "country" || surface === "graycard" ? country : undefined,
        });
      }
      if (data && "previewConfirmUrl" in data && data.previewConfirmUrl) {
        setPreviewConfirmUrl(data.previewConfirmUrl as string);
      } else {
        setPreviewConfirmUrl(null);
      }
      if (data && "previewEmailHtml" in data && data.previewEmailHtml) {
        setPreviewEmailHtml(data.previewEmailHtml as string);
        setPreviewEmailSubject(
          data && "previewEmailSubject" in data && data.previewEmailSubject
            ? (data.previewEmailSubject as string)
            : null,
        );
      } else {
        setPreviewEmailHtml(null);
        setPreviewEmailSubject(null);
      }
      if (data && "emailVariant" in data && data.emailVariant) {
        trackWelcomeEmailQueued({
          variant: data.emailVariant as "unlocked" | "optin_welcome",
          surface,
          cta_id: ctaId,
        });
      }
      setDone(true);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  if (!enabled) return null;

  const path =
    sourcePath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    trackNewsletterCtaClick({
      surface,
      cta_id: ctaId,
      page_type: getPageTypeFromPath(),
      country: surface === "country" || surface === "graycard" ? country : undefined,
    });
    const marketingConsent = isAudio ? optIn : true;
    mutation.mutate({
      email: email.trim(),
      country,
      locale,
      sourcePath: path,
      marketingConsent,
    });
  };

  const bookHref = `/go/book?surface=${encodeURIComponent(surface)}&cta_id=${encodeURIComponent(ctaId + "_book")}`;
  const submitLabel = isAudio ? "Unlock audio" : "Join free";

  const formInner = (
    <>
      {done ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 text-[#FF1493]" size={36} />
          <h3 className="font-display text-2xl text-[#1a1a1a] mb-2">
            {isAudio ? "Audio unlocked" : "Thanks — you're on the list"}
          </h3>
          <p className="text-sm text-[#555] leading-relaxed">
            {isAudio
              ? optIn
                ? "You can play every pronunciation now. We'll email a confirm link for the weekly note when sending is enabled."
                : "You can play every pronunciation now. No newsletter — you can opt in anytime."
              : "Check your inbox for a confirm link when sending is enabled. For now your address is saved."}
          </p>
          {previewConfirmUrl ? (
            <p className="mt-3 text-xs text-[#666] break-all">
              <span className="font-bold text-[#FF1493]">Preview only: link</span>
              <br />
              <a href={previewConfirmUrl} className="text-[#FF1493] underline break-all">
                {previewConfirmUrl}
              </a>
            </p>
          ) : null}
          {previewEmailHtml ? (
            <div className="mt-3">
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
          {isAudio ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-bold text-sm bg-[#FF1493] text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
            >
              Start listening
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 rounded-full bg-[#FFE500] border-2 border-[#1a1a1a] p-2 shadow-[2px_2px_0px_#1a1a1a]">
              {isAudio ? (
                <Lock size={18} className="text-[#1a1a1a]" />
              ) : (
                <Mail size={18} className="text-[#1a1a1a]" />
              )}
            </div>
            <div>
              <h3 className="font-display text-xl md:text-2xl text-[#1a1a1a] mb-1">
                {resolvedHeadline}
              </h3>
              <p className="text-sm text-[#555] leading-relaxed">{resolvedMicro}</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor={`hecs-joinfree-${ctaId}`} className="sr-only">
                Email
              </label>
              <input
                id={`hecs-joinfree-${ctaId}`}
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mutation.isPending}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border-2 border-[#1a1a1a] bg-[#FAFAFA] text-[#1a1a1a] text-sm font-medium shadow-[2px_2px_0px_#1a1a1a] focus:outline-none focus:bg-white"
              />
              <button
                type="submit"
                disabled={mutation.isPending || !email.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#FF1493] text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  submitLabel
                )}
              </button>
            </div>
            {isAudio ? (
              <label className="flex items-start gap-2 text-xs text-[#555] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={optIn}
                  onChange={(e) => setOptIn(e.target.checked)}
                  className="mt-0.5 accent-[#FF1493]"
                />
                <span>{NEWSLETTER_OPTIN}</span>
              </label>
            ) : (
              <p className="text-xs text-[#888]">{PRIVACY}</p>
            )}
          </form>
          {error ? (
            <p className="mt-3 text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          ) : null}
          {showBookLink && !isAudio ? (
            <p className="mt-3 text-center">
              <a href={bookHref} className="text-xs text-[#666] hover:text-[#FF1493] underline">
                {bookLinkLabel}
              </a>
            </p>
          ) : null}
          {isAudio ? (
            <p className="mt-3 text-center">
              <a href={bookHref} className="text-xs text-[#666] hover:text-[#FF1493] underline">
                Or get the full book on Kindle
              </a>
            </p>
          ) : null}
        </>
      )}
    </>
  );

  // Sticky: bar that opens modal (parent usually controls modal separately;
  // if sticky alone, use internal open + embedded modal)
  if (isStickyBar) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            trackNewsletterCtaClick({
              surface,
              cta_id: ctaId,
              page_type: getPageTypeFromPath(),
              country,
            });
            setOpen(true);
          }}
          className={`fixed bottom-0 inset-x-0 z-50 md:hidden border-t-2 border-[#1a1a1a] bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.12)] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm font-bold text-[#1a1a1a] ${className}`}
        >
          🔒 Unlock all pronunciations free — just your email
        </button>
        {isOpen
          ? createPortal(
              <div
                className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-label={resolvedHeadline}
                onClick={() => setOpen(false)}
              >
                <div
                  className="bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-6 max-w-md w-full relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="absolute top-3 right-3 text-[#999] hover:text-[#1a1a1a]"
                  >
                    <X size={18} />
                  </button>
                  {formInner}
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  if (isModal) {
    if (!isOpen || typeof document === "undefined") return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={resolvedHeadline}
        onClick={() => setOpen(false)}
      >
        <div
          className="bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-6 max-w-md w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 text-[#999] hover:text-[#1a1a1a]"
          >
            <X size={18} />
          </button>
          {formInner}
        </div>
      </div>,
      document.body,
    );
  }

  // inline (newsletter blog/about)
  return (
    <section className={`py-6 ${className}`} aria-label="Join free">
      <div className="rounded-xl border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] p-6 md:p-8">
        {formInner}
      </div>
    </section>
  );
}
