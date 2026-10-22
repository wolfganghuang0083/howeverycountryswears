/**
 * Human page-view beacon for page_hits (human vs bot share) — BATCHED.
 * - Each SPA path change (deduped by pathname) is queued with its client time.
 * - Queue flushes in ONE request: when FLUSH_AT hits are queued, FLUSH_MS after
 *   the first queued hit, or when the page is hidden / unloaded (visibilitychange, pagehide).
 * - Queue mirrors to sessionStorage so a same-tab reload/navigation that missed a flush resends it.
 * - navigator.sendBeacon with fetch keepalive fallback; all errors ignored.
 */
const ENDPOINT = "/api/hit";
const STORE_KEY = "hecs_hit_queue";
export const HIT_FLUSH_AT = 5;
export const HIT_FLUSH_MS = 30_000;
const MAX_BATCH = 20;

type Hit = { p: string; r: string; t: number };
let lastPath: string | null = null;
let started = false;
let queue: Hit[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function persist(): void {
  try {
    if (queue.length) sessionStorage.setItem(STORE_KEY, JSON.stringify(queue));
    else sessionStorage.removeItem(STORE_KEY);
  } catch { /* ignore */ }
}

function post(body: string): void {
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }))) return;
  } catch { /* fall through */ }
  try {
    fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "content-type": "text/plain" } }).catch(() => {});
  } catch { /* ignore */ }
}

export function flushPageHits(): void {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return;
  const batch = queue.splice(0, MAX_BATCH);
  persist();
  post(JSON.stringify({ hits: batch }));
  if (queue.length) flushPageHits();
}

function enqueue(): void {
  try {
    const p = window.location.pathname;
    if (p === lastPath) return;
    const r = lastPath === null ? document.referrer || "" : window.location.origin + lastPath;
    lastPath = p;
    queue.push({ p: p.slice(0, 512), r: r.slice(0, 512), t: Date.now() });
    persist();
    if (queue.length >= HIT_FLUSH_AT) flushPageHits();
    else if (!timer) timer = setTimeout(flushPageHits, HIT_FLUSH_MS);
  } catch { /* ignore */ }
}

function schedule(): void {
  if (!started) return;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback;
  if (ric) ric(enqueue, { timeout: 3000 });
  else setTimeout(enqueue, 50);
}

export function initPageHitBeacon(): void {
  if (typeof window === "undefined" || (window as unknown as { __hecsHit?: boolean }).__hecsHit) return;
  (window as unknown as { __hecsHit?: boolean }).__hecsHit = true;
  try {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]");
      if (Array.isArray(saved)) queue = saved.slice(-MAX_BATCH);
    } catch { /* ignore */ }
    for (const m of ["pushState", "replaceState"] as const) {
      const orig = history[m];
      history[m] = function (this: History, ...args: Parameters<History["pushState"]>) {
        const ret = orig.apply(this, args);
        schedule();
        return ret;
      } as History["pushState"];
    }
    window.addEventListener("popstate", schedule);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushPageHits();
    });
    window.addEventListener("pagehide", flushPageHits);
    const start = () => {
      started = true;
      if (queue.length && !timer) timer = setTimeout(flushPageHits, HIT_FLUSH_MS);
      schedule();
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  } catch { /* ignore */ }
}
