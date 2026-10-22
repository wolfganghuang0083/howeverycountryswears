import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import SignupModal from "@/components/SignupModal";
import {
  SOFT_PROMPT_DISMISSED_KEY,
  SOFT_PROMPT_EVENT,
} from "@/lib/audioAccess";
import { trackSignupPromptView, trackSignupClick } from "@/lib/analytics";

const CTA_ID = "soft_prompt_after_3_plays";

/**
 * Non-blocking Join free toast after the 3rd logged-out play in a session.
 * Dismissible; not shown again in the same session after dismiss or click.
 */
export default function SoftSignupPrompt({
  locale,
  sourcePath,
}: {
  locale: string;
  sourcePath: string;
}) {
  const { isAuthenticated, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [plays, setPlays] = useState(0);
  const [showSignup, setShowSignup] = useState(false);
  const enabled = locale !== "zh-tw";

  useEffect(() => {
    if (!enabled) return;
    const onPrompt = (e: Event) => {
      if (isAuthenticated || loading) return;
      setPlays((e as CustomEvent).detail?.plays ?? 3);
      setVisible((wasVisible) => {
        if (!wasVisible) {
          trackSignupPromptView({
            surface: "soft_prompt",
            cta_id: CTA_ID,
            trigger: "play_count",
            play_count: (e as CustomEvent).detail?.plays ?? 3,
          });
        }
        return true;
      });
    };
    window.addEventListener(SOFT_PROMPT_EVENT, onPrompt);
    return () => window.removeEventListener(SOFT_PROMPT_EVENT, onPrompt);
  }, [enabled, isAuthenticated, loading]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SOFT_PROMPT_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!enabled) return null;

  return (
    <>
      {visible && !isAuthenticated ? (
        <div
          role="status"
          aria-live="polite"
          data-soft-signup-prompt
          className="fixed z-[60] left-3 right-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm rounded-xl border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] p-4"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-2 right-2 p-1 text-[#999] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </button>
          <p className="font-display text-lg text-[#1a1a1a] leading-tight m-0 mb-1 pr-6">
            Three phrases in — your ear is warming up
          </p>
          <p className="text-sm text-[#555] leading-snug m-0 mb-3">
            Join free to rate phrases, see how everyone else rated them, and keep track of what you've heard.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                trackSignupClick({ surface: "soft_prompt", cta_id: CTA_ID, play_count: plays });
                try {
                  sessionStorage.setItem(SOFT_PROMPT_DISMISSED_KEY, "1");
                } catch {
                  /* ignore */
                }
                setVisible(false);
                setShowSignup(true);
              }}
              className="inline-flex items-center gap-2 bg-[#FF1493] text-white px-4 py-2 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[0px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Join free
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-sm font-semibold text-[#666] hover:text-[#1a1a1a]"
            >
              Keep listening
            </button>
          </div>
        </div>
      ) : null}
      <SignupModal
        open={showSignup}
        onOpenChange={setShowSignup}
        surface="nav"
        ctaId={CTA_ID}
        enabled={enabled}
        locale={locale}
        sourcePath={sourcePath}
      />
    </>
  );
}
