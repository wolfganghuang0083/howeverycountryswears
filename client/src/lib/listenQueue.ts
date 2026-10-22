/**
 * Batched play logging for logged-in users.
 * Plays are only counted locally; the total is sent in ONE request
 * (tracking.listenPhrasesBatch → one UPDATE users SET phrases_listened = phrases_listened + n,
 * one badge check) when LISTEN_FLUSH_AT plays accumulate, LISTEN_FLUSH_MS after the first
 * unflushed play, or when the page is hidden / unloaded. fetch keepalive survives unload.
 * Pending count mirrors to sessionStorage so a same-tab reload resends it.
 */
const ENDPOINT = "/api/trpc/tracking.listenPhrasesBatch";
const STORE_KEY = "hecs_listen_pending";
export const LISTEN_FLUSH_AT = 10;
export const LISTEN_FLUSH_MS = 30_000;
const MAX_PER_REQUEST = 500;

let pending = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let inited = false;

function persist(): void {
  try {
    if (pending > 0) sessionStorage.setItem(STORE_KEY, String(pending));
    else sessionStorage.removeItem(STORE_KEY);
  } catch { /* ignore */ }
}

export function flushListens(): void {
  if (timer) { clearTimeout(timer); timer = null; }
  if (pending <= 0) return;
  const count = Math.min(pending, MAX_PER_REQUEST);
  pending -= count;
  persist();
  const body = JSON.stringify({ json: { count } }); // superjson envelope expected by tRPC
  try {
    fetch(ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      credentials: "include",
      headers: { "content-type": "application/json" },
    }).then((r) => {
      if (!r.ok && r.status >= 500) { pending += count; persist(); scheduleFlush(); }
    }).catch(() => { pending += count; persist(); scheduleFlush(); });
  } catch { pending += count; persist(); }
  if (pending > 0) flushListens();
}

function scheduleFlush(): void {
  if (!timer && pending > 0) timer = setTimeout(flushListens, LISTEN_FLUSH_MS);
}

function init(): void {
  if (inited || typeof window === "undefined") return;
  inited = true;
  try {
    const saved = Number(sessionStorage.getItem(STORE_KEY) || 0);
    if (Number.isFinite(saved) && saved > 0) pending += Math.floor(saved);
  } catch { /* ignore */ }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushListens();
  });
  window.addEventListener("pagehide", flushListens);
  scheduleFlush();
}

/** Call once per play by a logged-in user. */
export function recordListen(): void {
  init();
  pending += 1;
  persist();
  if (pending >= LISTEN_FLUSH_AT) flushListens();
  else scheduleFlush();
}
