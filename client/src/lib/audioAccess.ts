/**
 * Audio access + soft signup prompt counter (traffic-first, 2026-10-22).
 * Free-country audio plays for everyone; book-exclusive (Part 8–11, non-preview)
 * audio still needs bookBuyer. Audio itself is browser Web Speech (no files).
 */
export function canPlayAudio(opts: {
  isLocked: boolean;
  isBookBuyer: boolean;
  freePreview?: boolean;
}): boolean {
  return !!opts.freePreview || opts.isBookBuyer || !opts.isLocked;
}

export const PLAY_COUNT_KEY = "hecs_session_play_count";
export const SOFT_PROMPT_DISMISSED_KEY = "hecs_soft_prompt_dismissed";
export const SOFT_PROMPT_EVENT = "hecs:soft-signup-prompt";
export const SOFT_PROMPT_AFTER_PLAYS = 3;

/** Count a logged-out play in this tab session; fire the prompt event on the 3rd. */
export function registerAnonymousPlay(): number {
  if (typeof window === "undefined") return 0;
  let n = 0;
  try {
    n = parseInt(sessionStorage.getItem(PLAY_COUNT_KEY) || "0", 10) || 0;
    n += 1;
    sessionStorage.setItem(PLAY_COUNT_KEY, String(n));
    const dismissed = sessionStorage.getItem(SOFT_PROMPT_DISMISSED_KEY) === "1";
    if (n >= SOFT_PROMPT_AFTER_PLAYS && !dismissed) {
      window.dispatchEvent(new CustomEvent(SOFT_PROMPT_EVENT, { detail: { plays: n } }));
    }
  } catch {
    /* storage blocked: no prompt */
  }
  return n;
}
