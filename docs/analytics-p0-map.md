# HECS Analytics P0 map (existing ↔ v0)

**Branch / scope:** dual-fire + holes only — keep existing event names; also fire v0 P0 aliases.  
**No UX changes. No rename of existing events.**  
**Reference:** `/workspace/HECS-最小分析架構-v0.md` §2.0–2.1

## Dual-fire (wrappers in `client/src/lib/analytics.ts`)

| Existing (keep firing) | v0 alias (also fire) | Notes |
|---|---|---|
| `phrase_play` | `audio_play` | `content_id` ← `phrase_index`; + `country`, `page_type` |
| `paywall_view` | `gray_card_view` | + `card_type` ← paywall `context`; no IntersectionObserver |
| `purchase_click` | `book_cta_click` | `cta_id`/`context`; `destination` amazon or path |
| `paywall_book_click` | `book_cta_click` | same as purchase path; destination `amazon` |
| `country_view` | `country_page_view` | + `page_path` when available |

## New P0 events (holes)

| v0 event | Trigger | Params (min) |
|---|---|---|
| `login_success` | `useAuth` `/api/auth/me` first resolves with user this browser session (`sessionStorage` + in-memory guard) | `method` (github/oauth), `page_type` |
| `blog_read` | `BlogPostPage`: once per post view when **30s** on page **OR** **50%** scroll | `post_id`/`slug`, `category`/`pill`, `country` (first), `read_seconds` |
| `book_cta_click` | via dual-fire above + BlogCta `/get-the-book` + previously untracked Amazon anchors | `cta_id`, `destination`, `country`, `page_type`, optional `content_id` |

## Verify (Preview)

1. Open a Spain blog post → wait 30s or scroll ≥50% → Network/`gtag` → `blog_read`.
2. Locked phrase gray Play / paywall → `paywall_view` + `gray_card_view`.
3. Amazon CTA (About, phrase footer, etc.) → `purchase_click` + `book_cta_click`.
4. Blog “Get the book” → same with `context=blog_cta`, `destination=/get-the-book`.
5. Signed-in session → one `login_success` per tab session (not every navigation).
