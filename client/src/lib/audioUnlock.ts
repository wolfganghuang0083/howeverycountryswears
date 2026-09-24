/** Client-side flag: email unlock for pronunciation playback (no front-end login). */
export const AUDIO_UNLOCK_KEY = "hecs_audio_unlocked";

export function isAudioUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AUDIO_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAudioUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUDIO_UNLOCK_KEY, "1");
    window.dispatchEvent(new Event("hecs-audio-unlocked"));
  } catch {
    // ignore
  }
}

/** Subscribe to unlock changes (same tab + storage events). */
export function subscribeAudioUnlock(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === AUDIO_UNLOCK_KEY) cb();
  };
  window.addEventListener("hecs-audio-unlocked", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("hecs-audio-unlocked", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
