import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Shown once after Google / magic-link verify (?signup=google|email). */
export const UNLOCK_SUCCESS_TITLE = "You're unlocked.";
export const UNLOCK_SUCCESS_DESCRIPTION =
  "We also sent a welcome email. You can play pronunciations now — no need to wait for the inbox.";

/**
 * Fires a success toast when the auth callback lands with signup=google|email.
 * Captures the query on first paint (before useAuth strips it).
 * Does not touch MAIL_SEND_ENABLED or send any mail.
 */
export default function UnlockSuccessNotice() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    try {
      const q = new URLSearchParams(window.location.search);
      const signup = q.get("signup");
      if (signup !== "google" && signup !== "email") return;
      fired.current = true;
      toast.success(UNLOCK_SUCCESS_TITLE, {
        description: UNLOCK_SUCCESS_DESCRIPTION,
        duration: 10000,
        id: "hecs-unlock-success",
      });
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
