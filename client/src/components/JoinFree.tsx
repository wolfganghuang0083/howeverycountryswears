import { useState, FormEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mail, CheckCircle2, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  trackNewsletterCtaClick,
  trackNewsletterModalOpen,
  trackNewsletterSignup,
  trackNewsletterSubscribeSubmit,
  getPageTypeFromPath,
} from "@/lib/analytics";

export type JoinFreeSurface = "country" | "blog" | "home" | "graycard" | "about" | "footer";

type Variant = "inline" | "modal" | "sticky";

type Props = {
  surface: JoinFreeSurface;
  ctaId: string;
  country?: string;
  headline?: string;
  microcopy?: string;
  /** inline | sticky render the form card; modal opens as overlay */
  variant?: Variant;
  /** For modal: controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide on zh-tw (EN-first). Default true when enabled. */
  enabled?: boolean;
  sourcePath?: string;
  locale?: string;
  /** Secondary Kindle line under the form (inline/sticky) */
  showBookLink?: boolean;
  bookLinkLabel?: string;
  className?: string;
};

const PRIVACY = "Free. Unsubscribe anytime. We never sell your email.";
const DEFAULT_HEADLINE = "One swear word a week — free";
const DEFAULT_MICRO =
  "A new country each week, with a short cultural note. Free. Unsubscribe anytime. We never sell your email.";

export default function JoinFree({
  surface,
  ctaId,
  country,
  headline = DEFAULT_HEADLINE,
  microcopy = DEFAULT_MICRO,
  variant = "inline",
  open,
  onOpenChange,
  enabled = true,
  sourcePath,
  locale = "en",
  showBookLink = false,
  bookLinkLabel = "Prefer the full guide? Get the book on Kindle →",
  className = "",
}: Props) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewConfirmUrl, setPreviewConfirmUrl] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);

  const isModal = variant === "modal";
  const isOpen = isModal ? (open ?? internalOpen) : true;

  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (open === undefined) setInternalOpen(v);
  };

  useEffect(() => {
    if (!isModal || !isOpen) return;
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
      trackNewsletterSubscribeSubmit({
        country,
        locale,
        source_path: sourcePath || (typeof window !== "undefined" ? window.location.pathname : "/"),
      });
      trackNewsletterSignup({
        surface,
        cta_id: ctaId,
        method: "email",
        country: surface === "country" || surface === "graycard" ? country : undefined,
      });
      if (data && "previewConfirmUrl" in data && data.previewConfirmUrl) {
        setPreviewConfirmUrl(data.previewConfirmUrl as string);
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
    mutation.mutate({
      email: email.trim(),
      country,
      locale,
      sourcePath: path,
    });
  };

  const bookHref = `/go/book?surface=${encodeURIComponent(surface)}&cta_id=${encodeURIComponent(ctaId + "_book")}`;

  const formInner = (
    <>
      {done ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 text-[#FF1493]" size={36} />
          <h3 className="font-display text-2xl text-[#1a1a1a] mb-2">
            Thanks — you&apos;re on the list
          </h3>
          <p className="text-sm text-[#555] leading-relaxed">
            Check your inbox for a confirm link when sending is enabled. For now your address is saved.
          </p>
          {previewConfirmUrl ? (
            <p className="mt-3 text-xs text-[#666] break-all">
              <span className="font-bold text-[#FF1493]">Preview only: confirm link</span>
              <br />
              <a href={previewConfirmUrl} className="text-[#FF1493] underline break-all">
                {previewConfirmUrl}
              </a>
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 rounded-full bg-[#FFE500] border-2 border-[#1a1a1a] p-2 shadow-[2px_2px_0px_#1a1a1a]">
              <Mail size={18} className="text-[#1a1a1a]" />
            </div>
            <div>
              <h3 className="font-display text-xl md:text-2xl text-[#1a1a1a] mb-1">{headline}</h3>
              <p className="text-sm text-[#555] leading-relaxed">{microcopy}</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
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
                "Join free"
              )}
            </button>
          </form>
          <p className="mt-2 text-xs text-[#888]">{PRIVACY}</p>
          {error ? (
            <p className="mt-3 text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          ) : null}
          {showBookLink || isModal ? (
            <p className="mt-3 text-center">
              <a
                href={bookHref}
                className="text-xs text-[#666] hover:text-[#FF1493] underline"
              >
                {isModal ? "Or get the full book on Kindle" : bookLinkLabel}
              </a>
            </p>
          ) : null}
        </>
      )}
    </>
  );

  if (isModal) {
    if (!isOpen || typeof document === "undefined") return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={headline}
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

  if (variant === "sticky") {
    return (
      <div
        className={`fixed bottom-0 inset-x-0 z-50 md:hidden border-t-2 border-[#1a1a1a] bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.12)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${className}`}
        role="region"
        aria-label="Join free sticky"
      >
        <div className="max-w-lg mx-auto">
          {done ? (
            <p className="text-center text-sm font-bold text-[#1a1a1a]">Thanks — you&apos;re on the list</p>
          ) : (
            <form onSubmit={onSubmit} className="flex gap-2 items-center">
              <span className="hidden xs:inline text-xs font-bold text-[#1a1a1a] shrink-0">Join free</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mutation.isPending}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border-2 border-[#1a1a1a] bg-[#FAFAFA] text-sm"
                aria-label="Email"
              />
              <button
                type="submit"
                disabled={mutation.isPending || !email.trim()}
                className="shrink-0 px-4 py-2 rounded-lg font-bold text-sm bg-[#FF1493] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] disabled:opacity-60"
              >
                {mutation.isPending ? "…" : "Join free"}
              </button>
            </form>
          )}
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
          {previewConfirmUrl ? (
            <a href={previewConfirmUrl} className="block mt-1 text-[10px] text-[#FF1493] underline truncate">
              Preview only: confirm link
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  // inline
  return (
    <section className={`py-6 ${className}`} aria-label="Join free">
      <div className="rounded-xl border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] p-6 md:p-8">
        {formInner}
      </div>
    </section>
  );
}

/** Trigger button that opens JoinFree modal (for external open control). */
export function JoinFreeModalHost(
  props: Omit<Props, "variant" | "open" | "onOpenChange"> & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  },
) {
  return <JoinFree {...props} variant="modal" />;
}
