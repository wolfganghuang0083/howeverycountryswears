# Blog schedule strategy (Pages CMS)

## Chosen draft policy: `draft: false` + date gate

- New inventory posts are imported with **`draft: false`** and a future **`date`** (one post per day from **2026-09-26**).
- **Production** (`VERCEL_ENV=production`): visitors only see posts where `draft === false` **and** `date ≤ today` in **Asia/Tokyo**. Same rule for blog index, single post, related posts, and prerendered HTML / index shells.
- **Preview** (`VERCEL_ENV=preview`) and local Vite: all posts (including future dates and `draft: true`) remain visible so Pages CMS / acceptance can review the full calendar.
- **Why not `draft: true` until publish day?** Pages CMS already shows `date` + `draft` columns; keeping `draft: false` makes the calendar the single source of truth (“scheduled” = future date), avoids a second manual flip on go-live day, and matches “靠日期擋”.

## Build-time note

`import.meta.env.PROD` is true on both Vercel Preview and Production builds. Visibility uses `import.meta.env.VITE_HECS_VERCEL_ENV` (injected from `VERCEL_ENV` in `vite.config.ts`).

## Static HTML / sitemap

Prerender skips non-public posts on Production builds. A future post’s static HTML appears after a Production deploy on/after its date (or a redeploy that day). Client-side lists also filter by “today”, so after deploy the SPA stays correct as the Tokyo date rolls forward within that build’s manifest.

## Missing inventory

Numbers **#20–#41** have no READY body in the 2026-09-23 upload pack — skipped (see `docs/blog-schedule-bulk-report.json`).

## Live posts

The original **15** `content/blog/*.mdx` dated `2026-09-16` were **not overwritten** (slug match skip in `scripts/import-blog-schedule.mjs`).
