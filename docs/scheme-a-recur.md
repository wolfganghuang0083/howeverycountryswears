# Scheme A — Recur English Sphere Pack (Preview)

**Branch:** `feat/scheme-a-recur-en-sphere`  
**Do not** merge main · **Do not** Publish Production · **Do not** touch DNS/billing.

## Locked IDs

| Key | Value |
|---|---|
| `unlock_id` | `pack_en_sphere` |
| `experiment_id` | `hecs_a_en_sphere_v0` |
| `variant_id` | `price_699` (label only) |
| Countries | `united-states`, `united-kingdom`, `australia` |
| Recur slug | `hecs-pack-en-sphere` |
| Product id | placeholder `REPLACE_ME_HECS_EN_SPHERE` or env `RECUR_PRODUCT_ID_EN_SPHERE` |

## Pricing / analytics (placeholder until 商業席)

- Charge / GA4: **`value=219` · `currency=TWD`**
- UI dual label: `NT$219` · `$6.99` from `shared/schemeAConfig.ts` (`SCHEME_A_PRICE` + `SCHEME_A_COPY`)
- Sell copy / “why pay vs ask AI” are **TODO placeholders** — not brand-final

## Env (names only)

- `RECUR_SECRET_KEY`, `RECUR_PUBLISHABLE_KEY`, `RECUR_WEBHOOK_SECRET` (comma-separated multi-secret OK)
- `RECUR_MODE` — only `live` = live; else sandbox
- `RECUR_PRODUCT_ID_EN_SPHERE` — overrides placeholder
- `HECS_ALLOW_DEV_UNLOCK=1` — enables `unlock.devGrantPackUnlock` when `RECUR_MODE!==live`

Never reuse huabiz / Zeabur ecard product ids or secret values in code.

## Routes

| Path | Role |
|---|---|
| `/pack/en-sphere` | Pack surface + Unlock CTA |
| `/unlock/success?pack=en_sphere&session_id=…` | Success; fires `purchase` once |
| `/api/recur/webhook` | HECS-only Recur webhook (raw body + HMAC) |

## GA4 events (Scheme A)

`experiment_exposure` · `membership_unlock_click` · `begin_checkout` · `purchase` · `unlock_open`  
Helpers in `client/src/lib/analytics.ts`. P0 dual-fire events untouched.

Exposure rule (數據席): 200 exposures or 6 weeks — engineering only emits exposure correctly.

## Unlock model

- Table `pack_unlocks` (idempotent on `recur_event_id`; unique user+unlockId)
- Audio gate on US/UK/AU: need `pack_en_sphere` **OR** `bookBuyer` (admin counts as bookBuyer)
- Phrase **text** stays free preview

## Preview acceptance (狼大／商業席)

1. Deploy Preview with sandbox Recur keys + real `RECUR_PRODUCT_ID_EN_SPHERE` when available.
2. Point Recur webhook to `https://<preview-host>/api/recur/webhook`.
3. Run migration `0001_pack_unlocks.sql` on Neon Preview DB.
4. **Pass:** for each of US / UK / AU, complete **≥1** successful sandboxed checkout → webhook → `pack_unlocks` row → audio Play works while signed in.
5. **If international cards fail:** mark “國際卡不過” and note Stripe as backup (**not this week**).
6. Without product id / keys: Pack + CTA screens still render; checkout returns friendly “payment not configured”.

## Missing checklist (狼大／商業席)

- [ ] Create Recur ONE_TIME product NT$219 TWD, slug `hecs-pack-en-sphere`
- [ ] Fill `RECUR_PRODUCT_ID_EN_SPHERE` on Vercel Preview
- [ ] Set `RECUR_SECRET_KEY` / `RECUR_PUBLISHABLE_KEY` / `RECUR_WEBHOOK_SECRET` (HECS-only; not Zeabur copy-paste)
- [ ] Register webhook URL on Recur dashboard
- [ ] Confirm currency stays TWD 219 (or update `shared/schemeAConfig.ts` only)
- [ ] Rewrite Pack / CTA sell copy (replace TODOs)
- [ ] Optional: `HECS_ALLOW_DEV_UNLOCK=1` on Preview for SSO unlock testing without payment


## Landing arms (商業席 v0 — Albedo 通過)

| arm | Role | Switch |
|---|---|---|
| `node_traffic` | **Default formal** — network/node/traffic narrative | default, or `?arm=node_traffic` / `VITE_HECS_LANDING_ARM=node_traffic` |
| `feature_unlock` | Control only — feature unlock copy; not formal headline | `?arm=feature_unlock` |

GA4 Scheme A events include `arm`. Success copy forbids “unlocked” vocabulary (see `SUCCESS_COPY` in `shared/schemeAConfig.ts`).
Source: `/workspace/hecs-commercial/hecs-landing-arms-v0.html`
