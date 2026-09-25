/**
 * Human page-view beacon for page_hits (human vs bot share).
 * - Fires after window load, in idle time; never blocks rendering.
 * - navigator.sendBeacon with fetch keepalive fallback; all errors ignored.
 * - Counts SPA route changes (history.pushState/replaceState/popstate),
 *   deduped by pathname so the initial load is counted once.
 */
const ENDPOINT = "/api/hit";
let lastPath: string | null = null;
let started = false;

function send(): void {
  try {
    const p = window.location.pathname;
    if (p === lastPath) return;
    const r = lastPath === null ? document.referrer || "" : window.location.origin + lastPath;
    lastPath = p;
    const body = JSON.stringify({ p: p.slice(0, 512), r: r.slice(0, 512) });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }))) return;
    } catch {
      /* fall through */
    }
    fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "content-type": "text/plain" } }).catch(() => {});
  } catch {
    /* ignore */
  }
}

function schedule(): void {
  if (!started) return;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback;
  if (ric) ric(send, { timeout: 3000 });
  else setTimeout(send, 50);
}

export function initPageHitBeacon(): void {
  if (typeof window === "undefined" || (window as unknown as { __hecsHit?: boolean }).__hecsHit) return;
  (window as unknown as { __hecsHit?: boolean }).__hecsHit = true;
  try {
    for (const m of ["pushState", "replaceState"] as const) {
      const orig = history[m];
      history[m] = function (this: History, ...args: Parameters<History["pushState"]>) {
        const ret = orig.apply(this, args);
        schedule();
        return ret;
      } as History["pushState"];
    }
    window.addEventListener("popstate", schedule);
    const start = () => {
      started = true;
      schedule();
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  } catch {
    /* ignore */
  }
}
